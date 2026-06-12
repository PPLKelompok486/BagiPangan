<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Donation;
use App\Notifications\DonationApproved;
use App\Notifications\DonationRejected;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ModerationController extends Controller
{
    public function queue(Request $request)
    {
        $status = $request->query('status', Donation::STATUS_PENDING);
        if ($status === 'all') {
            $status = null;
        }
        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);

        $donations = Donation::query()
            ->with(['user:id,name,email', 'category:id,name'])
            ->when($status, fn ($query) => $query->where('status', $status))
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'message' => 'Antrian moderasi berhasil diambil',
            'data' => $donations,
        ]);
    }

    public function approve(Request $request, Donation $donation)
    {
        $adminId = (int) $request->user()->id;
        $previousStatus = $donation->status;

        DB::transaction(function () use ($request, $donation, $adminId, $previousStatus) {
            $donation->update([
                'status' => Donation::STATUS_APPROVED,
                'approved_by' => $adminId,
                'approved_at' => now(),
                'rejected_reason' => null,
            ]);

            ActivityLog::record(
                'donation.approved',
                'donation',
                $donation->id,
                [
                    'title' => $donation->title,
                    'previous_status' => $previousStatus,
                    'new_status' => Donation::STATUS_APPROVED,
                    'reason' => null,
                    'admin_id' => $adminId,
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ],
                $adminId,
            );
        });

        $donation->load('user');
        $donation->user?->notify(new DonationApproved($donation));

        return response()->json([
            'message' => 'Donasi berhasil disetujui',
            'data' => $donation,
        ]);
    }

    public function reject(Request $request, Donation $donation)
    {
        $payload = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $adminId = (int) $request->user()->id;
        $previousStatus = $donation->status;

        DB::transaction(function () use ($request, $donation, $payload, $adminId, $previousStatus) {
            $donation->update([
                'status' => Donation::STATUS_REJECTED,
                'approved_by' => $adminId,
                'approved_at' => now(),
                'rejected_reason' => $payload['reason'],
            ]);

            ActivityLog::record(
                'donation.rejected',
                'donation',
                $donation->id,
                [
                    'title' => $donation->title,
                    'previous_status' => $previousStatus,
                    'new_status' => Donation::STATUS_REJECTED,
                    'reason' => $payload['reason'],
                    'admin_id' => $adminId,
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ],
                $adminId,
            );
        });

        $donation->load('user');
        $donation->user?->notify(new DonationRejected($donation, $payload['reason']));

        return response()->json([
            'message' => 'Donasi ditolak',
            'data' => $donation,
        ]);
    }
}
