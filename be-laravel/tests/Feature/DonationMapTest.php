<?php

namespace Tests\Feature;

use App\Models\Donation;
use App\Models\DonationCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DonationMapTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private string $token = 'map-test-token';

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['role' => 'penerima']);
        $this->user->forceFill(['remember_token' => $this->token])->save();
    }

    public function test_map_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/donations/map')
            ->assertStatus(401);
    }

    public function test_map_endpoint_returns_available_donations_with_valid_coordinates(): void
    {
        $category = DonationCategory::factory()->create(['name' => 'Makanan Siap Saji']);
        $visible = Donation::factory()->create([
            'category_id' => $category->id,
            'title' => 'Nasi Kotak Sisa Acara',
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'status' => 'approved',
            'portion_count' => 15,
        ]);
        Donation::factory()->create(['latitude' => null, 'longitude' => 106.8, 'status' => 'approved']);
        Donation::factory()->create(['latitude' => -6.2, 'longitude' => null, 'status' => 'approved']);
        Donation::factory()->create(['latitude' => -6.2, 'longitude' => 106.8, 'status' => 'pending']);

        $response = $this->withMapAuth()->getJson('/api/donations/map');

        $response->assertOk()
            ->assertJsonPath('type', 'FeatureCollection')
            ->assertJsonCount(1, 'features')
            ->assertJsonPath('features.0.geometry.coordinates.0', 106.8456)
            ->assertJsonPath('features.0.geometry.coordinates.1', -6.2088)
            ->assertJsonPath('features.0.properties.id', $visible->id)
            ->assertJsonPath('features.0.properties.title', 'Nasi Kotak Sisa Acara')
            ->assertJsonPath('features.0.properties.category', 'Makanan Siap Saji')
            ->assertJsonPath('features.0.properties.status', 'available')
            ->assertJsonPath('features.0.properties.portion', 15);
    }

    public function test_map_endpoint_filters_by_category_status_keyword_and_bbox(): void
    {
        $readyMeals = DonationCategory::factory()->create(['name' => 'Makanan Siap Saji']);
        $bakery = DonationCategory::factory()->create(['name' => 'Roti & Kue']);

        $claimedInsideBox = Donation::factory()->create([
            'category_id' => $bakery->id,
            'title' => 'Roti Manis Bakery',
            'description' => 'Roti untuk sarapan',
            'latitude' => -6.2000,
            'longitude' => 106.8200,
            'status' => 'claimed',
        ]);
        Donation::factory()->create([
            'category_id' => $readyMeals->id,
            'title' => 'Nasi kotak',
            'latitude' => -6.2000,
            'longitude' => 106.8200,
            'status' => 'claimed',
        ]);
        Donation::factory()->create([
            'category_id' => $bakery->id,
            'title' => 'Roti luar kota',
            'latitude' => -7.0000,
            'longitude' => 107.5000,
            'status' => 'claimed',
        ]);
        Donation::factory()->create([
            'category_id' => $bakery->id,
            'title' => 'Roti pending',
            'latitude' => -6.2000,
            'longitude' => 106.8200,
            'status' => 'pending',
        ]);

        $response = $this->withMapAuth()->getJson(
            "/api/donations/map?status=claimed&category_id={$bakery->id}&q=bakery&bbox=106.7,-6.3,106.9,-6.1"
        );

        $response->assertOk()
            ->assertJsonCount(1, 'features')
            ->assertJsonPath('features.0.properties.id', $claimedInsideBox->id)
            ->assertJsonPath('features.0.properties.status', 'claimed');
    }

    public function test_map_detail_endpoint_returns_popup_payload(): void
    {
        $donation = Donation::factory()->create([
            'title' => 'Sayur Segar',
            'latitude' => -6.21,
            'longitude' => 106.84,
            'status' => 'approved',
        ]);

        $this->withMapAuth()
            ->getJson("/api/donations/{$donation->id}/map-detail")
            ->assertOk()
            ->assertJsonPath('data.id', $donation->id)
            ->assertJsonPath('data.title', 'Sayur Segar')
            ->assertJsonPath('data.status', 'available');
    }

    public function test_map_endpoint_is_rate_limited(): void
    {
        $limitedUser = User::factory()->create(['role' => 'penerima']);
        $limitedUser->forceFill(['remember_token' => 'limited-map-token'])->save();

        $pendingResponse = null;
        for ($i = 0; $i < 61; $i++) {
            $pendingResponse = $this
                ->withHeaders(['Authorization' => 'Bearer limited-map-token'])
                ->withServerVariables(['REMOTE_ADDR' => '203.0.113.50'])
                ->getJson('/api/donations/map');
        }

        $pendingResponse?->assertStatus(429);
    }

    private function withMapAuth(): self
    {
        return $this->withHeaders(['Authorization' => 'Bearer ' . $this->token])
            ->withServerVariables(['REMOTE_ADDR' => '203.0.113.10']);
    }
}
