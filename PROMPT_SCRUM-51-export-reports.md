# AI Development Prompt
# SCRUM 51 — As a user, I can export reports
# BagiPangan — User-Facing Report Export (Donatur & Penerima)

---

## TOOLS TO USE

This task should be implemented using:
- **MCP EXE** — run `php artisan route:list --path=donations/mine`, `php artisan route:list --path=claims/mine`, and `npm run build --prefix fe-nextjs` to verify the new export endpoints and check for TypeScript errors
- **Stocky** — not needed for this task
- **Magic** — use Magic to generate the export button + toast notification UI components that match the existing BagiPangan design style (rounded-full button, success/error toast)

---

## 1. CONTEXT & GOAL

You are extending the export reports feature for **BagiPangan** (Laravel 13 + Next.js 16). Currently, only admins can export data via CSV. Regular users — donors (Donatur) and receivers (Penerima) — have no way to export their own activity history.

**User story:** As a user (Donatur or Penerima), I can export a CSV report of my own donation or claim history.

**Git branch:** Push directly to the existing branch `SCRUM-51-As-a-user-I-can-export-reports`.  
No PR needed — continue building on what's already there.

---

## 2. WHAT ALREADY EXISTS — DO NOT REBUILD

| File | Status |
|---|---|
| `be-laravel/app/Http/Controllers/Admin/ExportReportController.php` | ✅ EXISTS — admin CSV export with full filtering and activity log |
| `fe-nextjs/app/admin/reports/page.tsx` | ✅ EXISTS — admin export UI (date/status/donor filters + download button) |
| `fe-nextjs/app/api/admin/reports/export/route.ts` | ✅ EXISTS — admin proxy route |
| `be-laravel/app/Http/Controllers/DonationController.php` — `mine()` | ✅ EXISTS — returns authenticated donor's own donations |
| `be-laravel/app/Http/Controllers/ClaimController.php` — `mine()` | ✅ EXISTS — returns authenticated receiver's own claims |
| `be-laravel/routes/api.php` — `token.auth` middleware group | ✅ EXISTS |

**What's missing:** There are no user-facing export endpoints. Donatur and Penerima cannot download their own history as CSV.

---

## 3. WHAT TO BUILD

### 3.1 Backend — Donatur donation export

**Add route** in `be-laravel/routes/api.php`, inside the `Route::middleware('token.auth')` group:
```php
Route::get('/donations/mine/export', [DonationController::class, 'exportMine']);
```

> ⚠️ Add this BEFORE `Route::get('/donations/mine', ...)` — Laravel matches routes in order, and `/donations/mine/export` must be declared before the `mine` route to avoid conflict.

**Add method** `DonationController@exportMine`:
```php
public function exportMine(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
{
    $userId = Auth::id();
    $fileName = 'donasi-saya-' . now()->format('Ymd-His') . '.csv';

    $headers = [
        'Content-Type'        => 'text/csv; charset=UTF-8',
        'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        'Cache-Control'       => 'no-store, no-cache, must-revalidate',
    ];

    $callback = function () use ($userId) {
        $file = fopen('php://output', 'wb');
        fwrite($file, "\xEF\xBB\xBF"); // UTF-8 BOM for Excel compatibility

        fputcsv($file, [
            'ID', 'Judul', 'Kategori', 'Kota', 'Status',
            'Jumlah Porsi', 'Tersedia Dari', 'Tersedia Hingga', 'Tgl Dibuat',
        ]);

        Donation::query()
            ->with(['category:id,name'])
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->lazy(200)
            ->each(function (Donation $donation) use ($file) {
                fputcsv($file, [
                    $donation->id,
                    $donation->title,
                    optional($donation->category)->name ?? '',
                    $donation->location_city ?? '',
                    $donation->status,
                    $donation->portion_count,
                    optional($donation->available_from)->toDateTimeString() ?? '',
                    optional($donation->available_until)->toDateTimeString() ?? '',
                    optional($donation->created_at)->toDateTimeString() ?? '',
                ]);
            });

        fclose($file);
    };

    return response()->stream($callback, 200, $headers);
}
```

---

### 3.2 Backend — Penerima claim export

**Add route** in `be-laravel/routes/api.php`, inside the `Route::middleware('token.auth')` group:
```php
Route::get('/claims/mine/export', [ClaimController::class, 'exportMine']);
```

