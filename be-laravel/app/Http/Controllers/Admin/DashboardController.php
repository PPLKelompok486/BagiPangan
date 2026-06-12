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
        // Single grouped query replaces two full-table COUNTs + a SUM. The
        // status FILTER is a Postgres-specific aggregate that lets the DB
        // bucket totals in one scan.
        $donationStats = Donation::query()
            ->select(DB::raw('COUNT(*) AS total'))
            ->selectRaw('COUNT(*) FILTER (WHERE status = ?) AS completed', [Donation::STATUS_COMPLETED])
            ->selectRaw('COALESCE(SUM(portion_count), 0) AS portions')
            ->first();

        $totalDonations = (int) ($donationStats->total ?? 0);
        $completedDonations = (int) ($donationStats->completed ?? 0);
        $totalPortions = (int) ($donationStats->portions ?? 0);
        $completionRate = $totalDonations > 0
            ? (int) round(($completedDonations / $totalDonations) * 100)
            : 0;

        // Postgres EXTRACT(EPOCH FROM interval) gives seconds; divide by 60 for
        // minutes. This used to iterate every claim in PHP and was O(N) in
        // memory; now the DB returns a single scalar.
        $averageClaimMinutes = (int) round(
            Claim::whereNotNull('claimed_at')
                ->whereNotNull('completed_at')
                ->value(DB::raw('COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - claimed_at)) / 60), 0)'))
        );

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
