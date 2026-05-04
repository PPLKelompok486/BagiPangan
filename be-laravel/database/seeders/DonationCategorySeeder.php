<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\DonationCategory;

class DonationCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'Makanan Siap Saji', 'description' => 'Nasi bungkus, lauk pauk, dll'],
            ['name' => 'Bahan Pokok', 'description' => 'Beras, minyak, telur, dll'],
            ['name' => 'Sayur & Buah', 'description' => 'Hasil tani segar'],
            ['name' => 'Roti & Kue', 'description' => 'Produk bakery dan camilan'],
        ];

        foreach ($categories as $cat) {
            DonationCategory::updateOrCreate([
                'slug' => Str::slug($cat['name']),
            ], [
                'name' => $cat['name'],
                'description' => $cat['description'],
                'is_active' => true,
            ]);
        }
    }
}
