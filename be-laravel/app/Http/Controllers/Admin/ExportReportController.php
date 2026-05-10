<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExportReportRequest;
use App\Models\ActivityLog;
use App\Models\Claim;
use App\Models\Donation;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportReportController extends Controller
{
    public function export(ExportReportRequest $request): StreamedResponse
    {
        $dateFrom = $request->validated('date_from');
        $dateTo = $request->validated('date_to');
        $status = $request->validated('status');
        $donorId = $request->validated('donor_id');

        $fileName = sprintf('donasi_%s_to_%s.csv', $dateFrom, $dateTo);

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
            'Pragma' => 'no-cache',
        ];

        $startOfFrom = Carbon::createFromFormat('Y-m-d', $dateFrom)->startOfDay();
        $endOfTo = Carbon::createFromFormat('Y-m-d', $dateTo)->endOfDay();

        $userId = $request->user()?->id;

        $callback = function () use ($startOfFrom, $endOfTo, $status, $donorId, $userId, $dateFrom, $dateTo) {
            $file = fopen('php://output', 'wb');

            fwrite($file, "\xEF\xBB\xBF");

            fputcsv($file, [
                'ID',
                'Judul',
                'Kategori',
                'Donatur',
                'Kota',
                'Status',
                'Jumlah',
                'Satuan',
                'Tgl Dibuat',
                'Tgl Klaim',
            ]);

            $query = Donation::query()
                ->with(['user:id,name,city', 'category:id,name'])
                ->leftJoin('claims', function ($join) {
                    $join->on('claims.donation_id', '=', 'donations.id')
                        ->whereIn('claims.status', [
                            Claim::STATUS_APPROVED,
                            Claim::STATUS_COMPLETED,
                        ]);
                })
                ->whereBetween('donations.created_at', [$startOfFrom, $endOfTo])
                ->when($status, fn ($q) => $q->where('donations.status', $status))
                ->when($donorId, fn ($q) => $q->where('donations.user_id', $donorId))
                ->select([
                    'donations.*',
                    DB::raw('MAX(claims.claimed_at) as latest_claimed_at'),
                ])
                ->groupBy('donations.id')
                ->orderBy('donations.created_at', 'desc');

            $totalRows = 0;

            $query->lazy(500)->each(function (Donation $donation) use ($file, &$totalRows) {
                fputcsv($file, [
                    $donation->id,
                    $donation->title,
                    optional($donation->category)->name,
                    optional($donation->user)->name,
                    $donation->location_city ?: optional($donation->user)->city,
                    $donation->status,
                    $donation->portion_count,
                    'porsi',
                    optional($donation->created_at)->toDateTimeString(),
                    $donation->latest_claimed_at
                        ? Carbon::parse($donation->latest_claimed_at)->toDateTimeString()
                        : '',
                ]);
                $totalRows++;
            });

            fclose($file);

            ActivityLog::create([
                'actor_user_id' => $userId,
                'action' => 'export_report',
                'entity_type' => 'report',
                'entity_id' => null,
                'metadata' => [
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                    'status' => $status,
                    'donor_id' => $donorId,
                    'total_rows' => $totalRows,
                ],
            ]);
        };

        return response()->stream($callback, 200, $headers);
    }
}
