<?php

namespace Database\Factories;

use App\Models\Donation;
use App\Models\DonationCategory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Donation>
 */
class DonationFactory extends Factory
{
    protected $model = Donation::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory()->state(['role' => 'donatur']),
            'category_id' => DonationCategory::factory(),
            'title' => fake()->randomElement([
                'Nasi kotak sisa acara',
                'Roti tawar bakery',
                'Sayur segar pasar pagi',
                'Paket lauk matang',
            ]),
            'description' => fake()->sentence(12),
            'location_city' => 'Jakarta',
            'location_address' => fake()->streetAddress(),
            'latitude' => fake()->randomFloat(7, -6.35, -6.10),
            'longitude' => fake()->randomFloat(7, 106.70, 106.95),
            'address_detail' => fake()->optional()->sentence(),
            'available_from' => now()->subHour(),
            'available_until' => now()->addHours(6),
            'portion_count' => fake()->numberBetween(4, 40),
            'status' => 'approved',
            'approved_at' => now(),
        ];
    }
}
