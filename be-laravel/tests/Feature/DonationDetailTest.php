<?php

namespace Tests\Feature;

use App\Models\Claim;
use App\Models\Donation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DonationDetailTest extends TestCase
{
    use RefreshDatabase;

    public function test_show_returns_limited_donor_fields(): void
    {
        $donation = Donation::factory()->create();

        $this->getJson("/api/donations/{$donation->id}")
            ->assertOk()
            ->assertJsonPath('data.user.id', $donation->user_id)
            ->assertJsonPath('data.user.name', $donation->user->name)
            ->assertJsonPath('data.user.city', $donation->user->city)
            ->assertJsonPath('data.user.phone', $donation->user->phone)
            ->assertJsonMissingPath('data.user.email')
            ->assertJsonPath('my_claim', null);
    }

    public function test_show_returns_my_claim_when_authenticated_via_bearer_token(): void
    {
        $donation = Donation::factory()->create();
        $receiver = User::factory()->create(['role' => 'penerima']);
        $receiver->forceFill(['remember_token' => hash('sha256', 'detail-token')])->save();

        $claim = Claim::create([
            'donation_id' => $donation->id,
            'receiver_id' => $receiver->id,
            'status' => Claim::STATUS_REQUESTED,
            'claimed_at' => now(),
        ]);

        $this->withHeaders(['Authorization' => 'Bearer detail-token'])
            ->getJson("/api/donations/{$donation->id}")
            ->assertOk()
            ->assertJsonPath('my_claim.id', $claim->id)
            ->assertJsonPath('my_claim.status', Claim::STATUS_REQUESTED);
    }
}
