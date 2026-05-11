<?php

namespace Tests\Feature;

use App\Models\Donation;
use App\Models\DonationCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DonationIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_filters_by_keyword_in_title_or_description(): void
    {
        Donation::factory()->create([
            'title' => 'Nasi Kotak Lebih',
            'description' => 'Donasi makanan acara kantor',
            'status' => Donation::STATUS_APPROVED,
        ]);
        Donation::factory()->create([
            'title' => 'Roti Tawar',
            'description' => 'Fresh bakery',
            'status' => Donation::STATUS_APPROVED,
        ]);

        $this->getJson('/api/donations?q=nasi')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Nasi Kotak Lebih');
    }

    public function test_it_searches_for_literal_zero_string(): void
    {
        Donation::factory()->create([
            'title' => 'Paket 2026',
            'description' => 'Nasi untuk acara',
            'status' => Donation::STATUS_APPROVED,
        ]);
        Donation::factory()->create([
            'title' => 'Paket 0 rupiah',
            'description' => 'Promo donasi',
            'status' => Donation::STATUS_APPROVED,
        ]);

        $response = $this->getJson('/api/donations?q=0');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Paket 0 rupiah');
    }

    public function test_it_treats_keyword_wildcards_as_literal_characters(): void
    {
        Donation::factory()->create([
            'title' => 'Paket 100 Premium',
            'description' => 'Tanpa simbol persen',
            'status' => Donation::STATUS_APPROVED,
        ]);
        Donation::factory()->create([
            'title' => 'Paket 100% Halal',
            'description' => 'Ada simbol persen',
            'status' => Donation::STATUS_APPROVED,
        ]);

        $this->getJson('/api/donations?q=100%')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Paket 100% Halal');
    }

    public function test_it_filters_by_category_id(): void
    {
        $bread = DonationCategory::factory()->create(['name' => 'Roti & Kue']);
        $readyMeals = DonationCategory::factory()->create(['name' => 'Makanan Siap Saji']);

        Donation::factory()->create([
            'category_id' => $bread->id,
            'status' => Donation::STATUS_APPROVED,
        ]);
        Donation::factory()->create([
            'category_id' => $readyMeals->id,
            'status' => Donation::STATUS_APPROVED,
        ]);

        $this->getJson("/api/donations?category_id={$bread->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.category_id', $bread->id);
    }

    public function test_it_filters_by_city_from_donation_or_donor_city(): void
    {
        $bandungDonor = User::factory()->create(['city' => 'Bandung']);
        $jakartaDonor = User::factory()->create(['city' => 'Jakarta']);

        Donation::factory()->create([
            'user_id' => $bandungDonor->id,
            'location_city' => 'Cimahi',
            'status' => Donation::STATUS_APPROVED,
        ]);
        Donation::factory()->create([
            'user_id' => $jakartaDonor->id,
            'location_city' => 'Bandung',
            'status' => Donation::STATUS_APPROVED,
        ]);
        Donation::factory()->create([
            'user_id' => $jakartaDonor->id,
            'location_city' => 'Bekasi',
            'status' => Donation::STATUS_APPROVED,
        ]);

        $this->getJson('/api/donations?city=bandung')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_it_treats_city_wildcards_as_literal_characters(): void
    {
        Donation::factory()->create([
            'location_city' => 'SaoPaulo',
            'status' => Donation::STATUS_APPROVED,
        ]);
        Donation::factory()->create([
            'location_city' => 'Sao_Paulo',
            'status' => Donation::STATUS_APPROVED,
        ]);

        $this->getJson('/api/donations?city=sao_paulo')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.location_city', 'Sao_Paulo');
    }

    public function test_it_sorts_by_expiry_soon_and_returns_pagination_fields(): void
    {
        $expiresLater = Donation::factory()->create([
            'status' => Donation::STATUS_APPROVED,
            'available_until' => now()->addHours(10),
        ]);
        $expiresSoon = Donation::factory()->create([
            'status' => Donation::STATUS_APPROVED,
            'available_until' => now()->addHours(2),
        ]);
        Donation::factory()->create([
            'status' => Donation::STATUS_PENDING,
            'available_until' => now()->addHour(),
        ]);

        $response = $this->getJson('/api/donations?sort=expiry_soon&per_page=1');

        $response->assertOk()
            ->assertJsonPath('current_page', 1)
            ->assertJsonPath('last_page', 2)
            ->assertJsonPath('per_page', 1)
            ->assertJsonPath('total', 2)
            ->assertJsonPath('data.0.id', $expiresSoon->id);

        $this->getJson('/api/donations?sort=expiry_soon&per_page=1&page=2')
            ->assertOk()
            ->assertJsonPath('current_page', 2)
            ->assertJsonPath('last_page', 2)
            ->assertJsonPath('total', 2)
            ->assertJsonPath('data.0.id', $expiresLater->id);
    }
}
