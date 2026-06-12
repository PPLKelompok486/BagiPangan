<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ResetPasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_reset_password_500_does_not_leak_exception_message(): void
    {
        $user = User::factory()->create(['email' => 'leak@example.com']);

        // Insert a valid token row so we get past the early returns and
        // reach the User update path; then break it.
        $token = 'plain-token-leak';
        DB::table('password_reset_tokens')->insert([
            'email' => $user->email,
            'token' => Hash::make($token),
            'created_at' => now(),
        ]);

        // Force the update to throw with a recognisable secret string by
        // making the User model unsaveable: drop the users table mid-flight.
        DB::statement('DROP TABLE users');

        $response = $this->postJson('/api/reset-password', [
            'email' => $user->email,
            'token' => $token,
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertStatus(500);
        $body = $response->json('message');
        $this->assertSame('Terjadi kesalahan server.', $body);
        $this->assertStringNotContainsString('users', $body);
        $this->assertStringNotContainsString('SQLSTATE', $body);
    }

    public function test_reset_password_succeeds_against_password_reset_tokens_table(): void
    {
        $user = User::factory()->create([
            'email' => 'reset-ok@example.com',
            'password' => Hash::make('old-password-123'),
        ]);

        $token = 'happy-path-token';
        DB::table('password_reset_tokens')->insert([
            'email' => $user->email,
            'token' => Hash::make($token),
            'created_at' => now(),
        ]);

        $response = $this->postJson('/api/reset-password', [
            'email' => $user->email,
            'token' => $token,
            'password' => 'new-password-456',
            'password_confirmation' => 'new-password-456',
        ]);

        $response->assertOk();
        $this->assertDatabaseMissing('password_reset_tokens', [
            'email' => $user->email,
        ]);
        $this->assertTrue(Hash::check('new-password-456', $user->fresh()->password));
    }
}