**Add method** `ClaimController@exportMine`:
```php
public function exportMine(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
{
    $receiverId = Auth::id();
    $fileName = 'klaim-saya-' . now()->format('Ymd-His') . '.csv';

    $headers = [
        'Content-Type'        => 'text/csv; charset=UTF-8',
        'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        'Cache-Control'       => 'no-store, no-cache, must-revalidate',
    ];

    $callback = function () use ($receiverId) {
        $file = fopen('php://output', 'wb');
        fwrite($file, "\xEF\xBB\xBF");

        fputcsv($file, [
            'ID Klaim', 'ID Donasi', 'Judul Donasi', 'Kategori',
            'Donatur', 'Kota', 'Status Klaim', 'Tgl Diklaim', 'Tgl Selesai',
        ]);

        \App\Models\Claim::query()
            ->with([
                'donation:id,title,location_city,category_id,user_id',
                'donation.category:id,name',
                'donation.user:id,name',
            ])
            ->where('receiver_id', $receiverId)
            ->orderByDesc('claimed_at')
            ->lazy(200)
            ->each(function (\App\Models\Claim $claim) use ($file) {
                fputcsv($file, [
                    $claim->id,
                    optional($claim->donation)->id ?? '',
                    optional($claim->donation)->title ?? '',
                    optional($claim->donation?->category)->name ?? '',
                    optional($claim->donation?->user)->name ?? '',
                    optional($claim->donation)->location_city ?? '',
                    $claim->status,
                    optional($claim->claimed_at)->toDateTimeString() ?? '',
                    optional($claim->completed_at)->toDateTimeString() ?? '',
                ]);
            });

        fclose($file);
    };

    return response()->stream($callback, 200, $headers);
}
```

> Check `be-laravel/app/Models/Claim.php` — ensure relationships `donation()` → `BelongsTo(Donation::class)` exists. If not, add it.

---

### 3.3 Frontend — Next.js proxy routes

**Create:** `fe-nextjs/app/api/donations/mine/export/route.ts`
```typescript
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.BAGIPANGAN_BACKEND_URL ?? "http://localhost:8000";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("bagi_token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${BACKEND}/api/donations/mine/export`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "text/csv" },
    cache: "no-store",
  });

  if (!res.ok) return NextResponse.json({ message: "Gagal mengekspor" }, { status: res.status });

  const blob = await res.blob();
  const filename = `donasi-saya-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(blob, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=UTF-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
```

**Create:** `fe-nextjs/app/api/claims/mine/export/route.ts`
```typescript
// Same pattern as above — swap /donations/mine/export → /claims/mine/export
// and filename prefix → klaim-saya
```

---

### 3.4 Frontend — Export button on Donatur donations list

**Modify:** `fe-nextjs/app/donatur/donations/page.tsx`

Add an "Export CSV" button next to the "Buat donasi baru" button in the page header:

```tsx
import { Download, Loader2 } from "lucide-react";

// Add state:
const [exporting, setExporting] = useState(false);

async function handleExport() {
  if (exporting) return;
  setExporting(true);
  try {
    const res = await fetch("/api/donations/mine/export", { cache: "no-store" });
    if (!res.ok) throw new Error("Gagal mengunduh laporan");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `donasi-saya-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert(err instanceof Error ? err.message : "Gagal mengunduh");
  } finally {
    setExporting(false);
  }
}
```

**In the header row**, add after the "Buat donasi baru" link:
```tsx
<button
  type="button"
  onClick={handleExport}
  disabled={exporting}
  className="inline-flex items-center gap-2 rounded-xl border border-[var(--brand-200)] px-4 py-2.5 text-sm font-semibold text-[var(--brand-700)] hover:bg-[var(--brand-50)] disabled:opacity-50"
>
  {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
  Export CSV
</button>
```

---

### 3.5 Frontend — Export button on Receiver my-claims page

**Modify:** `fe-nextjs/app/receiver/my-claims/page.tsx`

Read the current file first. Add the same export button pattern to the page header, pointing to `/api/claims/mine/export` and downloading as `klaim-saya-{date}.csv`.

Use **Magic** to generate this button component styled to match the existing BagiPangan receiver layout style.

---

## 4. ACCEPTANCE CRITERIA

- [ ] `GET /donations/mine/export` (authenticated donatur) returns a CSV with all their donations
- [ ] `GET /claims/mine/export` (authenticated penerima) returns a CSV with all their claims
- [ ] Both endpoints require authentication — unauthenticated requests return 401
- [ ] Both endpoints return UTF-8 BOM for Excel compatibility
- [ ] Donatur donations list page has an "Export CSV" button that triggers the download
- [ ] Receiver my-claims page has an "Export CSV" button that triggers the download
- [ ] Download triggers as a file save (not opening in browser tab)
- [ ] Export button shows a spinner while downloading
- [ ] `php artisan route:list | grep export` shows 3 export routes: admin, mine/donations, mine/claims (verify with MCP EXE)
- [ ] `npm run build --prefix fe-nextjs` passes with no errors (verify with MCP EXE)

---

## 5. DO NOT CHANGE

- `be-laravel/app/Http/Controllers/Admin/ExportReportController.php` — admin export stays intact
- `fe-nextjs/app/admin/reports/page.tsx` — admin export UI unchanged
- `fe-nextjs/app/api/admin/reports/export/route.ts` — admin proxy unchanged
- The Claim model relationships that already exist

---

## 6. DESIGN NOTES

- Export buttons should be secondary style (outlined/ghost) — not the primary green button — since they're supplementary actions
- The export button on mobile should show only the `Download` icon (icon-only button) to save space; on desktop show icon + "Export CSV" label
- No toast is strictly required, but if you add one, match the success/error toast pattern from `app/admin/reports/page.tsx` (green bg for success, red for error)
- Use **Magic** to generate a reusable `<ExportCsvButton>` component that both the donatur and receiver pages can share, to avoid duplicating the fetch + Blob download logic
