<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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

        $now = now();
        $rows = array_map(
            fn (array $cat) => [
                'name' => $cat['name'],
                'slug' => Str::slug($cat['name']),
                'description' => $cat['description'],
                'created_at' => $now,
                'updated_at' => $now,
            ],
            $categories,
        );

        DB::table('donation_categories')->upsert(
            $rows,
            ['slug'],
            ['name', 'description', 'updated_at'],
        );
    }
}
