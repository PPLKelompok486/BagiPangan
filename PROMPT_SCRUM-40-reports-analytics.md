# AI Development Prompt
# SCRUM 40 — As an admin, I can generate donation reports and analytics
# BagiPangan — Admin Reports & Analytics

---

## TOOLS TO USE

This task should be implemented using:
- **MCP EXE** — run `php artisan route:list --path=admin` to verify new routes, `npm run build --prefix fe-nextjs` to check for type errors after adding chart components
- **Stocky** — not needed for this task (no imagery)
- **Magic** — use Magic to scaffold the recharts dashboard layout (KPI cards row, LineChart, PieChart, BarChart grid sections) to match BagiPangan's brand style

---

## 1. CONTEXT & GOAL

You are improving the admin reports feature for **BagiPangan** (Laravel 13 + Next.js 16). Admin users need to not just export CSV data, but also **view interactive analytics charts** directly in the browser.

**User story:** As an admin, I can generate donation reports and analytics — including seeing trends over time, status breakdown, and category distribution — all from a single reports page.

**Git branch:** Push directly to the existing branch `SCRUM-40-As-an-admin-I-can-generate-donation-reports-and-analytics`.  
No PR needed — continue building on what's already there.

---

## 2. WHAT ALREADY EXISTS — DO NOT REBUILD

| File | Status |
|---|---|
| `be-laravel/app/Http/Controllers/Admin/ExportReportController.php` | ✅ EXISTS — full CSV export with date/status/donor filters + activity log |
| `be-laravel/app/Http/Controllers/Admin/ReportController.php` | ✅ EXISTS — simple `exportCsv()` |
| `be-laravel/app/Http/Controllers/Admin/DashboardController.php` | ✅ EXISTS — returns KPIs: `total_donations`, `completion_rate`, `total_portions`, `avg_claim_minutes` + activity feed |
| `fe-nextjs/app/admin/reports/page.tsx` | ✅ EXISTS — date/status/donor filter UI + "Export CSV" button with Blob download |
| `fe-nextjs/app/api/admin/reports/export/route.ts` | ✅ EXISTS — proxy to Laravel export |
| `fe-nextjs/app/admin/page.tsx` | ✅ EXISTS — admin dashboard with KPI cards |

**What's missing:** The reports page has ONLY the export form. It has no analytics charts, no trend graphs, no category breakdown. This prompt adds them.

---

## 3. WHAT TO BUILD

### 3.1 Backend — New analytics endpoint

**Create route:** `GET /admin/reports/analytics` (inside existing admin prefix group with `token.auth` + `admin` middleware).

Add to `be-laravel/routes/api.php` in the bottom `prefix('admin')->middleware(['token.auth', 'admin'])` group:
```php
Route::get('/reports/analytics', [\App\Http\Controllers\Admin\ReportController::class, 'analytics']);
```

**Create method:** `ReportController@analytics`

```php
public function analytics(Request $request): \Illuminate\Http\JsonResponse
{
    $request->validate([
        'date_from' => ['nullable', 'date_format:Y-m-d'],
        'date_to'   => ['nullable', 'date_format:Y-m-d'],
    ]);

    $from = $request->input('date_from')
        ? \Carbon\Carbon::parse($request->input('date_from'))->startOfDay()
        : now()->subDays(29)->startOfDay();

    $to = $request->input('date_to')
        ? \Carbon\Carbon::parse($request->input('date_to'))->endOfDay()
        : now()->endOfDay();

    // 1. Donations per day
    $perDay = Donation::query()
        ->selectRaw("DATE(created_at) as date, COUNT(*) as count")
        ->whereBetween('created_at', [$from, $to])
        ->groupByRaw("DATE(created_at)")
        ->orderByRaw("DATE(created_at)")
        ->get()
        ->map(fn ($row) => ['date' => $row->date, 'count' => (int) $row->count]);

    // 2. Status breakdown
    $byStatus = Donation::query()
        ->selectRaw("status, COUNT(*) as count")
        ->whereBetween('created_at', [$from, $to])
        ->groupBy('status')
        ->pluck('count', 'status')
        ->map(fn ($v) => (int) $v);

    // 3. Category breakdown
    $byCategory = Donation::query()
        ->selectRaw("donation_categories.name as category, COUNT(donations.id) as count")
        ->leftJoin('donation_categories', 'donations.category_id', '=', 'donation_categories.id')
        ->whereBetween('donations.created_at', [$from, $to])
        ->groupBy('donation_categories.name')
        ->orderByDesc('count')
        ->limit(10)
        ->get()
        ->map(fn ($row) => ['category' => $row->category ?? 'Tanpa Kategori', 'count' => (int) $row->count]);

    // 4. Top donors
    $topDonors = Donation::query()
        ->selectRaw("users.name, COUNT(donations.id) as total")
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
```

### 3.2 Frontend — Next.js proxy route

**Create:** `fe-nextjs/app/api/admin/reports/analytics/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BAGIPANGAN_BACKEND_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("bagi_token")?.value;
  const search = req.nextUrl.searchParams.toString();
  const url = `${BACKEND}/api/admin/reports/analytics${search ? `?${search}` : ""}`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
```

### 3.3 Frontend — Reports page analytics section

