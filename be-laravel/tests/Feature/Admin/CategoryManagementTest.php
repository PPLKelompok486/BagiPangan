<?php

namespace Tests\Feature\Admin;

use App\Models\ActivityLog;
use App\Models\Donation;
use App\Models\DonationCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class CategoryManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_category_index_requires_authentication(): void
    {
        $this->getJson('/api/admin/categories')
            ->assertStatus(401);
    }

    public function test_category_index_forbids_non_admin_user(): void
    {
        $user = User::factory()->create(['is_admin' => false, 'role' => 'donatur']);

        $this->actingAs($user)->getJson('/api/admin/categories')
            ->assertStatus(403);
    }

    public function test_admin_can_list_categories_with_donation_counts(): void
    {
        $admin = User::factory()->create(['is_admin' => true, 'is_active' => true]);
        $category = DonationCategory::factory()->create(['name' => 'Roti & Kue']);
        Donation::factory()->count(2)->create(['category_id' => $category->id]);

        $this->actingAs($admin)->getJson('/api/admin/categories?status=all')
            ->assertOk()
            ->assertJsonPath('data.data.0.name', 'Roti & Kue')
            ->assertJsonPath('data.data.0.donations_count', 2);
    }

    public function test_admin_can_create_category_with_generated_slug_and_audit_log(): void
    {
        $admin = User::factory()->create(['is_admin' => true, 'is_active' => true]);

        $this->actingAs($admin)->postJson('/api/admin/categories', [
            'name' => 'Frozen Food',
            'description' => 'Makanan beku siap distribusi',
        ])->assertCreated()
            ->assertJsonPath('data.name', 'Frozen Food')
            ->assertJsonPath('data.slug', 'frozen-food')
            ->assertJsonPath('data.is_active', true);

        $this->assertDatabaseHas('donation_categories', [
            'name' => 'Frozen Food',
            'slug' => 'frozen-food',
            'is_active' => true,
        ]);

        $this->assertDatabaseHas('activity_logs', [
            'actor_user_id' => $admin->id,
            'action' => 'category.created',
            'entity_type' => 'donation_category',
        ]);
    }

    public function test_duplicate_normalized_category_name_is_rejected(): void
    {
        $admin = User::factory()->create(['is_admin' => true, 'is_active' => true]);
        DonationCategory::factory()->create(['name' => 'Frozen Food', 'slug' => 'frozen-food']);

        $this->actingAs($admin)->postJson('/api/admin/categories', [
            'name' => 'Frozen   Food',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_admin_can_update_category_and_reactivate_it(): void
    {
        $admin = User::factory()->create(['is_admin' => true, 'is_active' => true]);
        $category = DonationCategory::factory()->create([
            'name' => 'Old Name',
            'slug' => 'old-name',
            'is_active' => false,
        ]);

        $this->actingAs($admin)->patchJson("/api/admin/categories/{$category->id}", [
            'name' => 'Fresh Meals',
            'description' => 'Ready to eat meals',
            'is_active' => true,
        ])->assertOk()
            ->assertJsonPath('data.name', 'Fresh Meals')
            ->assertJsonPath('data.slug', 'fresh-meals')
            ->assertJsonPath('data.is_active', true);

        $this->assertDatabaseHas('activity_logs', [
            'actor_user_id' => $admin->id,
            'action' => 'category.reactivated',
            'entity_type' => 'donation_category',
            'entity_id' => $category->id,
        ]);
    }

    public function test_delete_deactivates_category_and_excludes_it_from_public_categories(): void
    {
        $admin = User::factory()->create(['is_admin' => true, 'is_active' => true]);
        $active = DonationCategory::factory()->create(['name' => 'Active Category', 'is_active' => true]);
        $deleted = DonationCategory::factory()->create(['name' => 'Hidden Category', 'is_active' => true]);

        Cache::put('donation_categories', collect([['id' => $deleted->id, 'name' => $deleted->name]]), 300);

        $this->actingAs($admin)->deleteJson("/api/admin/categories/{$deleted->id}")
            ->assertOk()
            ->assertJsonPath('data.is_active', false);

        $this->assertDatabaseHas('donation_categories', [
            'id' => $deleted->id,
            'is_active' => false,
        ]);

        $this->assertDatabaseHas('activity_logs', [
            'actor_user_id' => $admin->id,
            'action' => 'category.deactivated',
            'entity_type' => 'donation_category',
            'entity_id' => $deleted->id,
        ]);

        $response = $this->getJson('/api/donations/categories')
            ->assertOk();

        $response->assertJsonFragment(['name' => $active->name]);
        $response->assertJsonMissing(['name' => $deleted->name]);
    }
}
