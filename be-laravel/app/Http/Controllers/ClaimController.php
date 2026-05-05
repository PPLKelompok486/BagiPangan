<?php

namespace App\Http\Controllers;

use App\Models\Claim;
use App\Models\Donation;
use App\Notifications\ClaimCompleted;
use App\Notifications\ClaimRejected;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ClaimController extends Controller
{
    public function mine(Request $request)
    {
        $claims = Claim::with(['donation.user:id,name,city,phone', 'donation.category'])
            ->where('receiver_id', Auth::id())
            ->orderByDesc('claimed_at')
            ->get();

        return response()->json(['data' => $claims]);
    }

    public function uploadProof(Request $request, Claim $claim)
    {
        if ($claim->receiver_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'proof' => 'required|image|mimes:jpeg,png,jpg,webp|max:4096',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Data tidak valid: ' . implode(', ', $validator->errors()->all()),
                'errors' => $validator->errors(),
            ], 422);
        }

        $proof = $request->file('proof');
        if (!$proof) {
            return response()->json(['message' => 'Bukti wajib diunggah'], 422);
        }

        $dir = public_path('uploads/claims');
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $fileName = 'claim_' . $claim->id . '_' . time() . '.' . $proof->getClientOriginalExtension();
        $proof->move($dir, $fileName);
        $publicPath = '/uploads/claims/' . $fileName;

        return DB::transaction(function () use ($claim, $publicPath) {
            $claim = Claim::lockForUpdate()->find($claim->id);

            if (!$claim) {
                return response()->json(['message' => 'Klaim tidak ditemukan'], 404);
            }

            $donation = Donation::lockForUpdate()->find($claim->donation_id);

            if (!$donation) {
                return response()->json(['message' => 'Donasi tidak ditemukan'], 404);
            }

            if ($claim->proof_image_url) {
                $oldPath = public_path($claim->proof_image_url);
                if (file_exists($oldPath)) {
                    unlink($oldPath);
                }
            }

            $claim->update([
                'status' => Claim::STATUS_COMPLETED,
                'proof_image_url' => $publicPath,
                'completed_at' => now(),
            ]);

            $donation->update([
                'status' => Donation::STATUS_COMPLETED,
            ]);

            $claim->load(['donation.user:id,name,city,phone', 'donation.category']);
            $claim->donation?->user?->notify(new ClaimCompleted($claim));

            return response()->json([
                'message' => 'Bukti pengambilan berhasil diunggah',
                'data' => $claim,
            ]);
        });
    }

    public function cancel(Request $request, Claim $claim)
    {
        if ($claim->receiver_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return DB::transaction(function () use ($claim) {
            $claim = Claim::lockForUpdate()->find($claim->id);

            if (!$claim) {
                return response()->json(['message' => 'Klaim tidak ditemukan'], 404);
            }

            $donation = Donation::lockForUpdate()->find($claim->donation_id);

            if (!$donation) {
                return response()->json(['message' => 'Donasi tidak ditemukan'], 404);
            }

            if ($claim->status === Claim::STATUS_COMPLETED || $donation->status === Donation::STATUS_COMPLETED) {
                return response()->json(['message' => 'Klaim sudah selesai dan tidak dapat dibatalkan'], 422);
            }

            if ($claim->status !== Claim::STATUS_REJECTED) {
                $claim->update([
                    'status' => Claim::STATUS_REJECTED,
                    'cancel_reason' => 'Dibatalkan oleh penerima',
                    'completed_at' => null,
                ]);
            }

            if ($donation->status === Donation::STATUS_CLAIMED) {
                $donation->update(['status' => Donation::STATUS_APPROVED]);
            }

            $claim->load(['donation.user:id,name,city,phone', 'donation.category']);
            $claim->receiver?->notify(new ClaimRejected($claim));

            return response()->json([
                'message' => 'Klaim berhasil dibatalkan',
                'data' => $claim,
            ]);
        });
    }
}
