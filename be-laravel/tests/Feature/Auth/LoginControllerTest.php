<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class LoginControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'login@example.com',
            'password' => Hash::make('Password123'),
            'role' => 'donatur',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'Password123',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Login berhasil')
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role']]);

        $this->assertNotNull($user->fresh()->remember_token);
    }

    public function test_account_is_temporarily_locked_after_repeated_failed_logins(): void
    {
        $user = User::factory()->create([
            'email' => 'locked@example.com',
            'password' => Hash::make('Password123'),
            'is_active' => true,
        ]);

        RateLimiter::clear('login:' . strtolower($user->email) . '|127.0.0.1');

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->postJson('/api/login', [
                'email' => $user->email,
                'password' => 'WrongPassword123',
            ])->assertStatus(401);
        }

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'Password123',
        ])
            ->assertStatus(429)
            ->assertJsonPath('message', 'Akun terkunci sementara karena terlalu banyak percobaan login gagal.');
    }

    public function test_login_succeeds_after_lockout_window_is_cleared(): void
    {
        $user = User::factory()->create([
            'email' => 'recovered@example.com',
            'password' => Hash::make('Password123'),
            'is_active' => true,
        ]);
        $key = 'login:' . strtolower($user->email) . '|127.0.0.1';

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            RateLimiter::hit($key, 60);
        }

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'Password123',
        ])->assertStatus(429);

        RateLimiter::clear($key);

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'Password123',
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Login berhasil');
    }
}
