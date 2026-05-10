<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Donation;
use Illuminate\Http\Request;

class ModerationController extends Controller
{
    public function queue(Request $request)
    {
        $status = $request->query('status', Donation::STATUS_PENDING);
        if ($status === 'all') {
            $status = null;
        }

        $donations = Donation::query()
            ->with(['user:id,name,email', 'category:id,name'])
            ->when($status, fn ($query) => $query->where('status', $status))
            ->latest()
            ->paginate(10);

        return response()->json([
            'message' => 'Antrian moderasi berhasil diambil',
            'data' => $donations,
        ]);
    }

    public function approve(Request $request, Donation $donation)
    {
        $donation->update([
            'status' => Donation::STATUS_APPROVED,
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'rejected_reason' => null,
        ]);

        ActivityLog::record(
            'donation.approved',
            'donation',
            $donation->id,
            ['title' => $donation->title],
            $request->user()->id,
        );

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

        $donation->update([
            'status' => Donation::STATUS_REJECTED,
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'rejected_reason' => $payload['reason'],
        ]);

        ActivityLog::record(
            'donation.rejected',
            'donation',
            $donation->id,
            [
                'reason' => $payload['reason'],
                'title' => $donation->title,
            ],
            $request->user()->id,
        );

        return response()->json([
            'message' => 'Donasi ditolak',
            'data' => $donation,
        ]);
    }
}
