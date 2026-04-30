<?php

namespace Database\Seeders;

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
        // Create admin account
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@bagipangan.id',
            'password' => bcrypt('Admin@12345'),
            'role' => 'admin',
            'is_admin' => true,
            'is_active' => true,
        ]);

        // Create donatur (donor) account
        User::factory()->create([
            'name' => 'Donatur Test',
            'email' => 'donatur@bagipangan.id',
            'password' => bcrypt('Donatur@12345'),
            'role' => 'donatur',
            'is_admin' => false,
            'is_active' => true,
            'phone' => '+62812345678',
            'city' => 'Jakarta',
            'organization' => 'PT Contoh',
            'job' => 'Manager',
            'company_name' => 'PT Contoh Indonesia',
            'company_address' => 'Jalan Contoh No. 123, Jakarta',
        ]);

        // Create penerima (receiver) account
        User::factory()->create([
            'name' => 'Penerima Test',
            'email' => 'penerima@bagipangan.id',
            'password' => bcrypt('Penerima@12345'),
            'role' => 'penerima',
            'is_admin' => false,
            'is_active' => true,
            'phone' => '+62887654321',
            'city' => 'Bandung',
            'address' => 'Jalan Keluarga No. 45',
            'neighborhood' => 'RW 02',
            'district' => 'Kelurahan Maju',
            'postal_code' => '40123',
            'need_category' => 'food',
            'need_description' => 'Kebutuhan makanan sehari-hari untuk keluarga',
            'is_verified_receiver' => true,
            'verification_date' => now(),
        ]);

        // Create test user
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
    }
}
