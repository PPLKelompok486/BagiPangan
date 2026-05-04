<?php

namespace Database\Seeders;

use App\Models\Donation;
use App\Models\DonationCategory;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            DonationCategorySeeder::class,
            UserSeeder::class,
            DonationSeeder::class,
        ]);

        $admin = User::where('email', 'admin@bagipangan.id')->first();
        $donatur = User::where('email', 'donatur@bagipangan.id')->first();

        $readyMeals = DonationCategory::where('slug', 'makanan-siap-saji')->first();
        $vegetables = DonationCategory::where('slug', 'sayur-buah')->first();
        $bakery = DonationCategory::where('slug', 'roti-kue')->first();

        $samples = [
            [
                'category_id' => $readyMeals?->id,
                'title' => 'Nasi Kotak Sisa Acara',
                'description' => 'Nasi kotak masih tersegel dari acara kantor siang ini.',
                'location_city' => 'Jakarta Pusat',
                'location_address' => 'Jl. Medan Merdeka Selatan, Gambir',
                'latitude' => -6.1805113,
                'longitude' => 106.8283831,
                'address_detail' => 'Lobi gedung, hubungi resepsionis.',
                'portion_count' => 15,
                'available_from' => now(),
                'available_until' => now()->addHours(8),
                'status' => 'approved',
            ],
            [
                'category_id' => $vegetables?->id,
                'title' => 'Sayur Segar Pasar Pagi',
                'description' => 'Paket sayur campur layak konsumsi untuk dimasak hari ini.',
                'location_city' => 'Jakarta Selatan',
                'location_address' => 'Jl. Tebet Raya, Tebet',
                'latitude' => -6.2320846,
                'longitude' => 106.8486508,
                'address_detail' => 'Kios hijau dekat pintu timur.',
                'portion_count' => 24,
                'available_from' => now()->subMinutes(30),
                'available_until' => now()->addHours(5),
                'status' => 'approved',
            ],
            [
                'category_id' => $bakery?->id,
                'title' => 'Roti Tawar Bakery',
                'description' => 'Roti produksi pagi, cocok untuk sarapan komunitas.',
                'location_city' => 'Jakarta Barat',
                'location_address' => 'Jl. Tanjung Duren Raya',
                'latitude' => -6.1763944,
                'longitude' => 106.7905183,
                'address_detail' => 'Ambil di kasir utama.',
                'portion_count' => 18,
                'available_from' => now(),
                'available_until' => now()->addHours(12),
                'status' => 'approved',
            ],
        ];

        foreach ($samples as $sample) {
            Donation::create($sample + [
                'user_id' => $donatur->id,
                'approved_by' => $admin->id,
                'approved_at' => now(),
            ]);
        }
    }
}
