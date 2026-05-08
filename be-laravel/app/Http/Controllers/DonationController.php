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
        $donations = Donation::with(['user:id,name,city', 'category'])
            ->where('status', 'approved')
            ->orderByDesc('created_at')
            ->paginate(15);

        return response()->json($donations);
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
        $donation = Donation::with([
            'user:id,name,city,phone',
            'category:id,name',
            'claims',
        ])->findOrFail($id);

        $activeClaims = $donation->claims->whereIn('status', [
            Claim::STATUS_REQUESTED,
            Claim::STATUS_APPROVED,
            Claim::STATUS_COMPLETED,
        ])->count();

        $remainingPortion = max(0, ($donation->portion_count ?? 0) - $activeClaims);

        $donor = $donation->user;
        $photoUrl = $donation->photo_url ?? null;

        $myClaim = null;
        if ($userId = Auth::id()) {
            $myClaim = Claim::where('donation_id', $donation->id)
                ->where('receiver_id', $userId)
                ->whereIn('status', [
                    Claim::STATUS_REQUESTED,
                    Claim::STATUS_APPROVED,
                    Claim::STATUS_COMPLETED,
                ])
                ->select(['id', 'donation_id', 'status', 'proof_image_url', 'claimed_at', 'completed_at'])
                ->first();
        }

        return response()->json([
            'data' => [
                'id_donation' => $donation->id,
                'id' => $donation->id,
                'title' => $donation->title,
                'description' => $donation->description,
                'category' => $donation->category?->name,
                'category_id' => $donation->category_id,
                'category_obj' => $donation->category ? [
                    'id' => $donation->category->id,
                    'name' => $donation->category->name,
                ] : null,
                'portion' => $donation->portion_count,
                'portion_count' => $donation->portion_count,
                'remaining_portion' => $remainingPortion,
                'location' => $donation->location_city,
                'location_city' => $donation->location_city,
                'location_address' => $donation->location_address,
                'address_detail' => $donation->address_detail ?? null,
                'latitude' => $donation->latitude,
                'longitude' => $donation->longitude,
                'expired_at' => optional($donation->available_until)->toIso8601String(),
                'available_from' => optional($donation->available_from)->toIso8601String(),
                'available_until' => optional($donation->available_until)->toIso8601String(),
                'status' => $donation->status,
                'photo_url' => $photoUrl,
                'created_at' => optional($donation->created_at)->toIso8601String(),
                'updated_at' => optional($donation->updated_at)->toIso8601String(),
                'donor' => $donor ? [
                    'id' => $donor->id,
                    'name' => $donor->name,
                    'phone' => $donor->phone,
                    'address' => $donor->city,
                    'organization' => null,
                ] : null,
                'user' => $donor ? [
                    'id' => $donor->id,
                    'name' => $donor->name,
                    'city' => $donor->city,
                    'phone' => $donor->phone,
                ] : null,
            ],
            'my_claim' => $myClaim,
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
