<?php

namespace Database\Factories;

use App\Models\DonationCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<DonationCategory>
 */
class DonationCategoryFactory extends Factory
{
    protected $model = DonationCategory::class;

    public function definition(): array
    {
        $name = fake()->unique()->randomElement([
            'Makanan Siap Saji',
            'Bahan Pokok',
            'Sayur & Buah',
            'Roti & Kue',
        ]) . ' ' . fake()->unique()->numberBetween(1, 999);

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'is_active' => true,
        ];
    }
}
