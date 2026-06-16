<?php

namespace App\Http\Controllers;

use App\Models\Claim;
use App\Models\Donation;
use App\Models\DonationCategory;
use App\Models\User;
use App\Notifications\DonationClaimed;
use App\Notifications\NewDonationPending;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class DonationController extends Controller
{
    public function categories()
    {
        $categories = Cache::remember('donation_categories', 300, function () {
            return \App\Models\DonationCategory::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn ($category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                ])
                ->values()
                ->all();
        });

        return response()->json(['data' => $categories]);
    }

    public function index(Request $request)
    {
        $request->validate([
            'q' => ['nullable', 'string', 'max:120'],
            'category_id' => ['nullable', 'integer', 'exists:donation_categories,id'],
            'city' => ['nullable', 'string', 'max:100'],
            'sort' => ['nullable', 'in:newest,oldest,expiry_soon'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $query = Donation::with(['user:id,name,city', 'category:id,name'])
            ->where('status', Donation::STATUS_APPROVED);

        if ($request->filled('q')) {
            $normalizedQuery = strtolower(trim((string) $request->input('q')));
            if ($normalizedQuery !== '') {
                $escaped = $this->escapeLikeValue($normalizedQuery);
                $needle = '%' . $escaped . '%';
                $query->where(function ($sub) use ($needle) {
                    $sub->whereRaw("LOWER(title) LIKE ? ESCAPE '!'", [$needle])
                        ->orWhereRaw("LOWER(description) LIKE ? ESCAPE '!'", [$needle]);
                });
            }
        }

        if ($categoryId = $request->input('category_id')) {
            $query->where('category_id', $categoryId);
        }

        if ($request->filled('city')) {
            $normalizedCity = strtolower(trim((string) $request->input('city')));
            if ($normalizedCity !== '') {
                $escapedCity = $this->escapeLikeValue($normalizedCity);
                $cityNeedle = '%' . $escapedCity . '%';
                $query->where(function ($sub) use ($cityNeedle) {
                    $sub->whereRaw("LOWER(location_city) LIKE ? ESCAPE '!'", [$cityNeedle])
                        ->orWhereHas('user', fn ($userQuery) => $userQuery->whereRaw("LOWER(city) LIKE ? ESCAPE '!'", [$cityNeedle]));
                });
            }
        }

        $sort = $request->input('sort', 'newest');
        match ($sort) {
            'oldest' => $query->orderBy('created_at'),
            'expiry_soon' => $query->orderByRaw('available_until IS NULL')->orderBy('available_until'),
            default => $query->orderByDesc('created_at'),
        };

        $perPage = (int) $request->input('per_page', 15);

        return response()->json($query->paginate($perPage));
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'location_city' => 'required|string',
            'location_address' => 'required|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'address_detail' => 'nullable|string',
            'available_from' => 'required|date',
            'available_until' => 'required|date|after:available_from',
            'portion_count' => 'required|integer|min:1',
            'category_id' => 'nullable|integer|exists:donation_categories,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Data tidak valid: ' . implode(', ', $validator->errors()->all()),
                'errors' => $validator->errors()
            ], 422);
        }

        $categoryId = $request->category_id;
        if ($categoryId && !\App\Models\DonationCategory::where('id', $categoryId)->exists()) {
            $categoryId = null;
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imageFile = $request->file('image');
            $dir = public_path('uploads/donations');
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
            $extension = $imageFile->extension() ?: 'bin';
            $imageName = 'donation_' . time() . '_' . uniqid() . '.' . $extension;
            $imageFile->move($dir, $imageName);
            $imagePath = '/uploads/donations/' . $imageName;
        }

        $donation = Donation::create([
            'user_id' => Auth::id(),
            'title' => $request->title,
            'description' => $request->description,
            'location_city' => $request->location_city,
            'location_address' => $request->location_address,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'address_detail' => $request->address_detail,
            'available_from' => $request->available_from,
            'available_until' => $request->available_until,
            'portion_count' => $request->portion_count,
            'category_id' => $categoryId,
            'image' => $imagePath,
            'status' => 'pending', // Needs admin approval
        ]);

        $donation->load('user');
        User::query()
            ->where('is_admin', true)
            ->orWhere('role', 'admin')
            ->each(fn (User $admin) => $admin->notify(new NewDonationPending($donation)));

        return response()->json([
            'message' => 'Donasi berhasil diajukan dan sedang menunggu verifikasi.',
            'data' => $donation
        ], 201);
    }

    public function show($id)
    {
        $donation = Donation::with([
            'user:id,name,city,phone',
            'category:id,name',
        ])->find($id);

        if (!$donation) {
            return response()->json(['message' => 'Donasi tidak ditemukan'], 404);
        }

        // Public endpoint, but receivers viewing the detail want to see their
        // own claim status. Accept an optional bearer token and resolve it via
        // the same hashed-storage scheme used by TokenAuth middleware; never
        // bubble up a 401 here — anonymous viewers are first-class.
        $userId = Auth::id();
        if (!$userId) {
            $token = request()->bearerToken();
            if ($token) {
                $userId = User::where('remember_token', hash('sha256', $token))->value('id');
            }
        }

        $currentClaim = null;
        if ($userId) {
            $currentClaim = Claim::where('donation_id', $donation->id)
                ->where('receiver_id', $userId)
                ->whereIn('status', [
                    Claim::STATUS_REQUESTED,
                    Claim::STATUS_APPROVED,
                    Claim::STATUS_COMPLETED,
                ])
                ->select(['id', 'status', 'proof_image_url', 'claimed_at', 'completed_at'])
                ->first();
        }

        return response()->json([
            'data' => $donation,
            'my_claim' => $currentClaim,
        ]);
    }

    public function update(Request $request, $id)
    {
        $donation = Donation::find($id);

        if (!$donation || $donation->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($donation->status === 'claimed' || $donation->status === 'completed') {
            return response()->json(['message' => 'Donasi yang sudah diklaim tidak dapat diubah'], 422);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'location_city' => 'sometimes|required|string',
            'location_address' => 'sometimes|required|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'address_detail' => 'nullable|string',
            'available_from' => 'sometimes|required|date',
            'available_until' => 'sometimes|required|date|after:available_from',
            'portion_count' => 'sometimes|required|integer|min:1',
            'category_id' => 'nullable|integer|exists:donation_categories,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096',
            'delete_image' => 'nullable|string|in:true,false,1,0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Data tidak valid: ' . implode(', ', $validator->errors()->all()),
                'errors' => $validator->errors()
            ], 422);
        }

        $updateData = $request->only([
            'title', 'description', 'location_city', 'location_address',
            'latitude', 'longitude', 'address_detail',
            'available_from', 'available_until', 'portion_count', 'category_id'
        ]);

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($donation->image) {
                $oldPath = public_path($donation->image);
                if (file_exists($oldPath)) {
                    unlink($oldPath);
                }
            }

            $imageFile = $request->file('image');
            $dir = public_path('uploads/donations');
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
            $extension = $imageFile->extension() ?: 'bin';
            $imageName = 'donation_' . time() . '_' . uniqid() . '.' . $extension;
            $imageFile->move($dir, $imageName);
            $updateData['image'] = '/uploads/donations/' . $imageName;
        } elseif ($request->input('delete_image') === 'true' || $request->input('delete_image') == 1) {
            // Delete old image if exists
            if ($donation->image) {
                $oldPath = public_path($donation->image);
                if (file_exists($oldPath)) {
                    unlink($oldPath);
                }
            }
            $updateData['image'] = null;
        }

        $donation->update($updateData);

        return response()->json([
            'message' => 'Donasi berhasil diperbarui',
            'data' => $donation
        ]);
    }

    public function mine(Request $request)
    {
        $activeStatuses = [
            Claim::STATUS_REQUESTED,
            Claim::STATUS_APPROVED,
            Claim::STATUS_COMPLETED,
        ];

        $donations = Donation::with([
                'category',
                // Expose the receivers who claimed each donation so the donor
                // dashboard "Komunitas penerima" card can render them.
                'claims' => fn ($query) => $query
                    ->whereIn('status', $activeStatuses)
                    ->latest()
                    ->with('receiver:id,name,organization,city'),
            ])
            ->withCount([
                'claims as active_claims_count' => fn ($query) => $query->whereIn('status', $activeStatuses),
            ])
            ->where('user_id', Auth::id())
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $donations]);
    }

    public function exportMine(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $userId = Auth::id();
        $fileName = 'donasi-saya-' . now()->format('Ymd-His') . '.csv';

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Cache-Control'       => 'no-store, no-cache, must-revalidate',
        ];

        $callback = function () use ($userId) {
            $file = fopen('php://output', 'wb');
            fwrite($file, "\xEF\xBB\xBF");

            fputcsv($file, [
                'ID', 'Judul', 'Kategori', 'Kota', 'Status',
                'Jumlah Porsi', 'Tersedia Dari', 'Tersedia Hingga', 'Tgl Dibuat',
            ]);

            Donation::query()
                ->with(['category:id,name'])
                ->where('user_id', $userId)
                ->orderByDesc('created_at')
                ->lazy(200)
                ->each(function (Donation $donation) use ($file) {
                    fputcsv($file, [
                        $donation->id,
                        $donation->title,
                        optional($donation->category)->name ?? '',
                        $donation->location_city ?? '',
                        $donation->status,
                        $donation->portion_count,
                        optional($donation->available_from)->toDateTimeString() ?? '',
                        optional($donation->available_until)->toDateTimeString() ?? '',
                        optional($donation->created_at)->toDateTimeString() ?? '',
                    ]);
                });

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function claim(Request $request, $id)
    {
        $receiverId = Auth::id();

        return DB::transaction(function () use ($id, $receiverId) {
            $donation = Donation::lockForUpdate()->find($id);

            if (!$donation) {
                return response()->json(['message' => 'Donasi tidak ditemukan'], 404);
            }

            if ($donation->user_id === $receiverId) {
                return response()->json(['message' => 'Donatur tidak dapat mengklaim donasi sendiri'], 403);
            }

            if ($donation->status !== Donation::STATUS_APPROVED) {
                return response()->json(['message' => 'Donasi tidak tersedia untuk diklaim'], 409);
            }

            $existingClaim = Claim::where('donation_id', $donation->id)
                ->whereIn('status', [
                    Claim::STATUS_REQUESTED,
                    Claim::STATUS_APPROVED,
                    Claim::STATUS_COMPLETED,
                ])
                ->first();

            if ($existingClaim) {
                return response()->json(['message' => 'Donasi sudah diklaim'], 409);
            }

            $claim = Claim::create([
                'donation_id' => $donation->id,
                'receiver_id' => $receiverId,
                'status' => Claim::STATUS_REQUESTED,
                'claimed_at' => now(),
            ]);

            $donation->update([
                'status' => Donation::STATUS_CLAIMED,
            ]);

            $claim->load('receiver');
            $donation->load('user');
            $donation->user?->notify(new DonationClaimed($donation, $claim));

            return response()->json([
                'message' => 'Donasi berhasil diklaim',
                'data' => $donation,
            ]);
        });
    }

    public function cancel(Request $request, $id)
    {
        $donation = Donation::find($id);

        if (!$donation || $donation->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($donation->status === 'claimed' || $donation->status === 'completed') {
            return response()->json(['message' => 'Donasi sudah diklaim dan tidak dapat dibatalkan'], 422);
        }

        $donation->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Donasi berhasil dibatalkan']);
    }

    /**
     * Escape LIKE wildcard characters so user input is matched literally.
     *
     * This is paired with SQL `ESCAPE '!'` in LIKE clauses.
     */
    private function escapeLikeValue(string $value): string
    {
        return str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $value);
    }
}
