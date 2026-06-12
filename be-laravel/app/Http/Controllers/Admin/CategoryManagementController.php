<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\DonationCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CategoryManagementController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');
        $status = $request->query('status', 'active');
        $perPage = $this->resolvePerPage($request->query('per_page'));

        $categories = DonationCategory::query()
            ->withCount('donations')
            ->when($search, function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($status === 'active', fn ($query) => $query->where('is_active', true))
            ->when($status === 'inactive', fn ($query) => $query->where('is_active', false))
            ->orderBy('name')
            ->paginate($perPage);

        return response()->json([
            'message' => 'Daftar kategori berhasil diambil',
            'data' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $payload = $this->validatedPayload($request, null, true);
        $slug = Str::slug($payload['name']);

        $category = DonationCategory::create([
            'name' => $payload['name'],
            'slug' => $slug,
            'description' => $payload['description'] ?? null,
            'is_active' => $payload['is_active'] ?? true,
        ]);

        $this->logAction($request, 'category.created', $category, [
            'name' => $category->name,
            'slug' => $category->slug,
        ]);

        Cache::forget('donation_categories');

        return response()->json([
            'message' => 'Kategori berhasil dibuat',
            'data' => $category,
        ], 201);
    }

    public function update(Request $request, DonationCategory $category)
    {
        $wasActive = $category->is_active;
        $payload = $this->validatedPayload($request, $category, false);

        if (array_key_exists('name', $payload)) {
            $payload['slug'] = Str::slug($payload['name']);
        }

        $category->update($payload);
        $category->refresh();

        $action = 'category.updated';
        if ($wasActive && !$category->is_active) {
            $action = 'category.deactivated';
        }
        if (!$wasActive && $category->is_active) {
            $action = 'category.reactivated';
        }

        $this->logAction($request, $action, $category, $payload);

        Cache::forget('donation_categories');

        return response()->json([
            'message' => 'Kategori berhasil diperbarui',
            'data' => $category,
        ]);
    }

    public function destroy(Request $request, DonationCategory $category)
    {
        $category->update(['is_active' => false]);
        $category->refresh();

        $this->logAction($request, 'category.deactivated', $category, [
            'name' => $category->name,
            'slug' => $category->slug,
        ]);

        Cache::forget('donation_categories');

        return response()->json([
            'message' => 'Kategori berhasil dinonaktifkan',
            'data' => $category,
        ]);
    }

    private function validatedPayload(Request $request, ?DonationCategory $category, bool $isCreate): array
    {
        $validator = Validator::make($request->all(), [
            'name' => [$isCreate ? 'required' : 'sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $validator->after(function ($validator) use ($request, $category) {
            if (!$request->has('name')) {
                return;
            }

            $slug = Str::slug((string) $request->input('name'));
            if ($slug === '') {
                $validator->errors()->add('name', 'Nama kategori tidak valid.');
                return;
            }

            $exists = DonationCategory::where('slug', $slug)
                ->when($category, fn ($query) => $query->whereKeyNot($category->id))
                ->exists();

            if ($exists) {
                $validator->errors()->add('name', 'Nama kategori sudah digunakan.');
            }
        });

        return $validator->validate();
    }

    private function resolvePerPage($value): int
    {
        $perPage = (int) $value;

        if ($perPage <= 0) {
            return 100;
        }

        return min($perPage, 500);
    }

    private function logAction(Request $request, string $action, DonationCategory $category, array $metadata): void
    {
        ActivityLog::create([
            'actor_user_id' => $request->user()->id,
            'action' => $action,
            'entity_type' => 'donation_category',
            'entity_id' => $category->id,
            'metadata' => $metadata,
        ]);
    }
}
