<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Claim;
use App\Models\Donation;

class DashboardController extends Controller
{
    public function summary()
    {
        $totalDonations = Donation::count();
        $completedDonations = Donation::where('status', Donation::STATUS_COMPLETED)->count();
        $completionRate = $totalDonations > 0
            ? round(($completedDonations / $totalDonations) * 100)
            : 0;
        $totalPortions = Donation::sum('portion_count');
        $averageClaimMinutes = (int) round(
            Claim::whereNotNull('claimed_at')
                ->whereNotNull('completed_at')
                ->get()
                ->avg(function (Claim $claim) {
                    return $claim->claimed_at?->diffInMinutes($claim->completed_at) ?? 0;
                }) ?? 0
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
                    'total_portions' => (int) $totalPortions,
                    'avg_claim_minutes' => $averageClaimMinutes,
                ],
                'activity_feed' => $activity,
            ],
        ]);
    }
}
