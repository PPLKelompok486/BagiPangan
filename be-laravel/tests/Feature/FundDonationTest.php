<?php

namespace Tests\Feature;

use App\Models\FundDonation;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FundDonationTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $admin;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create(['role' => 'donatur']);
        $this->admin = User::factory()->create(['role' => 'admin']);
        
        // Ensure they have tokens
        $this->user->forceFill(['remember_token' => 'user-token'])->save();
        $this->admin->forceFill(['remember_token' => 'admin-token'])->save();
    }

    public function test_user_can_create_donation()
    {
        $response = $this->withHeaders(['Authorization' => 'Bearer user-token'])
            ->postJson('/api/fund-donations', [
                'donor_name' => 'John Doe',
                'amount' => 50000,
                'donation_date' => '2024-05-01',
                'payment_method' => 'gopay',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('fund_donations', ['donor_name' => 'John Doe']);
    }

    public function test_user_can_edit_pending_donation()
    {
        $donation = FundDonation::factory()->create([
            'user_id' => $this->user->id,
            'donor_name' => 'Old Name',
            'payment_status' => 'pending'
        ]);

        $response = $this->withHeaders(['Authorization' => 'Bearer user-token'])
            ->putJson("/api/fund-donations/{$donation->id}", [
                'donor_name' => 'New Name'
            ]);

        $response->assertStatus(200);
        $this->assertEquals('New Name', $donation->refresh()->donor_name);
    }

    public function test_user_cannot_edit_successful_donation()
    {
        $donation = FundDonation::factory()->create([
            'user_id' => $this->user->id,
            'payment_status' => 'success'
        ]);

        $response = $this->withHeaders(['Authorization' => 'Bearer user-token'])
            ->putJson("/api/fund-donations/{$donation->id}", [
                'donor_name' => 'Hack'
            ]);

        $response->assertStatus(422);
    }

    public function test_user_can_cancel_pending_donation()
    {
        $donation = FundDonation::factory()->create([
            'user_id' => $this->user->id,
            'payment_status' => 'pending'
        ]);

        $response = $this->withHeaders(['Authorization' => 'Bearer user-token'])
            ->postJson("/api/fund-donations/{$donation->id}/cancel", [
                'cancellation_reason' => 'Mistake'
            ]);

        $response->assertStatus(200);
        $this->assertEquals('cancelled', $donation->refresh()->payment_status);
    }

    public function test_admin_can_see_all_donations()
    {
        FundDonation::factory()->count(3)->create();

        $response = $this->withHeaders(['Authorization' => 'Bearer admin-token'])
            ->getJson('/api/admin/fund-donations/monitoring');

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
    }
}
