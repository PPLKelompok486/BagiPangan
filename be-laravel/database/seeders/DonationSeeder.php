<?php

namespace Database\Seeders;

use App\Models\Donation;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DonationSeeder extends Seeder
{
    public function run(): void
    {
        $donor = User::firstOrCreate(
            ['email' => 'donor@bagipangan.test'],
            [
                'role' => 'donatur',
                'name' => 'Dapur Berkah',
                'password' => Hash::make('Password123'),
                'phone' => '0811000001',
                'city' => 'Depok',
                'organization' => 'Dapur Berkah',
                'job' => null,
            ],
        );

        User::firstOrCreate(
            ['email' => 'receiver@bagipangan.test'],
            [
                'role' => 'penerima',
                'name' => 'Penerima Demo',
                'password' => Hash::make('Password123'),
                'phone' => '0811000002',
                'city' => 'Depok',
                'organization' => null,
                'job' => 'Mahasiswa',
            ],
        );

        $samples = [
            ['Nasi Kotak Sisa Acara', '6 porsi', 'Nasi ayam, sayur, sambal. Masih hangat.', 'Jl. Margonda Raya 100, Depok', '+2 hours'],
            ['Roti Tawar Belum Dibuka', '8 bungkus', 'Roti dari toko, kemasan utuh.', 'Jl. Juanda 22, Depok', '+5 hours'],
            ['Buah Pisang Matang', '3 sisir', 'Pisang ambon, perlu segera dikonsumsi.', 'Jl. Tole Iskandar 14, Depok', '+1 day'],
            ['Catering Lebih Acara Kantor', '20 porsi', 'Nasi rames lengkap.', 'Jl. Sudirman 5, Jakarta', '+3 hours'],
            ['Sayur Matang', '5 porsi', 'Tumis kangkung & oseng tempe.', 'Jl. Gandaria 9, Jakarta', '+4 hours'],
            ['Donat Sisa Toko', '2 lusin', 'Aneka rasa, kemasan box.', 'Jl. Kemang 12, Jakarta', '+6 hours'],
        ];

        foreach ($samples as [$title, $qty, $desc, $addr, $when]) {
            Donation::create([
                'donor_id' => $donor->id,
                'title' => $title,
                'description' => $desc,
                'quantity' => $qty,
                'pickup_address' => $addr,
                'pickup_time' => now()->modify($when),
                'status' => 'available',
            ]);
        }
    }
}
