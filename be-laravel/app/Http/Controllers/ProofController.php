<?php

namespace App\Http\Controllers;

use App\Models\Donation;
use App\Models\Proof;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProofController extends Controller
{
    public function store(Request $request, Donation $donation)
    {
        if ($donation->status !== 'claimed' || $donation->proof()->exists()) {
            return response()->json([
                'message' => 'Bukti sudah diunggah atau donasi belum diklaim',
            ], 422);
        }

        if ($donation->receiver_id !== $request->user()->id) {
            return response()->json(['message' => 'Anda bukan penerima donasi ini'], 403);
        }

        $request->validate([
            'image' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $file = $request->file('image');
        $extension = $file->getClientOriginalExtension() ?: $file->extension();
        $filename = Str::uuid()->toString().'.'.$extension;
        $path = $file->storeAs('proofs', $filename, 'public');
        $url = url(Storage::url($path));

        $proof = Proof::create([
            'donation_id' => $donation->id,
            'receiver_id' => $request->user()->id,
            'image_path' => $path,
            'image_url' => $url,
            'uploaded_at' => now(),
        ]);

        $donation->update(['status' => 'completed']);

        return response()->json([
            'message' => 'Bukti berhasil diunggah',
            'data' => [
                'proof' => $proof,
                'donation' => $donation->fresh(['donor:id,name,city,phone', 'proof']),
            ],
        ], 201);
    }
}
