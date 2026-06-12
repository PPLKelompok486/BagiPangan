<?php

namespace Tests\Feature\Admin;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ActivityLogControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_activity_logs_requires_authentication(): void
    {
        $response = $this->getJson('/api/admin/activity-logs');

        $response->assertStatus(401);
    }

    public function test_activity_logs_forbids_non_admin_user(): void
    {
        $user = User::factory()->create([
            'is_admin' => false,
            'role' => 'donatur',
        ]);

        $response = $this->actingAs($user)->getJson('/api/admin/activity-logs');

        $response->assertStatus(403);
    }

    public function test_activity_logs_returns_paginated_data_and_filters(): void
    {
        $admin = User::factory()->create([
            'is_admin' => true,
            'is_active' => true,
            'name' => 'Admin Satu',
            'email' => 'admin1@example.com',
        ]);
        $actor = User::factory()->create([
            'name' => 'Approver Admin',
            'email' => 'approver@example.com',
        ]);

        $matching = ActivityLog::create([
            'actor_user_id' => $actor->id,
            'action' => 'donation.approved',
            'entity_type' => 'donation',
            'entity_id' => 101,
            'metadata' => [
                'title' => 'Nasi Kotak Komunitas',
            ],
        ]);
        $matching->forceFill([
            'created_at' => Carbon::parse('2026-05-20 10:00:00'),
            'updated_at' => Carbon::parse('2026-05-20 10:00:00'),
        ])->save();

        $other = ActivityLog::create([
            'actor_user_id' => $actor->id,
            'action' => 'user.updated',
            'entity_type' => 'user',
            'entity_id' => 22,
            'metadata' => [
                'title' => 'Profile Update',
            ],
        ]);
        $other->forceFill([
            'created_at' => Carbon::parse('2026-05-18 10:00:00'),
            'updated_at' => Carbon::parse('2026-05-18 10:00:00'),
        ])->save();

        $response = $this->actingAs($admin)->getJson(
            '/api/admin/activity-logs?search=approver&action=donation.approved&entity_type=donation&date_from=2026-05-19&date_to=2026-05-21&per_page=5'
        );

        $response->assertOk()
            ->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.per_page', 5)
            ->assertJsonPath('data.data.0.id', $matching->id)
            ->assertJsonPath('data.data.0.actor.name', 'Approver Admin')
            ->assertJsonPath('data.data.0.actor.email', 'approver@example.com')
            ->assertJsonPath('data.data.0.action', 'donation.approved')
            ->assertJsonPath('data.data.0.entity_type', 'donation')
            ->assertJsonPath('data.data.0.entity_id', 101)
            ->assertJsonPath('data.data.0.metadata.title', 'Nasi Kotak Komunitas');
    }
}
