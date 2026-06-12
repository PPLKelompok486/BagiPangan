<?php

namespace Tests\Feature\Admin;

use App\Models\Claim;
use App\Models\Donation;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardSummaryTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    public function test_avg_claim_minutes_is_computed_from_completed_claims(): void
    {
        // Five claims with known durations: 10, 20, 30, 40, 50 minutes => avg 30.
        $deltas = [10, 20, 30, 40, 50];
        foreach ($deltas as $minutes) {
            $donation = Donation::factory()->create();
            Claim::create([
                'donation_id' => $donation->id,
                'receiver_id' => $this->admin->id,
                'status' => Claim::STATUS_COMPLETED,
                'claimed_at' => Carbon::now()->subMinutes($minutes + 60),
                'completed_at' => Carbon::now()->subMinutes(60),
            ]);
        }

        // Incomplete claims (no completed_at) must be ignored — they would
        // otherwise drag the average down.
        $extraDonation = Donation::factory()->create();
        Claim::create([
            'donation_id' => $extraDonation->id,
            'receiver_id' => $this->admin->id,
            'status' => Claim::STATUS_REQUESTED,
            'claimed_at' => Carbon::now()->subHours(2),
            'completed_at' => null,
        ]);

        $response = $this->actingAs($this->admin, 'web')
            ->getJson('/api/admin/dashboard/summary');

        $response->assertOk();
        $this->assertSame(30, $response->json('data.kpis.avg_claim_minutes'));
    }

    public function test_avg_claim_minutes_is_zero_when_no_completed_claims_exist(): void
    {
        $response = $this->actingAs($this->admin, 'web')
            ->getJson('/api/admin/dashboard/summary');

        $response->assertOk();
        $this->assertSame(0, $response->json('data.kpis.avg_claim_minutes'));
    }

    public function test_kpis_are_computed_from_a_single_aggregate(): void
    {
        // 4 donations: 1 completed, 2 approved, 1 cancelled.
        // Portions: 3, 5, 7, 11 → total 26. Completion: 1/4 → 25 percent.
        Donation::factory()->create(['status' => Donation::STATUS_COMPLETED, 'portion_count' => 3]);
        Donation::factory()->create(['status' => Donation::STATUS_APPROVED, 'portion_count' => 5]);
        Donation::factory()->create(['status' => Donation::STATUS_APPROVED, 'portion_count' => 7]);
        Donation::factory()->create(['status' => 'cancelled', 'portion_count' => 11]);

        $response = $this->actingAs($this->admin, 'web')
            ->getJson('/api/admin/dashboard/summary');

        $response->assertOk();
        $this->assertSame(4, $response->json('data.kpis.total_donations'));
        $this->assertSame(25, $response->json('data.kpis.completion_rate'));
        $this->assertSame(26, $response->json('data.kpis.total_portions'));
    }

    public function test_kpis_handle_empty_donations_table(): void
    {
        $response = $this->actingAs($this->admin, 'web')
            ->getJson('/api/admin/dashboard/summary');

        $response->assertOk();
        $this->assertSame(0, $response->json('data.kpis.total_donations'));
        $this->assertSame(0, $response->json('data.kpis.completion_rate'));
        $this->assertSame(0, $response->json('data.kpis.total_portions'));
    }
}
