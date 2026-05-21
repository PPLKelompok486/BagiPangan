<?php

namespace Tests\Feature\Admin;

use App\Models\ActivityLog;
use App\Models\Donation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModerationControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_approve_creates_activity_log_with_normalized_metadata(): void
    {
        $admin = User::factory()->create([
            'is_admin' => true,
            'is_active' => true,
        ]);
        $donation = Donation::factory()->create([
            'status' => Donation::STATUS_PENDING,
            'approved_by' => null,
            'approved_at' => null,
            'rejected_reason' => null,
            'title' => 'Nasi Kotak Acara Kantor',
        ]);

        $response = $this
            ->actingAs($admin)
            ->withServerVariables(['REMOTE_ADDR' => '198.51.100.21'])
            ->withHeaders(['User-Agent' => 'PHPUnit-Test-Agent'])
            ->patchJson("/api/admin/moderation/{$donation->id}/approve");

        $response->assertOk()
            ->assertJsonPath('data.status', Donation::STATUS_APPROVED);

        $donation->refresh();
        $this->assertSame(Donation::STATUS_APPROVED, $donation->status);
        $this->assertSame($admin->id, $donation->approved_by);

        $log = ActivityLog::query()
            ->where('action', 'donation.approved')
            ->where('entity_id', $donation->id)
            ->latest('id')
            ->first();

        $this->assertNotNull($log);
        $this->assertSame($admin->id, $log->actor_user_id);
        $this->assertSame('donation', $log->entity_type);
        $this->assertSame('Nasi Kotak Acara Kantor', $log->metadata['title'] ?? null);
        $this->assertSame(Donation::STATUS_PENDING, $log->metadata['previous_status'] ?? null);
        $this->assertSame(Donation::STATUS_APPROVED, $log->metadata['new_status'] ?? null);
        $this->assertSame($admin->id, $log->metadata['admin_id'] ?? null);
        $this->assertSame('198.51.100.21', $log->metadata['ip'] ?? null);
        $this->assertSame('PHPUnit-Test-Agent', $log->metadata['user_agent'] ?? null);
        $this->assertNull($log->metadata['reason'] ?? null);
    }

    public function test_reject_creates_activity_log_with_reason(): void
    {
        $admin = User::factory()->create([
            'is_admin' => true,
            'is_active' => true,
        ]);
        $donation = Donation::factory()->create([
            'status' => Donation::STATUS_PENDING,
            'approved_by' => null,
            'approved_at' => null,
            'rejected_reason' => null,
            'title' => 'Roti Tawar Sisa Produksi',
        ]);

        $response = $this
            ->actingAs($admin)
            ->withServerVariables(['REMOTE_ADDR' => '198.51.100.22'])
            ->withHeaders(['User-Agent' => 'PHPUnit-Test-Agent-2'])
            ->patchJson("/api/admin/moderation/{$donation->id}/reject", [
                'reason' => 'Data lokasi tidak valid',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', Donation::STATUS_REJECTED);

        $donation->refresh();
        $this->assertSame(Donation::STATUS_REJECTED, $donation->status);
        $this->assertSame('Data lokasi tidak valid', $donation->rejected_reason);

        $log = ActivityLog::query()
            ->where('action', 'donation.rejected')
            ->where('entity_id', $donation->id)
            ->latest('id')
            ->first();

        $this->assertNotNull($log);
        $this->assertSame('Roti Tawar Sisa Produksi', $log->metadata['title'] ?? null);
        $this->assertSame(Donation::STATUS_PENDING, $log->metadata['previous_status'] ?? null);
        $this->assertSame(Donation::STATUS_REJECTED, $log->metadata['new_status'] ?? null);
        $this->assertSame('Data lokasi tidak valid', $log->metadata['reason'] ?? null);
        $this->assertSame($admin->id, $log->metadata['admin_id'] ?? null);
        $this->assertSame('198.51.100.22', $log->metadata['ip'] ?? null);
        $this->assertSame('PHPUnit-Test-Agent-2', $log->metadata['user_agent'] ?? null);
    }

    public function test_non_admin_cannot_approve_or_reject(): void
    {
        $user = User::factory()->create([
            'is_admin' => false,
            'role' => 'donatur',
            'is_active' => true,
        ]);
        $donation = Donation::factory()->create([
            'status' => Donation::STATUS_PENDING,
        ]);

        $approveResponse = $this
            ->actingAs($user)
            ->patchJson("/api/admin/moderation/{$donation->id}/approve");

        $rejectResponse = $this
            ->actingAs($user)
            ->patchJson("/api/admin/moderation/{$donation->id}/reject", [
                'reason' => 'Tidak sesuai',
            ]);

        $approveResponse->assertStatus(403);
        $rejectResponse->assertStatus(403);

        $donation->refresh();
        $this->assertSame(Donation::STATUS_PENDING, $donation->status);
        $this->assertNull(
            ActivityLog::query()
                ->where('entity_type', 'donation')
                ->where('entity_id', $donation->id)
                ->whereIn('action', ['donation.approved', 'donation.rejected'])
                ->first()
        );
    }
}
