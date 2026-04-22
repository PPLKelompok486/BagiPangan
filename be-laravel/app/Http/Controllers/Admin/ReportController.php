<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Donation;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
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
