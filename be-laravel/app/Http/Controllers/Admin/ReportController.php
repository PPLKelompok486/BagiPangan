<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\DonationAnalyticsService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private readonly DonationAnalyticsService $analytics)
    {
    }

    public function analytics(Request $request): JsonResponse
    {
        $request->validate([
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to'   => ['nullable', 'date_format:Y-m-d'],
        ]);

        $from = $request->input('date_from')
            ? Carbon::parse($request->input('date_from'))->startOfDay()
            : now()->subDays(29)->startOfDay();

        $to = $request->input('date_to')
            ? Carbon::parse($request->input('date_to'))->endOfDay()
            : now()->endOfDay();

        return response()->json([
            'data' => [
                'per_day'     => $this->analytics->perDay($from, $to),
                'by_status'   => $this->analytics->byStatus($from, $to),
                'by_category' => $this->analytics->byCategory($from, $to),
                'top_donors'  => $this->analytics->topDonors($from, $to),
            ],
        ]);
    }
}
