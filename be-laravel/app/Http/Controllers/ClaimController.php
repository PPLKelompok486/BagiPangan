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

    public function exportMine(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $receiverId = Auth::id();
        $fileName = 'klaim-saya-' . now()->format('Ymd-His') . '.csv';

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Cache-Control'       => 'no-store, no-cache, must-revalidate',
        ];

        $callback = function () use ($receiverId) {
            $file = fopen('php://output', 'wb');
            fwrite($file, "\xEF\xBB\xBF");

            fputcsv($file, [
                'ID Klaim', 'ID Donasi', 'Judul Donasi', 'Kategori',
                'Donatur', 'Kota', 'Status Klaim', 'Tgl Diklaim', 'Tgl Selesai',
            ]);

            Claim::query()
                ->with([
                    'donation:id,title,location_city,category_id,user_id',
                    'donation.category:id,name',
                    'donation.user:id,name',
                ])
                ->where('receiver_id', $receiverId)
                ->orderByDesc('claimed_at')
                ->lazy(200)
                ->each(function (Claim $claim) use ($file) {
                    fputcsv($file, [
                        $claim->id,
                        optional($claim->donation)->id ?? '',
                        optional($claim->donation)->title ?? '',
                        optional($claim->donation?->category)->name ?? '',
                        optional($claim->donation?->user)->name ?? '',
                        optional($claim->donation)->location_city ?? '',
                        $claim->status,
                        optional($claim->claimed_at)->toDateTimeString() ?? '',
                        optional($claim->completed_at)->toDateTimeString() ?? '',
                    ]);
                });

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
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

        // Use the server-side extension guessed from the validated MIME type,
        // not the client-supplied original extension, to prevent attackers
        // from naming a valid JPEG `evil.php` and dropping executable code
        // into a publicly-served directory.
        $extension = $proof->extension() ?: 'bin';
        $allowedExtensions = ['jpeg', 'jpg', 'png', 'webp'];
        if (!in_array($extension, $allowedExtensions, true)) {
            return response()->json(['message' => 'Format bukti tidak didukung'], 422);
        }
        $fileName = 'claim_' . $claim->id . '_' . time() . '.' . $extension;
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
            $claim->donation?->user?->notify(new ClaimRejected($claim));

            return response()->json([
                'message' => 'Klaim berhasil dibatalkan',
                'data' => $claim,
            ]);
        });
    }
}
