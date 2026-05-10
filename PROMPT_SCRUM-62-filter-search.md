# AI Development Prompt
# SCRUM 62 — As a user, I can filter and search for donations
# BagiPangan — Server-Side Search & Filter

---

## TOOLS TO USE

This task should be implemented using:
- **MCP EXE** — run `php artisan route:list --path=donations`, `php artisan test`, and `npm run lint --prefix fe-nextjs` to verify changes
- **Stocky** — not needed for this task
- **Magic** — use Magic to generate the category dropdown + location filter UI components that match the existing BagiPangan filter chip style

---

## 1. CONTEXT & GOAL

You are improving the search and filter feature for **BagiPangan** (Laravel 13 + Next.js 16). Currently, filtering is done entirely on the client — all approved donations are fetched at once and then filtered in the browser. This doesn't scale.

**User story:** As a user, I can search and filter donations by keyword, category, and city — with results coming from the server, not just filtered in memory.

**Git branch:** Push directly to the existing branch `SCRUM-62-As-a-user-I-can-filter-and-search-for-donations`.  
No PR needed — continue building on what's already there.

---

## 2. WHAT ALREADY EXISTS — DO NOT REBUILD

| File | Status |
|---|---|
| `be-laravel/app/Http/Controllers/DonationController.php` — `index()` | ✅ EXISTS — returns all `approved` donations, no filters, no pagination |
| `fe-nextjs/app/receiver/dashboard/page.tsx` | ✅ EXISTS — client-side filter: keyword search, "Mendesak", "Hari ini" urgency chips |
| `fe-nextjs/app/donatur/donations/page.tsx` | ✅ EXISTS — client-side filter: keyword search + status filter chips |
| `fe-nextjs/lib/donations.ts` — `mapApiDonation()`, `ApiDonation` type | ✅ EXISTS |
| `be-laravel/routes/api.php` — `GET /donations` | ✅ EXISTS — public route |

**What's missing:** The `DonationController@index` has NO query params. It returns every approved donation in one unfiltered batch. Server-side search, category filter, city filter, and pagination are all missing.

---

## 3. WHAT TO BUILD

### 3.1 Backend — `DonationController@index`

**Current implementation:**
```php
public function index(Request $request)
{
    $donations = Donation::with(['user:id,name,city', 'category'])
        ->where('status', 'approved')
        ->orderByDesc('created_at')
        ->paginate(15);

    return response()->json($donations);
}
```

**Replace with:**
```php
public function index(Request $request)
{
    $request->validate([
        'q'           => ['nullable', 'string', 'max:120'],
        'category_id' => ['nullable', 'integer', 'exists:donation_categories,id'],
        'city'        => ['nullable', 'string', 'max:100'],
        'sort'        => ['nullable', 'in:newest,oldest,expiry_soon'],
        'per_page'    => ['nullable', 'integer', 'min:1', 'max:50'],
    ]);

    $query = Donation::with(['user:id,name,city', 'category:id,name'])
        ->where('status', 'approved');

    // Keyword search: title + description
    if ($q = $request->input('q')) {
        $needle = '%' . strtolower($q) . '%';
        $query->where(function ($sub) use ($needle) {
            $sub->whereRaw('LOWER(title) LIKE ?', [$needle])
                ->orWhereRaw('LOWER(description) LIKE ?', [$needle]);
        });
    }

    // Category filter
    if ($categoryId = $request->input('category_id')) {
        $query->where('category_id', $categoryId);
    }

    // City filter (matches donation location_city OR donor's city)
    if ($city = $request->input('city')) {
        $cityNeedle = '%' . strtolower($city) . '%';
        $query->where(function ($sub) use ($cityNeedle) {
            $sub->whereRaw('LOWER(location_city) LIKE ?', [$cityNeedle])
                ->orWhereHas('user', fn ($u) => $u->whereRaw('LOWER(city) LIKE ?', [$cityNeedle]));
        });
    }

    // Sorting
    $sort = $request->input('sort', 'newest');
    match ($sort) {
        'oldest'      => $query->orderBy('created_at'),
        'expiry_soon' => $query->orderBy('available_until'),
        default       => $query->orderByDesc('created_at'),
    };

    $perPage = (int) $request->input('per_page', 15);
    return response()->json($query->paginate($perPage));
}
```

**Add DB indexes for performance** (new migration):
```
php artisan make:migration add_search_indexes_to_donations_table
```
```php
public function up(): void
{
    Schema::table('donations', function (Blueprint $table) {
        $table->index(['status', 'created_at']);
        $table->index(['status', 'available_until']);
        $table->index('category_id');
        $table->index('location_city');
    });
}
```

---

### 3.2 Frontend — `ApiDonation` type update

The backend paginate response wraps data in Laravel's standard paginator shape. Add the paginator type to `fe-nextjs/lib/donations.ts`:

```typescript
export type PaginatedDonations = {
  data: ApiDonation[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};
```

---

### 3.3 Frontend — Receiver dashboard (`app/receiver/dashboard/page.tsx`)

**Current:** Uses SWR to fetch `/donations` (all), then filters client-side.

**Change:** Pass search params to the API. Keep SWR but build the URL dynamically.

