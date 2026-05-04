<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin account
        User::updateOrCreate(
            ['email' => 'admin@bagipangan.id'],
            [
                'name' => 'Admin User',
                'password' => bcrypt('Admin@12345'),
                'role' => 'admin',
                'is_admin' => true,
                'is_active' => true,
            ],
        );

        // Create donatur (donor) account
        User::updateOrCreate(
            ['email' => 'donatur@bagipangan.id'],
            [
                'name' => 'Donatur Test',
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
            ],
        );

        // Create penerima (receiver) account
        User::updateOrCreate(
            ['email' => 'penerima@bagipangan.id'],
            [
                'name' => 'Penerima Test',
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
            ],
        );

        // Create test user
        User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => bcrypt('Test@12345'),
                'role' => 'donatur',
                'is_admin' => false,
                'is_active' => true,
            ],
        );

        User::factory()
            ->count(5)
            ->state(fn () => [
                'role' => fake()->randomElement(['donatur', 'penerima']),
                'is_admin' => false,
                'is_active' => true,
                'city' => fake()->city(),
            ])
            ->create();
    }
}
