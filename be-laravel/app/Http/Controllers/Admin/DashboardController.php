<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Claim;
use App\Models\Donation;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function summary()
    {
        $donationStats = Donation::query()
            ->select(DB::raw('COUNT(*) AS total'))
            ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) AS completed', [Donation::STATUS_COMPLETED])
            ->selectRaw('COALESCE(SUM(portion_count), 0) AS portions')
            ->first();

        $totalDonations = (int) ($donationStats->total ?? 0);
        $completedDonations = (int) ($donationStats->completed ?? 0);
        $totalPortions = (int) ($donationStats->portions ?? 0);
        $completionRate = $totalDonations > 0
            ? (int) round(($completedDonations / $totalDonations) * 100)
            : 0;

        $claimDurations = Claim::query()
            ->whereNotNull('claimed_at')
            ->whereNotNull('completed_at')
            ->get(['claimed_at', 'completed_at'])
            ->map(fn (Claim $claim) => $claim->claimed_at->diffInMinutes($claim->completed_at, true));

        $averageClaimMinutes = $claimDurations->isEmpty()
            ? 0
            : (int) round($claimDurations->avg());

        $activity = ActivityLog::query()
            ->latest()
            ->limit(8)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'entity_type' => $log->entity_type,
                    'entity_id' => $log->entity_id,
                    'metadata' => $log->metadata,
                    'created_at' => $log->created_at,
                ];
            });

        return response()->json([
            'message' => 'Ringkasan dashboard berhasil diambil',
            'data' => [
                'kpis' => [
                    'total_donations' => $totalDonations,
                    'completion_rate' => $completionRate,
                    'total_portions' => $totalPortions,
                    'avg_claim_minutes' => $averageClaimMinutes,
                ],
                'activity_feed' => $activity,
            ],
        ]);
    }
}