**Key changes:**

1. Add `category_id` to the filter state alongside existing `query` and `filterKey`:
```typescript
const [categoryId, setCategoryId] = useState<string>("");
```

2. Build the SWR key with query params:
```typescript
const swrKey = useMemo(() => {
  const params = new URLSearchParams();
  params.set("per_page", "30");
  if (query.trim()) params.set("q", query.trim());
  if (categoryId) params.set("category_id", categoryId);
  if (filterKey === "urgent") params.set("sort", "expiry_soon");
  return `/donations?${params.toString()}`;
}, [query, categoryId, filterKey]);

const { data: donationsPayload, ... } = useSWR<DonationsPayload>(swrKey, fetcher, { ... });
```

3. Update the fetcher to handle paginated response:
```typescript
const fetcher = async (path: string): Promise<DonationsPayload> => {
  const res = await apiFetch<PaginatedDonations>(path);
  return { list: res.data.map(mapApiDonation), fetchedAt: Date.now() };
};
```

4. Add a **category dropdown** to the filter bar. Fetch categories from `GET /donations/categories` (already exists). Render as filter chips or a `<select>`:
```tsx
// Below existing filter chips, add:
{categories.length > 0 && (
  <div className="flex items-center gap-1.5 flex-wrap mt-2">
    <FilterChip active={categoryId === ""} onClick={() => setCategoryId("")}>
      Semua Kategori
    </FilterChip>
    {categories.map((cat) => (
      <FilterChip
        key={cat.id}
        active={categoryId === String(cat.id)}
        onClick={() => setCategoryId(String(cat.id))}
      >
        {cat.name}
      </FilterChip>
    ))}
  </div>
)}
```

5. **Keep client-side urgency/today filter logic** for the "Mendesak" and "Hari ini" chips — these are time-based and don't need a server round-trip.

6. **Add pagination controls** at the bottom. The SWR response now contains `last_page` and `current_page`:
```tsx
{lastPage > 1 && (
  <div className="flex justify-center gap-2 mt-6">
    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</button>
    <span>{page} / {lastPage}</span>
    <button disabled={page === lastPage} onClick={() => setPage(p => p + 1)}>→</button>
  </div>
)}
```

---

### 3.4 Frontend — Donatur donations list (`app/donatur/donations/page.tsx`)

**Current:** Fetches `/donations/mine` (all), filters client-side by status and keyword.

The donor list fetches `/donations/mine` which is their own donations — this endpoint doesn't need server-side search since donors typically have a small number of donations. **Keep client-side filtering for this page** — it's appropriate at this scale.

**However, add URL state sync** so filter state persists on back-navigation:
```typescript
// Read initial filter from URL
const searchParams = useSearchParams();
const [query, setQuery] = useState(searchParams.get("q") ?? "");
const [filterKey, setFilterKey] = useState<FilterKey>(
  (searchParams.get("status") as FilterKey) ?? "all"
);

// Sync to URL on change
const router = useRouter();
const pathname = usePathname();
useEffect(() => {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (filterKey !== "all") params.set("status", filterKey);
  const qs = params.toString();
  router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
}, [query, filterKey, pathname, router]);
```

Wrap the component in `<Suspense>` and use `useSearchParams()` via `"use client"`.

---

## 4. ACCEPTANCE CRITERIA

- [ ] `GET /donations?q=nasi` returns only donations matching "nasi" in title or description
- [ ] `GET /donations?category_id=2` returns only donations in that category
- [ ] `GET /donations?city=bandung` returns only donations in Bandung
- [ ] `GET /donations?sort=expiry_soon` returns donations sorted by soonest expiry first
- [ ] Response is paginated (`current_page`, `last_page`, `total` fields present)
- [ ] Receiver dashboard sends filter params to the API (not client-side only)
- [ ] Receiver dashboard shows category filter chips populated from `GET /donations/categories`
- [ ] Receiver dashboard shows pagination controls when `last_page > 1`
- [ ] Donatur donations list syncs filter state to URL query params
- [ ] `php artisan test` still passes (verify with MCP EXE)
- [ ] `npm run lint --prefix fe-nextjs` passes (verify with MCP EXE)

---

## 5. DO NOT CHANGE

- `be-laravel/app/Http/Controllers/MapController.php` — map search already implemented separately
- `fe-nextjs/components/map/` — all map components
- `fe-nextjs/hooks/useDonationMap.ts` — map hook already handles its own filters
- The urgency/today filter logic in the receiver dashboard (keep it, it's client-side and fine)

---

## 6. DESIGN NOTES

- Category filter chips should use the same `FilterChip` component that already exists in the receiver dashboard
- The category filter should be placed in a second row below the keyword search + urgency chips
- On mobile: the category chips row should be horizontally scrollable (use `overflow-x-auto`)
- When there are no results due to a server filter, show the existing `EmptyState` component
- Use **Magic** to generate the category dropdown if a select-style filter is preferred over chips — match the existing visual style (rounded-xl border, brand color focus ring)
- Debounce the keyword input 400ms before triggering a new SWR fetch (use `useDeferredValue` — already done in `DonationMapPageContent.tsx`, same pattern here)
