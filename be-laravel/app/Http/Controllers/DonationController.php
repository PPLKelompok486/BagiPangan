<?php

namespace App\Http\Controllers;

use App\Models\Claim;
use App\Models\Donation;
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
            return \App\Models\DonationCategory::where('is_active', true)->get(['id', 'name']);
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
                    $sub->whereRaw("LOWER(title) LIKE ? ESCAPE '\\\\'", [$needle])
                        ->orWhereRaw("LOWER(description) LIKE ? ESCAPE '\\\\'", [$needle]);
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
                    $sub->whereRaw("LOWER(location_city) LIKE ? ESCAPE '\\\\'", [$cityNeedle])
                        ->orWhereHas('user', fn ($userQuery) => $userQuery->whereRaw("LOWER(city) LIKE ? ESCAPE '\\\\'", [$cityNeedle]));
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
            'category_id' => 'nullable', // Temporarily relaxed to prevent blocking
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
            'status' => 'pending', // Needs admin approval
        ]);

        return response()->json([
            'message' => 'Donasi berhasil diajukan dan sedang menunggu verifikasi.',
            'data' => $donation
        ], 201);
    }

    public function show($id)
    {
        $donation = Donation::with(['user', 'category'])->find($id);

        if (!$donation) {
            return response()->json(['message' => 'Donasi tidak ditemukan'], 404);
        }

        return response()->json(['data' => $donation]);
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

        $donation->update($request->only([
            'title', 'description', 'location_city', 'location_address',
            'latitude', 'longitude', 'address_detail',
            'available_from', 'available_until', 'portion_count', 'category_id'
        ]));

        return response()->json([
            'message' => 'Donasi berhasil diperbarui',
            'data' => $donation
        ]);
    }

    public function mine(Request $request)
    {
        $donations = Donation::with('category')
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

            Claim::create([
                'donation_id' => $donation->id,
                'receiver_id' => $receiverId,
                'status' => Claim::STATUS_REQUESTED,
                'claimed_at' => now(),
            ]);

            $donation->update([
                'status' => Donation::STATUS_CLAIMED,
            ]);

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
     * This is paired with SQL `ESCAPE '\'` in LIKE clauses.
     */
    private function escapeLikeValue(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\%', '\_'], $value);
    }
}
