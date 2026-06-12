<?php

namespace Tests\Feature\Admin;

use App\Models\ActivityLog;
use App\Models\User;
use App\Models\Claim;
use App\Models\Donation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserManagementActionTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'is_admin' => true,
            'is_active' => true,
            'role' => 'admin',
        ]);

        $this->user = User::factory()->create([
            'is_admin' => false,
            'is_active' => true,
            'role' => 'donatur',
            'email' => 'user@example.com',
            'password' => Hash::make('password123'),
            'remember_token' => hash('sha256', 'active_session_token_123'),
        ]);
    }

    public function test_admin_can_deactivate_user(): void
    {
        $response = $this->actingAs($this->admin)
            ->patchJson("/api/admin/users/{$this->user->id}/deactivate");

        $response->assertOk();
        $this->user->refresh();

        $this->assertFalse($this->user->is_active);
        $this->assertNotNull($this->user->deactivated_at);
        $this->assertNull($this->user->remember_token);

        // Verify Activity Log
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'user.deactivated',
            'entity_type' => 'user',
            'entity_id' => $this->user->id,
            'actor_user_id' => $this->admin->id,
        ]);
    }

    public function test_deactivated_user_cannot_access_api(): void
    {
        // Deactivate user first
        $this->user->update([
            'is_active' => false,
            'deactivated_at' => now(),
        ]);

        // Attempt API request with header token
        $response = $this->withHeaders([
            'Authorization' => 'Bearer active_session_token_123',
        ])->getJson('/api/profile');

        $response->assertStatus(403);
        $response->assertJsonFragment([
            'message' => 'Akun Anda telah dinonaktifkan. Silakan hubungi admin.',
        ]);
    }

    public function test_deactivated_user_cannot_login(): void
    {
        // Deactivate user first
        $this->user->update([
            'is_active' => false,
            'deactivated_at' => now(),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'user@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(403);
        $response->assertJsonFragment([
            'message' => 'Akun Anda telah dinonaktifkan. Silakan hubungi admin.',
        ]);
    }

    public function test_admin_can_activate_deactivated_user(): void
    {
        $this->user->update([
            'is_active' => false,
            'deactivated_at' => now(),
        ]);

        $response = $this->actingAs($this->admin)
            ->patchJson("/api/admin/users/{$this->user->id}/activate");

        $response->assertOk();
        $this->user->refresh();

        $this->assertTrue($this->user->is_active);
        $this->assertNull($this->user->deactivated_at);

        // Verify Activity Log
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'user.activated',
            'entity_type' => 'user',
            'entity_id' => $this->user->id,
            'actor_user_id' => $this->admin->id,
        ]);
    }

    public function test_admin_can_soft_delete_user(): void
    {
        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/users/{$this->user->id}");

        $response->assertOk();

        // Model is soft deleted (not accessible in standard queries)
        $this->assertSoftDeleted('users', [
            'id' => $this->user->id,
        ]);

        // Refresh with trashed to verify status update
        $trashedUser = User::withTrashed()->find($this->user->id);
        $this->assertFalse($trashedUser->is_active);
        $this->assertNull($trashedUser->remember_token);

        // Verify Activity Log
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'user.deleted',
            'entity_type' => 'user',
            'entity_id' => $this->user->id,
            'actor_user_id' => $this->admin->id,
        ]);
    }

    public function test_deleted_user_cannot_login(): void
    {
        // Soft delete user
        $this->user->delete();

        $response = $this->postJson('/api/login', [
            'email' => 'user@example.com',
            'password' => 'password123',
        ]);

        // Returns 401 Unauthenticated because model is not found in search query due to soft delete
        $response->assertStatus(401);
    }

    public function test_admin_can_restore_deleted_user(): void
    {
        $this->user->delete();

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/users/{$this->user->id}/restore");

        $response->assertOk();
        $this->user->refresh();

        $this->assertFalse($this->user->trashed());
        $this->assertTrue($this->user->is_active);
        $this->assertNull($this->user->deactivated_at);

        // Verify Activity Log
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'user.restored',
            'entity_type' => 'user',
            'entity_id' => $this->user->id,
            'actor_user_id' => $this->admin->id,
        ]);
    }

    public function test_admin_cannot_deactivate_or_delete_self_or_other_admins(): void
    {
        $otherAdmin = User::factory()->create([
            'is_admin' => true,
            'is_active' => true,
            'role' => 'admin',
        ]);

        // 1. Try to deactivate self
        $response = $this->actingAs($this->admin)
            ->patchJson("/api/admin/users/{$this->admin->id}/deactivate");
        $response->assertStatus(403);

        // 2. Try to delete self
        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/users/{$this->admin->id}");
        $response->assertStatus(403);

        // 3. Try to deactivate other admin
        $response = $this->actingAs($this->admin)
            ->patchJson("/api/admin/users/{$otherAdmin->id}/deactivate");
        $response->assertStatus(403);

        // 4. Try to delete other admin
        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/admin/users/{$otherAdmin->id}");
        $response->assertStatus(403);
    }

    public function test_non_admin_cannot_perform_actions(): void
    {
        // Try deactivating using a normal user
        $response = $this->actingAs($this->user)
            ->patchJson("/api/admin/users/{$this->user->id}/deactivate");
        $response->assertStatus(403);

        // Try deleting
        $response = $this->actingAs($this->user)
            ->deleteJson("/api/admin/users/{$this->user->id}");
        $response->assertStatus(403);
    }

    public function test_modify_non_existent_user_returns_404(): void
    {
        $response = $this->actingAs($this->admin)
            ->patchJson('/api/admin/users/9999/deactivate');
        $response->assertStatus(404);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/admin/users/9999/restore');
        $response->assertStatus(404);
    }

    public function test_cleanup_command_permanently_deletes_expired_deleted_users(): void
    {
        // 1. Set up test files
        $uploadDir = public_path('uploads/avatars');
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        $claimDir = public_path('uploads/claims');
        if (!is_dir($claimDir)) {
            mkdir($claimDir, 0755, true);
        }

        $avatarFile = $uploadDir . '/test_avatar.png';
        File::put($avatarFile, 'dummy avatar content');
        $this->user->update(['avatar' => '/uploads/avatars/test_avatar.png']);

        // Create a donation and claim for the user
        $donation = Donation::create([
            'user_id' => $this->user->id,
            'title' => 'Test Donation',
            'description' => 'Test Description',
            'location_city' => 'Jakarta',
            'status' => 'completed',
        ]);

        $claim = Claim::create([
            'donation_id' => $donation->id,
            'receiver_id' => $this->user->id,
            'status' => 'completed',
            'proof_image_url' => '/uploads/claims/test_proof.png',
        ]);

        $proofFile = $claimDir . '/test_proof.png';
        File::put($proofFile, 'dummy proof content');

        // Verify files exist before cleanup
        $this->assertTrue(File::exists($avatarFile));
        $this->assertTrue(File::exists($proofFile));

        // Soft delete user and simulate they were deleted 8 days ago
        $this->user->delete();
        $this->user->update(['deleted_at' => now()->subDays(8)]);

        // Create another user deleted only 2 days ago (should not be permanently deleted)
        $recentUser = User::factory()->create();
        $recentUser->delete();
        $recentUser->update(['deleted_at' => now()->subDays(2)]);

        // Run the command
        Artisan::call('app:cleanup-deleted-users');

        // Verify $this->user is permanently removed
        $this->assertDatabaseMissing('users', ['id' => $this->user->id]);
        // Verify cascade deletion of donations and claims
        $this->assertDatabaseMissing('donations', ['id' => $donation->id]);
        $this->assertDatabaseMissing('claims', ['id' => $claim->id]);

        // Verify physical files were deleted
        $this->assertFalse(File::exists($avatarFile));
        $this->assertFalse(File::exists($proofFile));

        // Verify $recentUser still exists in trash
        $this->assertSoftDeleted('users', ['id' => $recentUser->id]);

        // Clean up any remaining test files if they exist
        if (File::exists($avatarFile)) File::delete($avatarFile);
        if (File::exists($proofFile)) File::delete($proofFile);
    }
}
