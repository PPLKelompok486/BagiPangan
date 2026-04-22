<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_summary_requires_authentication(): void
    {
        $response = $this->getJson('/api/admin/dashboard/summary');

        $response->assertStatus(401);
    }

    public function test_dashboard_summary_forbids_non_admin_user(): void
    {
        $user = User::factory()->create([
            'is_admin' => false,
        ]);

        $response = $this->actingAs($user)->getJson('/api/admin/dashboard/summary');

        $response->assertStatus(403);
    }
}
