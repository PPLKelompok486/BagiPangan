<?php

namespace App\Http\Controllers;

use App\Models\Donation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DonationController extends Controller
{
    public function index()
    {
        $donations = Donation::with('donor:id,name,city')
            ->where('status', 'available')
            ->latest()
            ->get();

        return response()->json(['data' => $donations]);
    }

    public function show(Donation $donation)
    {
        $donation->load('donor:id,name,city,phone', 'receiver:id,name', 'proof');

        return response()->json(['data' => $donation]);
    }

    public function claim(Request $request, Donation $donation)
    {
        $userId = $request->user()->id;

        $result = DB::transaction(function () use ($donation, $userId) {
            $fresh = Donation::lockForUpdate()->find($donation->id);

            if (! $fresh) {
                return ['status' => 404];
            }

            if ($fresh->status !== 'available') {
                return ['status' => 409];
            }

            $fresh->update([
                'status' => 'claimed',
                'receiver_id' => $userId,
                'claimed_at' => now(),
            ]);

            return ['status' => 200, 'donation' => $fresh->fresh(['donor:id,name,city,phone'])];
        });

        if ($result['status'] === 404) {
            return response()->json(['message' => 'Donasi tidak ditemukan'], 404);
        }

        if ($result['status'] === 409) {
            return response()->json(['message' => 'Donasi sudah diklaim orang lain'], 409);
        }

        return response()->json([
            'message' => 'Donasi berhasil diklaim',
            'data' => $result['donation'],
        ]);
    }

    public function myClaims(Request $request)
    {
        $donations = Donation::with('donor:id,name,city,phone', 'proof')
            ->where('receiver_id', $request->user()->id)
            ->latest('claimed_at')
            ->get();

        return response()->json(['data' => $donations]);
    }
}
