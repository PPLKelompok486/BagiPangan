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

    protected function setUp(): void
    {
        parent::setUp();
        // Clear public upload folder if any test files exist
        $dir = public_path('uploads/donations');
        if (is_dir($dir)) {
            $files = glob($dir . '/*');
            foreach ($files as $file) {
                if (is_file($file)) {
                    unlink($file);
                }
            }
        }
    }

    protected function tearDown(): void
    {
        // Cleanup test uploads
        $dir = public_path('uploads/donations');
        if (is_dir($dir)) {
            $files = glob($dir . '/*');
            foreach ($files as $file) {
                if (is_file($file)) {
                    unlink($file);
                }
            }
            rmdir($dir);
        }
        parent::tearDown();
    }

    public function test_donor_can_create_donation_with_image(): void
    {
        $donor = User::factory()->create(['role' => 'donatur']);
        $donor->forceFill(['remember_token' => hash('sha256', 'test-token')])->save();

        $imageFile = UploadedFile::fake()->image('rice_box.jpg', 600, 600);

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
        $this->assertFileExists(public_path($data['image']));
    }

    public function test_donor_can_update_donation_image(): void
    {
        $donor = User::factory()->create(['role' => 'donatur']);
        $donor->forceFill(['remember_token' => hash('sha256', 'test-token')])->save();

        // Create initial donation with image
        $initialImage = UploadedFile::fake()->image('old_food.jpg');
        $dir = public_path('uploads/donations');
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        $oldName = 'donation_old_' . time() . '.jpg';
        $initialImage->move($dir, $oldName);
        $oldImagePath = '/uploads/donations/' . $oldName;

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
        $newImage = UploadedFile::fake()->image('new_food.jpg');

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

        $this->assertNotEquals($oldImagePath, $updatedData['image']);
        $this->assertFileDoesNotExist(public_path($oldImagePath)); // Old file deleted
        $this->assertFileExists(public_path($updatedData['image'])); // New file exists
    }

    public function test_donor_can_delete_donation_image(): void
    {
        $donor = User::factory()->create(['role' => 'donatur']);
        $donor->forceFill(['remember_token' => hash('sha256', 'test-token')])->save();

        $initialImage = UploadedFile::fake()->image('food.jpg');
        $dir = public_path('uploads/donations');
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        $name = 'donation_to_delete_' . time() . '.jpg';
        $initialImage->move($dir, $name);
        $imagePath = '/uploads/donations/' . $name;

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
        
        $initialImage = UploadedFile::fake()->image('food.jpg');
        $dir = public_path('uploads/donations');
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        $name = 'donation_orphan_' . time() . '.jpg';
        $initialImage->move($dir, $name);
        $imagePath = '/uploads/donations/' . $name;

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
