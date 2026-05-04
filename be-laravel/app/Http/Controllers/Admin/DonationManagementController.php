<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Donation;
use App\Models\DonationCategory;
use Illuminate\Http\Request;

class DonationManagementController extends Controller
{
    public function store(Request $request)
    {
        $payload = $request->validate([
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
            'category_id' => 'nullable',
        ]);

        $categoryId = $payload['category_id'] ?? null;
        if ($categoryId && !DonationCategory::where('id', $categoryId)->exists()) {
            $categoryId = null;
        }

        $donation = Donation::create([
            'user_id' => $request->user()->id,
            'title' => $payload['title'],
            'description' => $payload['description'],
            'location_city' => $payload['location_city'],
            'location_address' => $payload['location_address'],
            'latitude' => $payload['latitude'] ?? null,
            'longitude' => $payload['longitude'] ?? null,
            'address_detail' => $payload['address_detail'] ?? null,
            'available_from' => $payload['available_from'],
            'available_until' => $payload['available_until'],
            'portion_count' => $payload['portion_count'],
            'category_id' => $categoryId,
            'status' => Donation::STATUS_PENDING,
        ]);

        ActivityLog::create([
            'actor_user_id' => $request->user()->id,
            'action' => 'donation.created',
            'entity_type' => 'donation',
            'entity_id' => $donation->id,
            'metadata' => [
                'title' => $donation->title,
            ],
        ]);

        return response()->json([
            'message' => 'Donasi berhasil dibuat',
            'data' => $donation,
        ], 201);
    }

    public function show(Donation $donation)
    {
        $donation->load(['user:id,name,email', 'category:id,name']);

        return response()->json([
            'message' => 'Detail donasi berhasil diambil',
            'data' => $donation,
        ]);
    }

    public function update(Request $request, Donation $donation)
    {
        if (in_array($donation->status, [Donation::STATUS_CLAIMED, Donation::STATUS_COMPLETED], true)) {
            return response()->json([
                'message' => 'Donasi yang sudah diklaim tidak dapat diubah',
            ], 422);
        }

        $payload = $request->validate([
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
            'category_id' => 'nullable',
        ]);

        if (array_key_exists('category_id', $payload)) {
            $categoryId = $payload['category_id'];
            if ($categoryId && !DonationCategory::where('id', $categoryId)->exists()) {
                $payload['category_id'] = null;
            }
        }

        $donation->update($payload);

        ActivityLog::create([
            'actor_user_id' => $request->user()->id,
            'action' => 'donation.updated',
            'entity_type' => 'donation',
            'entity_id' => $donation->id,
            'metadata' => $payload,
        ]);

        return response()->json([
            'message' => 'Donasi berhasil diperbarui',
            'data' => $donation,
        ]);
    }

    public function destroy(Request $request, Donation $donation)
    {
        $donationId = $donation->id;
        $title = $donation->title;

        $donation->delete();

        ActivityLog::create([
            'actor_user_id' => $request->user()->id,
            'action' => 'donation.deleted',
            'entity_type' => 'donation',
            'entity_id' => $donationId,
            'metadata' => [
                'title' => $title,
            ],
        ]);

        return response()->json([
            'message' => 'Donasi berhasil dihapus',
        ]);
    }
}
