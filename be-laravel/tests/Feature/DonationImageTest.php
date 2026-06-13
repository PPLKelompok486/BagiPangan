<?php

namespace Tests\Feature;

use App\Models\Donation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class DonationImageTest extends TestCase
{
    use RefreshDatabase;

    private array $uploadedPaths = [];

    private function fakePng(string $name): UploadedFile
    {
        $pngBytes = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII='
        );

        return UploadedFile::fake()->createWithContent($name, $pngBytes);
    }

    private function rememberUpload(?string $path): void
    {
        if ($path) {
            $this->uploadedPaths[] = public_path($path);
        }
    }

    protected function tearDown(): void
    {
        foreach (array_unique($this->uploadedPaths) as $path) {
            if (is_file($path)) {
                unlink($path);
            }
        }

        $dir = public_path('uploads/donations');
        if (is_dir($dir) && count(array_diff(scandir($dir) ?: [], ['.', '..', '.gitignore'])) === 0) {
            rmdir($dir);
        }

        parent::tearDown();
    }

    public function test_donor_can_create_donation_with_image(): void
    {
        $donor = User::factory()->create(['role' => 'donatur']);
        $donor->forceFill(['remember_token' => hash('sha256', 'test-token')])->save();

        $imageFile = $this->fakePng('rice_box.png');

        $response = $this
            ->withHeaders(['Authorization' => 'Bearer test-token'])
            ->postJson('/api/donations', [
                'title' => 'Nasi Kotak Ayam Bakar',
                'description' => 'Ayam bakar sambal lalap',
                'location_city' => 'Jakarta Selatan',
                'location_address' => 'Jl. Sudirman No. 12',
                'available_from' => now()->toIso8601String(),
                'available_until' => now()->addHours(4)->toIso8601String(),
                'portion_count' => 10,
                'image' => $imageFile,
            ]);

        $response->assertStatus(201);
        $data = $response->json('data');

        $this->assertNotNull($data['image']);
        $this->assertStringStartsWith('/uploads/donations/donation_', $data['image']);
        $this->rememberUpload($data['image']);
        $this->assertFileExists(public_path($data['image']));
    }

    public function test_donor_can_update_donation_image(): void
    {
        $donor = User::factory()->create(['role' => 'donatur']);
        $donor->forceFill(['remember_token' => hash('sha256', 'test-token')])->save();

        // Create initial donation with image
        $initialImage = $this->fakePng('old_food.png');
        $dir = public_path('uploads/donations');
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        $oldName = 'donation_test_old_' . uniqid() . '.png';
        $initialImage->move($dir, $oldName);
        $oldImagePath = '/uploads/donations/' . $oldName;
        $this->rememberUpload($oldImagePath);

        $donation = Donation::create([
            'user_id' => $donor->id,
            'title' => 'Roti Manis',
            'description' => 'Roti aneka rasa',
            'location_city' => 'Depok',
            'location_address' => 'Margonda',
            'available_from' => now(),
            'available_until' => now()->addHours(2),
            'portion_count' => 5,
            'image' => $oldImagePath,
            'status' => 'pending',
        ]);

        $this->assertFileExists(public_path($oldImagePath));

        // Update with new image
        $newImage = $this->fakePng('new_food.png');

        // We use POST with _method = PUT to simulate multipart PUT request spoofing
        $response = $this
            ->withHeaders(['Authorization' => 'Bearer test-token'])
            ->postJson("/api/donations/{$donation->id}", [
                '_method' => 'PUT',
                'title' => 'Roti Tawar',
                'image' => $newImage,
            ]);

        $response->assertStatus(200);
        $updatedData = $response->json('data');
        $this->rememberUpload($updatedData['image']);

        $this->assertNotEquals($oldImagePath, $updatedData['image']);
        $this->assertFileDoesNotExist(public_path($oldImagePath)); // Old file deleted
        $this->assertFileExists(public_path($updatedData['image'])); // New file exists
    }

    public function test_donor_can_delete_donation_image(): void
    {
        $donor = User::factory()->create(['role' => 'donatur']);
        $donor->forceFill(['remember_token' => hash('sha256', 'test-token')])->save();

        $initialImage = $this->fakePng('food.png');
        $dir = public_path('uploads/donations');
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        $name = 'donation_test_to_delete_' . uniqid() . '.png';
        $initialImage->move($dir, $name);
        $imagePath = '/uploads/donations/' . $name;
        $this->rememberUpload($imagePath);

        $donation = Donation::create([
            'user_id' => $donor->id,
            'title' => 'Buah Pisang',
            'description' => 'Satu sisir pisang mas',
            'location_city' => 'Bandung',
            'location_address' => 'Dago',
            'available_from' => now(),
            'available_until' => now()->addHours(6),
            'portion_count' => 1,
            'image' => $imagePath,
            'status' => 'pending',
        ]);

        $this->assertFileExists(public_path($imagePath));

        // Delete image via PUT request spoofing
        $response = $this
            ->withHeaders(['Authorization' => 'Bearer test-token'])
            ->postJson("/api/donations/{$donation->id}", [
                '_method' => 'PUT',
                'delete_image' => 'true',
            ]);

        $response->assertStatus(200);
        $updatedData = $response->json('data');

        $this->assertNull($updatedData['image']);
        $this->assertFileDoesNotExist(public_path($imagePath)); // File deleted
    }

    public function test_deleting_donation_deletes_image_file(): void
    {
        $donor = User::factory()->create(['role' => 'donatur']);
        
        $initialImage = $this->fakePng('food.png');
        $dir = public_path('uploads/donations');
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        $name = 'donation_test_orphan_' . uniqid() . '.png';
        $initialImage->move($dir, $name);
        $imagePath = '/uploads/donations/' . $name;
        $this->rememberUpload($imagePath);

        $donation = Donation::create([
            'user_id' => $donor->id,
            'title' => 'Sayur Sop',
            'description' => 'Bahan sayur sop segar',
            'location_city' => 'Bekasi',
            'location_address' => 'Kranji',
            'available_from' => now(),
            'available_until' => now()->addHours(3),
            'portion_count' => 3,
            'image' => $imagePath,
            'status' => 'pending',
        ]);

        $this->assertFileExists(public_path($imagePath));

        // Delete the donation model
        $donation->delete();

        // Physical file should be deleted automatically
        $this->assertFileDoesNotExist(public_path($imagePath));
    }
}
