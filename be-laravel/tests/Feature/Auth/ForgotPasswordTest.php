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

    public function test_forgot_password_returns_404_for_unknown_email(): void
    {
        $response = $this->postJson('/api/forgot-password', [
            'email' => 'missing@example.com',
        ]);

        $response->assertStatus(404);
        $response->assertJsonMissingPath('debug_token');
    }
}
