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
        $perPage = (int) $request->query('per_page', 12);
        $perPage = max(1, min($perPage, 50));

        $sort = (string) $request->query('sort', 'newest');
        $statusParam = $request->query('status');

        $publicStatuses = array_values(Donation::PUBLIC_STATUS_MAP);

        $query = Donation::query()
            ->with(['user:id,name,city', 'category:id,name'])
            ->byKeyword($request->query('keyword'))
            ->byCategory($request->query('category_id'))
            ->byLocation($request->query('location'))
            ->byStatus($statusParam);

        // When no explicit status filter is supplied, only expose donations
        // that have completed moderation (approved/claimed/completed). This
        // keeps pending/rejected/cancelled rows out of the public feed.
        if (!is_string($statusParam) || !array_key_exists($statusParam, Donation::PUBLIC_STATUS_MAP)) {
            $query->whereIn('status', $publicStatuses);
        }

        switch ($sort) {
            case 'oldest':
                $query->orderBy('created_at', 'asc');
                break;
            case 'expiry_soon':
                $query->orderBy('available_until', 'asc');
                break;
            case 'newest':
            default:
                $query->orderByDesc('created_at');
                break;
        }

        $paginator = $query->paginate($perPage)->withQueryString();

        $cards = $paginator->getCollection()->map(function (Donation $d) {
            return [
                'id'              => $d->id,
                'title'           => $d->title,
                'category'        => $d->category
                    ? ['id' => $d->category->id, 'name' => $d->category->name]
                    : null,
                'status'          => $d->status,
                'photo_thumbnail' => null,
                'donor_city'      => $d->user?->city ?? $d->location_city,
                'expiry_date'     => $d->available_until?->toIso8601String(),
            ];
        });

        return response()->json([
            'data' => $cards,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
            ],
        ]);
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
}
