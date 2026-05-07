<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Donation;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
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

        $perDay = Donation::query()
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->whereBetween('created_at', [$from, $to])
            ->groupByRaw('DATE(created_at)')
            ->orderByRaw('DATE(created_at)')
            ->get()
            ->map(fn ($row) => ['date' => $row->date, 'count' => (int) $row->count]);

        $byStatus = Donation::query()
            ->selectRaw('status, COUNT(*) as count')
            ->whereBetween('created_at', [$from, $to])
            ->groupBy('status')
            ->pluck('count', 'status')
            ->map(fn ($v) => (int) $v);

        $byCategory = Donation::query()
            ->selectRaw('donation_categories.name as category, COUNT(donations.id) as count')
            ->leftJoin('donation_categories', 'donations.category_id', '=', 'donation_categories.id')
            ->whereBetween('donations.created_at', [$from, $to])
            ->groupBy('donation_categories.name')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->map(fn ($row) => ['category' => $row->category ?? 'Tanpa Kategori', 'count' => (int) $row->count]);

        $topDonors = Donation::query()
            ->selectRaw('users.name, COUNT(donations.id) as total')
            ->join('users', 'donations.user_id', '=', 'users.id')
            ->whereBetween('donations.created_at', [$from, $to])
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn ($row) => ['name' => $row->name, 'total' => (int) $row->total]);

        return response()->json([
            'data' => [
                'per_day'     => $perDay,
                'by_status'   => $byStatus,
                'by_category' => $byCategory,
                'top_donors'  => $topDonors,
            ],
        ]);
    }

    public function exportCsv(): StreamedResponse
    {
        $fileName = 'donation-report-' . now()->format('Ymd-His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename={$fileName}",
        ];

        $callback = function () {
            $file = fopen('php://output', 'wb');
            fputcsv($file, ['ID', 'Title', 'Status', 'City', 'Portions', 'Created At']);

            Donation::query()->latest()->chunk(200, function ($donations) use ($file) {
                foreach ($donations as $donation) {
                    fputcsv($file, [
                        $donation->id,
                        $donation->title,
                        $donation->status,
                        $donation->location_city,
                        $donation->portion_count,
                        optional($donation->created_at)->toDateTimeString(),
                    ]);
                }
            });

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
