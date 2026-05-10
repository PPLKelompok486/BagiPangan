<?php

namespace App\Services;

use App\Models\Donation;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Provides aggregate queries used by the admin analytics dashboard.
 *
 * Each method takes an inclusive [from, to] window and returns a
 * Collection ready to be serialized as JSON. Splitting these out of
 * the controller keeps `ReportController@analytics` thin and makes
 * each query block individually unit-testable.
 */
class DonationAnalyticsService
{
    /**
     * Donations grouped per calendar day in the window.
     *
     * @return Collection<int, array{date: string, count: int}>
     */
    public function perDay(Carbon $from, Carbon $to): Collection
    {
        return Donation::query()
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->whereBetween('created_at', [$from, $to])
            ->groupByRaw('DATE(created_at)')
            ->orderByRaw('DATE(created_at)')
            ->get()
            ->map(fn ($row) => [
                'date' => $row->date,
                'count' => (int) $row->count,
            ]);
    }

    /**
     * Donations grouped by status. Keyed by status string.
     *
     * @return Collection<string, int>
     */
    public function byStatus(Carbon $from, Carbon $to): Collection
    {
        return Donation::query()
            ->selectRaw('status, COUNT(*) as count')
            ->whereBetween('created_at', [$from, $to])
            ->groupBy('status')
            ->pluck('count', 'status')
            ->map(fn ($v) => (int) $v);
    }

    /**
     * Top categories by donation count (capped to 10).
     *
     * @return Collection<int, array{category: string, count: int}>
     */
    public function byCategory(Carbon $from, Carbon $to): Collection
    {
        return Donation::query()
            ->selectRaw('donation_categories.name as category, COUNT(donations.id) as count')
            ->leftJoin('donation_categories', 'donations.category_id', '=', 'donation_categories.id')
            ->whereBetween('donations.created_at', [$from, $to])
            ->groupBy('donation_categories.name')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'category' => $row->category ?? 'Tanpa Kategori',
                'count' => (int) $row->count,
            ]);
    }

    /**
     * Top donors by donation count.
     *
     * @return Collection<int, array{name: string, total: int}>
     */
    public function topDonors(Carbon $from, Carbon $to, int $limit = 5): Collection
    {
        return Donation::query()
            ->selectRaw('users.name, COUNT(donations.id) as total')
            ->join('users', 'donations.user_id', '=', 'users.id')
            ->whereBetween('donations.created_at', [$from, $to])
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('total')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->name,
                'total' => (int) $row->total,
            ]);
    }
}
