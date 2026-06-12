<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ForgotPasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_does_not_leak_token_when_debug_disabled(): void
    {
        config(['app.debug' => false]);

        $user = User::factory()->create(['email' => 'reset@example.com']);

        $response = $this->postJson('/api/forgot-password', [
            'email' => $user->email,
        ]);

        $response->assertOk();
        $response->assertJsonMissingPath('debug_token');
        $response->assertJsonStructure(['message']);

        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => $user->email,
        ]);
    }

    public function test_forgot_password_returns_token_only_when_debug_enabled(): void
    {
        config(['app.debug' => true]);

        $user = User::factory()->create(['email' => 'debug@example.com']);

        $response = $this->postJson('/api/forgot-password', [
            'email' => $user->email,
        ]);

        $response->assertOk();
        $response->assertJsonStructure(['message', 'debug_token']);
        $this->assertNotEmpty($response->json('debug_token'));
    }

    public function test_forgot_password_does_not_reveal_whether_email_exists(): void
    {
        // Even with debug enabled, an unknown email must get the exact same
        // response as a known one (sans token) so the endpoint cannot be used
        // to enumerate registered accounts.
        config(['app.debug' => true]);

        $response = $this->postJson('/api/forgot-password', [
            'email' => 'missing@example.com',
        ]);

        $response->assertOk();
        $response->assertJsonMissingPath('debug_token');
        $response->assertJsonStructure(['message']);

        $this->assertDatabaseMissing('password_reset_tokens', [
            'email' => 'missing@example.com',
        ]);
    }
}
