<?php

namespace Tests\Feature;

use App\Models\Donation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ClaimDonationTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $role): User
    {
        return User::create([
            'role' => $role,
            'name' => ucfirst($role).' '.uniqid(),
            'email' => $role.'-'.uniqid().'@test.local',
            'password' => Hash::make('Password123'),
            'phone' => '0811000000',
            'city' => 'Depok',
        ]);
    }

    private function makeDonation(User $donor, array $overrides = []): Donation
    {
        return Donation::create(array_merge([
            'donor_id' => $donor->id,
            'title' => 'Nasi kotak',
            'description' => 'Sisa acara',
            'quantity' => '5 porsi',
            'pickup_address' => 'Jl. Tes 1',
            'pickup_time' => now()->addHours(2),
            'status' => 'available',
        ], $overrides));
    }

    public function test_receiver_can_claim_available_donation(): void
    {
        $donor = $this->makeUser('donatur');
        $receiver = $this->makeUser('penerima');
        $donation = $this->makeDonation($donor);

        Sanctum::actingAs($receiver);

        $response = $this->postJson("/api/donations/{$donation->id}/claim");

        $response->assertOk();
        $this->assertDatabaseHas('donations', [
            'id' => $donation->id,
            'status' => 'claimed',
            'receiver_id' => $receiver->id,
        ]);
        $this->assertNotNull($donation->fresh()->claimed_at);
    }

    public function test_claiming_already_claimed_donation_returns_409(): void
    {
        $donor = $this->makeUser('donatur');
        $first = $this->makeUser('penerima');
        $second = $this->makeUser('penerima');
        $donation = $this->makeDonation($donor, [
            'status' => 'claimed',
            'receiver_id' => $first->id,
            'claimed_at' => now(),
        ]);

        Sanctum::actingAs($second);

        $this->postJson("/api/donations/{$donation->id}/claim")
            ->assertStatus(409);
    }

    public function test_non_receiver_role_is_forbidden(): void
    {
        $donor = $this->makeUser('donatur');
        $otherDonor = $this->makeUser('donatur');
        $donation = $this->makeDonation($donor);

        Sanctum::actingAs($otherDonor);

        $this->postJson("/api/donations/{$donation->id}/claim")
            ->assertStatus(403);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $donor = $this->makeUser('donatur');
        $donation = $this->makeDonation($donor);

        $this->postJson("/api/donations/{$donation->id}/claim")
            ->assertStatus(401);
    }
}