**Modify:** `fe-nextjs/app/admin/reports/page.tsx`

Install recharts if not already present: `npm install recharts --prefix fe-nextjs` (use MCP EXE).

Add an analytics section ABOVE the existing export form. The analytics section uses the same `dateFrom`/`dateTo` state the export form already has — so both sections share the same filters.

**Key additions:**

```typescript
// At top of component, add analytics state:
type AnalyticsData = {
  per_day: { date: string; count: number }[];
  by_status: Record<string, number>;
  by_category: { category: string; count: number }[];
  top_donors: { name: string; total: number }[];
};

const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
const [analyticsLoading, setAnalyticsLoading] = useState(false);

// Fetch analytics when dates change (debounced 400ms):
useEffect(() => {
  if (!dateFrom || !dateTo || dateFrom > dateTo) return;
  const handle = setTimeout(async () => {
    setAnalyticsLoading(true);
    try {
      const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
      const res = await fetch(`/api/admin/reports/analytics?${params}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setAnalytics(json.data);
      }
    } catch { /* silent */ } finally {
      setAnalyticsLoading(false);
    }
  }, 400);
  return () => clearTimeout(handle);
}, [dateFrom, dateTo]);
```

**Add these chart sections between the page header and the export form:**

```tsx
{/* ── KPI Summary Row ── */}
<section className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {[
    { label: "Total Donasi", value: totalFromPerDay, color: "var(--brand-600)" },
    { label: "Disetujui", value: analytics?.by_status?.approved ?? 0, color: "#16a34a" },
    { label: "Diklaim", value: analytics?.by_status?.claimed ?? 0, color: "#d97706" },
    { label: "Selesai", value: analytics?.by_status?.completed ?? 0, color: "#6366f1" },
  ].map((kpi) => (
    <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} color={kpi.color} loading={analyticsLoading} />
  ))}
</section>

{/* ── Trend Line Chart ── */}
<section className="rounded-[1.6rem] border border-(--brand-100) bg-white p-6 shadow-(--shadow-card)">
  <h3 className="text-lg font-semibold text-(--brand-900) mb-4">Donasi per Hari</h3>
  {/* recharts ResponsiveContainer > LineChart with per_day data */}
</section>

{/* ── Category Bar + Status Pie grid ── */}
<div className="grid md:grid-cols-2 gap-4">
  <section className="rounded-[1.6rem] border ...">
    <h3>Distribusi Kategori</h3>
    {/* recharts BarChart with by_category */}
  </section>
  <section className="rounded-[1.6rem] border ...">
    <h3>Status Donasi</h3>
    {/* recharts PieChart with by_status */}
  </section>
</div>

{/* ── Top Donors table ── */}
<section className="rounded-[1.6rem] border ...">
  <h3>Top 5 Donatur</h3>
  {/* table: rank / name / total donations */}
</section>
```

**Status color map for the Pie chart:**
```typescript
const STATUS_COLOR: Record<string, string> = {
  pending:   "#f59e0b",
  approved:  "#16a34a",
  rejected:  "#ef4444",
  claimed:   "#d97706",
  completed: "#6366f1",
  cancelled: "#94a3b8",
};
```

**Loading state:** When `analyticsLoading` is true, show pulse-skeleton divs in place of each chart section. Use `animate-pulse` with `bg-[var(--brand-50)]`.

---

## 4. ACCEPTANCE CRITERIA

- [ ] `GET /api/admin/reports/analytics?date_from=&date_to=` returns `per_day`, `by_status`, `by_category`, `top_donors`
- [ ] Analytics data re-fetches automatically when `dateFrom`/`dateTo` changes (400ms debounce)
- [ ] Reports page shows a KPI summary row above the export form
- [ ] Reports page shows a line chart of donations per day
- [ ] Reports page shows a bar chart of category breakdown
- [ ] Reports page shows a pie/donut chart of status distribution
- [ ] Reports page shows top 5 donors table
- [ ] All charts use `ResponsiveContainer` from recharts for mobile responsiveness
- [ ] Charts show loading skeletons while `analyticsLoading` is true
- [ ] Existing CSV export functionality is NOT broken
- [ ] `npm run build --prefix fe-nextjs` passes (verify with MCP EXE)
- [ ] `php artisan route:list --path=admin/reports` shows the new analytics route (verify with MCP EXE)

---

## 5. DO NOT CHANGE

- `be-laravel/app/Http/Controllers/Admin/ExportReportController.php` — the full export controller
- `fe-nextjs/app/api/admin/reports/export/route.ts` — the export proxy
- `fe-nextjs/app/admin/page.tsx` — the main admin dashboard
- The existing export form UI in `reports/page.tsx` — only ADD content above it

---

## 6. DESIGN NOTES

- Use CSS variables throughout: `text-(--brand-900)`, `border-(--brand-100)`, `shadow-(--shadow-card)`
- Match the rounded card style from existing admin pages: `rounded-[1.6rem]`
- Chart tooltips: format dates as `dd MMM` in `id-ID` locale
- Y-axis of line chart: whole numbers only (no decimals for donation counts)
- Pie chart: show percentage labels outside each segment
- Use Magic to generate the chart section layout if you want a polished starting point that matches the BagiPangan design system
