<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Donation;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'date_from' => 'nullable|date_format:Y-m-d',
            'date_to' => 'nullable|date_format:Y-m-d|after_or_equal:date_from',
        ]);

        $dateFrom = $request->filled('date_from')
            ? Carbon::parse($request->date_from)->startOfDay()
            : Carbon::now()->subDays(30)->startOfDay();

        $dateTo = $request->filled('date_to')
            ? Carbon::parse($request->date_to)->endOfDay()
            : Carbon::now()->endOfDay();

        $base = Donation::whereBetween('created_at', [$dateFrom, $dateTo]);

        $statusCounts = (clone $base)
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $summary = [
            'total_donations' => (int) $statusCounts->sum(),
            'available' => (int) ($statusCounts['approved'] ?? 0),
            'claimed' => (int) ($statusCounts['claimed'] ?? 0),
            'completed' => (int) ($statusCounts['completed'] ?? 0),
            'cancelled' => (int) ($statusCounts['cancelled'] ?? 0),
        ];

        $perDayRows = (clone $base)
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $perDayMap = [];
        foreach ($perDayRows as $row) {
            $perDayMap[(string) $row->date] = (int) $row->count;
        }

        $donationsPerDay = [];
        $cursor = $dateFrom->copy()->startOfDay();
        $end = $dateTo->copy()->startOfDay();
        while ($cursor->lte($end)) {
            $key = $cursor->format('Y-m-d');
            $donationsPerDay[] = [
                'date' => $key,
                'count' => $perDayMap[$key] ?? 0,
            ];
            $cursor->addDay();
        }

        $topDonors = (clone $base)
            ->select('users.id', 'users.name', DB::raw('COUNT(donations.id) as total'))
            ->join('users', 'users.id', '=', 'donations.user_id')
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'name' => $row->name,
                'total' => (int) $row->total,
            ]);

        $categoryBreakdown = (clone $base)
            ->select('donation_categories.name as category', DB::raw('COUNT(donations.id) as count'))
            ->leftJoin('donation_categories', 'donation_categories.id', '=', 'donations.category_id')
            ->groupBy('donation_categories.name')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($row) => [
                'category' => $row->category ?? 'Tanpa kategori',
                'count' => (int) $row->count,
            ]);

        return response()->json([
            'summary' => $summary,
            'donations_per_day' => $donationsPerDay,
            'top_donors' => $topDonors,
            'category_breakdown' => $categoryBreakdown,
            'date_from' => $dateFrom->toDateString(),
            'date_to' => $dateTo->toDateString(),
        ]);
    }
}
