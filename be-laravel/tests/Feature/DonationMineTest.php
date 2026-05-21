<?php

namespace Tests\Feature;

use App\Models\Claim;
use App\Models\Donation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DonationMineTest extends TestCase
{
    use RefreshDatabase;

    public function test_mine_returns_donor_donations_with_active_claim_count(): void
    {
        $donor = User::factory()->create([
            'role' => 'donatur',
            'remember_token' => 'donor-status-token',
        ]);
        $receiver = User::factory()->create(['role' => 'penerima']);

        $claimedDonation = Donation::factory()->create([
            'user_id' => $donor->id,
            'status' => Donation::STATUS_CLAIMED,
        ]);
        Donation::factory()->create([
            'user_id' => $donor->id,
            'status' => Donation::STATUS_APPROVED,
        ]);
        Donation::factory()->create();

        Claim::create([
            'donation_id' => $claimedDonation->id,
            'receiver_id' => $receiver->id,
            'status' => Claim::STATUS_REQUESTED,
            'claimed_at' => now(),
        ]);

        $response = $this
            ->withHeaders(['Authorization' => 'Bearer donor-status-token'])
            ->getJson('/api/donations/mine');

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $claimed = collect($response->json('data'))->firstWhere('id', $claimedDonation->id);

        $this->assertSame(1, $claimed['active_claims_count'] ?? null);
        $this->assertArrayNotHasKey('claims', $claimed);
    }
}
