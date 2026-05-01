<?php

namespace Database\Factories;

use App\Models\FundDonation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\FundDonation>
 */
class FundDonationFactory extends Factory
{
    protected $model = FundDonation::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'donor_name' => $this->faker->name(),
            'amount' => $this->faker->numberBetween(10000, 1000000),
            'donation_date' => $this->faker->date(),
            'payment_method' => $this->faker->randomElement(['gopay', 'shopeepay', 'bank_transfer', 'credit_card']),
            'payment_status' => 'pending',
            'snap_token' => $this->faker->uuid(),
        ];
    }
}
