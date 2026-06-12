<?php

namespace Tests\Feature;

use App\Models\Claim;
use App\Models\Donation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_receiver_claim_cancellation_notifies_donor_not_receiver(): void
    {
        $donor = User::factory()->create(['role' => 'donatur']);
        $receiver = User::factory()->create(['role' => 'penerima']);
        $receiver->forceFill(['remember_token' => hash('sha256', 'receiver-token')])->save();
        $donation = Donation::factory()->create([
            'user_id' => $donor->id,
            'status' => Donation::STATUS_CLAIMED,
        ]);
        $claim = Claim::create([
            'donation_id' => $donation->id,
            'receiver_id' => $receiver->id,
            'status' => Claim::STATUS_REQUESTED,
            'claimed_at' => now(),
        ]);

        $response = $this
            ->withHeaders(['Authorization' => 'Bearer receiver-token'])
            ->postJson("/api/claims/{$claim->id}/cancel");

        $response->assertOk();

        $this->assertSame(1, $donor->notifications()->count());
        $this->assertSame(0, $receiver->notifications()->count());

        $notification = $donor->notifications()->first();
        $this->assertSame('Klaim Dibatalkan', $notification->data['title'] ?? null);
        $this->assertSame('/donatur/donations', $notification->data['action_url'] ?? null);
        $this->assertSame($donation->id, $notification->data['meta']['donation_id'] ?? null);
        $this->assertSame($claim->id, $notification->data['meta']['claim_id'] ?? null);
    }
}
