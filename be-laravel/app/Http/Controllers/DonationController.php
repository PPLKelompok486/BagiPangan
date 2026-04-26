<?php

namespace App\Http\Controllers;

use App\Models\Donation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DonationController extends Controller
{
    public function index(Request $request)
    {
        $donations = Donation::with(['donor:id,name,city,phone', 'receiver:id,name'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $donations]);
    }

    public function show($id)
    {
        $donation = Donation::with(['donor:id,name,city,phone', 'receiver:id,name'])
            ->find($id);

        if (!$donation) {
            return response()->json(['message' => 'Donasi tidak ditemukan'], 404);
        }

        return response()->json(['data' => $donation]);
    }

    public function claim(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || $user->role !== 'penerima') {
            return response()->json(['message' => 'Hanya penerima yang dapat mengklaim donasi'], 403);
        }

        $donation = Donation::find($id);
        if (!$donation) {
            return response()->json(['message' => 'Donasi tidak ditemukan'], 404);
        }
        if ($donation->status !== Donation::STATUS_AVAILABLE) {
            return response()->json(['message' => 'Donasi sudah tidak tersedia'], 409);
        }

        DB::transaction(function () use ($donation, $user) {
            $donation->update([
                'receiver_id' => $user->id,
                'status' => Donation::STATUS_CLAIMED,
                'claimed_at' => now(),
            ]);

            DB::table('donation_claims')->insert([
                'donation_id' => $donation->id,
                'recipient_id' => $user->id,
                'status' => 'requested',
                'claimed_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        $donation->load(['donor:id,name,city,phone', 'receiver:id,name']);
        return response()->json(['data' => $donation]);
    }

    public function mine(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $donations = Donation::with(['donor:id,name,city,phone', 'receiver:id,name'])
            ->where('receiver_id', $user->id)
            ->orderByDesc('claimed_at')
            ->get();

        return response()->json(['data' => $donations]);
    }
}
