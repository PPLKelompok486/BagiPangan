<?php

namespace Database\Seeders;

use App\Models\Donation;
use App\Models\DonationCategory;
use App\Models\User;
use Illuminate\Database\Seeder;

class DonationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $donator = User::where('email', 'donatur@bagipangan.id')->first();
        $admin = User::where('email', 'admin@bagipangan.id')->first();
        $category = DonationCategory::first();

        $donations = [
            [
                'title' => 'Nasi Goreng Enak',
                'description' => 'Nasi goreng berkualitas tinggi dengan lauk lengkap',
                'location_city' => 'Jakarta',
                'location_address' => 'Jalan Merdeka No. 123, Jakarta Pusat',
                'portion_count' => 10,
                'status' => Donation::STATUS_PENDING,
            ],
            [
                'title' => 'Beras Premium 25kg',
                'description' => 'Beras berkualitas premium, panen baru',
                'location_city' => 'Bandung',
                'location_address' => 'Jalan Raya Lembang No. 45, Bandung',
                'portion_count' => 5,
                'status' => Donation::STATUS_APPROVED,
                'approved_by' => $admin->id,
                'approved_at' => now(),
            ],
            [
                'title' => 'Buah Apel Lokal',
                'description' => 'Apel segar dari perkebunan lokal',
                'location_city' => 'Malang',
                'location_address' => 'Jalan Ahmad Yani No. 78, Malang',
                'portion_count' => 20,
                'status' => Donation::STATUS_REJECTED,
                'rejected_reason' => 'Kondisi buah kurang baik, terlalu matang',
            ],
            [
                'title' => 'Roti Tawar Segar',
                'description' => 'Roti tawar hangat, baru keluar dari oven',
                'location_city' => 'Surabaya',
                'location_address' => 'Jalan Thamrin No. 56, Surabaya',
                'portion_count' => 15,
                'status' => Donation::STATUS_CLAIMED,
            ],
            [
                'title' => 'Telur Ayam Segar',
                'description' => 'Telur ayam berkualitas premium grade A',
                'location_city' => 'Yogyakarta',
                'location_address' => 'Jalan Malioboro No. 100, Yogyakarta',
                'portion_count' => 30,
                'status' => Donation::STATUS_COMPLETED,
            ],
            [
                'title' => 'Minyak Goreng Kemasan 2L',
                'description' => 'Minyak goreng merah premium',
                'location_city' => 'Jakarta',
                'location_address' => 'Jalan Gatot Subroto No. 99, Jakarta Selatan',
                'portion_count' => 8,
                'status' => Donation::STATUS_CANCELLED,
            ],
        ];

        foreach ($donations as $donation) {
            Donation::create([
                'user_id' => $donator->id,
                'category_id' => $category->id,
                ...$donation,
            ]);
        }
    }
}
