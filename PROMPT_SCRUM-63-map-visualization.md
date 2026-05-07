# AI Development Prompt
# SCRUM 63 — As a user, I can view a map visualization
# BagiPangan — Map Visualization Improvements

---

## TOOLS TO USE

This task should be implemented using:
- **MCP EXE** — run `npm install` (if new packages needed), `npm run lint --prefix fe-nextjs`, and `npm run build --prefix fe-nextjs` to verify all changes compile cleanly
- **Stocky** — use Stocky to fetch a good map-placeholder / food location imagery via Pexels for the empty-state illustration when no donations have coordinates
- **Magic** — use Magic to generate the "Gunakan Lokasi Saya" floating action button and the improved mobile filter panel that match BagiPangan's design system

---

## 1. CONTEXT & GOAL

You are improving the map visualization feature for **BagiPangan** (Laravel 13 + Next.js 16). A previous sprint (SCRUM-50) implemented the core map using Leaflet + `leaflet.markercluster` with a `MapController` backend. That foundation is solid but has specific gaps that need fixing before this feature is shippable.

**User story:** As a user (receiver, donor, or public visitor), I can view an interactive map of available food donations, filter by category or keyword, see my own location, and click markers to go to a donation's detail page — and the map correctly routes me based on my role.

**Git branch:** Create a NEW branch from `main`:
```bash
git checkout main
git pull origin main
git checkout -b SCRUM-63-As-a-user-I-can-view-a-map-visualization
```
Then open a **Pull Request** to `main` when done. This is a separate ticket from SCRUM-50 with new improvements.

---

## 2. WHAT ALREADY EXISTS — DO NOT REBUILD

| File | Status |
|---|---|
| `be-laravel/app/Http/Controllers/MapController.php` | ✅ EXISTS — GeoJSON endpoint with bbox/category/q/status filters + in-memory cache |
| `be-laravel/routes/api.php` — `GET /donations/map` + `GET /donations/{id}/map-detail` | ✅ EXISTS — throttled public routes |
| `fe-nextjs/components/map/DonationMap.tsx` | ✅ EXISTS — Leaflet MapContainer + `leaflet.markercluster` + tile error handling |
| `fe-nextjs/components/map/DonationMarker.tsx` | ✅ EXISTS — `createDonationIcon()` + `createDonationMarker()` with styled popup |
| `fe-nextjs/components/map/DonationMapPageContent.tsx` | ✅ EXISTS — full page with filter panel, loading overlay, error state, user location |
| `fe-nextjs/components/map/MapFilterPanel.tsx` | ✅ EXISTS — category + status + keyword filters |
| `fe-nextjs/components/map/MapLegend.tsx` | ✅ EXISTS — legend overlay |
| `fe-nextjs/components/map/UserLocationMarker.tsx` | ✅ EXISTS — blue dot at user's GPS location |
| `fe-nextjs/hooks/useDonationMap.ts` | ✅ EXISTS — SWR-like hook with 30s in-memory cache |
| `fe-nextjs/hooks/useUserGeolocation.ts` | ✅ EXISTS — GPS hook |
| `fe-nextjs/types/donation-map.ts` | ✅ EXISTS — `DonationMapFeature`, `DonationMapFilters`, `DonationMapFeatureCollection` |
| `fe-nextjs/app/receiver/map/page.tsx` | ✅ EXISTS — renders `DonationMapPageContent` |
| `fe-nextjs/app/donatur/map/page.tsx` | ✅ EXISTS — renders `DonationMapPageContent` |
| `fe-nextjs/app/admin/map/page.tsx` | ✅ EXISTS — renders `DonationMapPageContent` |
| Nav links in receiver + donatur layouts | ✅ EXISTS — both layouts already include "Peta donasi" nav items |

---

## 3. WHAT IS MISSING / NEEDS IMPROVEMENT

### 3.1 Critical Bug — Wrong `detail_url` for non-receiver contexts

**Problem:** `MapController@toFeature` hardcodes the popup link to `/receiver/donations/{id}`:
```php
'detail_url' => '/receiver/donations/' . $donation->id,
```

When a Donatur visits `/donatur/map`, every marker popup links to `/receiver/donations/{id}` — which redirects them away from the donatur layout. Same issue for the admin map.

**Fix A (Backend):** Accept an optional `context` param and return the correct path:
```php
// MapController@index — add to validated params:
'context' => ['nullable', 'in:receiver,donatur,admin,public'],

// In toFeature(), use context:
private function toFeature(Donation $donation, string $context = 'receiver'): array
{
    $detailUrl = match($context) {
        'donatur' => '/donatur/donations/' . $donation->id,
        'admin'   => '/admin/donations/' . $donation->id,
        default   => '/receiver/donations/' . $donation->id,
    };

    return [
        // ... existing fields ...
        'properties' => [
            // ... existing properties ...
            'detail_url' => $detailUrl,
        ],
    ];
}
```

Pass `context` from `index()` to `toFeature()`:
```php
$features = Cache::remember($cacheKey, 60, function () use ($status, $validated, $bbox, $limit): array {
    $context = Arr::get($validated, 'context', 'receiver');
    // ...
    return $donations->map(fn (Donation $donation) => $this->toFeature($donation, $context))->values()->all();
});
```

**Fix B (Frontend):** Pass the context as a query param from each role's map page.

Update `fe-nextjs/types/donation-map.ts`:
```typescript
export type DonationMapFilters = {
  category_id: string;
  status: DonationMapStatus;
  q: string;
  context?: "receiver" | "donatur" | "admin" | "public"; // ADD THIS
};
```

Update `fe-nextjs/hooks/useDonationMap.ts` — add `context` to the URL params:
```typescript
function buildPath(filters: DonationMapFilters): string {
  const params = new URLSearchParams();
  params.set("status", filters.status);
  params.set("limit", "500");
  if (filters.category_id) params.set("category_id", filters.category_id);
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.context) params.set("context", filters.context); // ADD THIS
  return `/donations/map?${params.toString()}`;
}
```

Create role-specific page wrappers instead of all using the same `DonationMapPageContent`:

**`fe-nextjs/app/receiver/map/page.tsx`:**
```tsx
import DonationMapPageContent from "@/components/map/DonationMapPageContent";
export default function ReceiverDonationMapPage() {
  return <DonationMapPageContent context="receiver" />;
}
```

**`fe-nextjs/app/donatur/map/page.tsx`:**
```tsx
export default function DonaturDonationMapPage() {
  return <DonationMapPageContent context="donatur" />;
}
```

**`fe-nextjs/app/admin/map/page.tsx`:**
```tsx
export default function AdminDonationMapPage() {
  return <DonationMapPageContent context="admin" />;
}
```

**Update `DonationMapPageContent.tsx`** to accept and forward the `context` prop:
```typescript
type Props = { context?: DonationMapFilters["context"] };

export default function DonationMapPageContent({ context = "receiver" }: Props) {
  // ...
  const [filters, setFilters] = useState<DonationMapFilters>(() => ({
    ...filtersFromParams(searchParams),
    context,
  }));
  // When context changes, reset filters with new context
  useEffect(() => {
    setFilters(prev => ({ ...prev, context }));
  }, [context]);
  // ...
}
```

---

### 3.2 "Fly to My Location" button

**Problem:** The `UserLocationMarker` shows a dot at the user's GPS location, but there is NO button to pan/zoom the map to that location. Users can't easily find their own position on a zoomed-out map.

**Add a FAB (floating action button)** inside `DonationMapPageContent.tsx` that flies the map to the user's location when clicked.

This requires a way to imperatively control the Leaflet map instance. Use a Zustand atom or a simple `useRef` + a custom Leaflet control.

**Recommended approach — Leaflet custom control inside `DonationMap.tsx`:**

Create a `FlyToUserLocation` component (rendered inside `MapContainer`):
```tsx
// Inside DonationMap.tsx
function FlyToUserLocationButton({ location }: { location: UserLocation | null }) {
  const map = useMap();
  if (!location) return null;

  return (
    <div
      className="leaflet-control leaflet-bar"
      style={{ position: "absolute", bottom: 100, right: 12, zIndex: 500 }}
    >
      <button
        onClick={() => map.flyTo([location.lat, location.lng], 15, { animate: true })}
        style={{
          width: 40, height: 40, background: "#fff", border: "2px solid rgba(0,0,0,0.2)",
          borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 18,
        }}
        title="Pergi ke lokasi saya"
        aria-label="Pergi ke lokasi saya"
      >
        📍
      </button>
    </div>
  );
}

// In DonationMap JSX, inside MapContainer:
<FlyToUserLocationButton location={userLocation} />
```

Or use a styled `LocateFixed` icon from lucide-react with a `divIcon` approach.

---

### 3.3 Empty state for no-coordinate donations

**Problem:** When all donations exist but none have `latitude`/`longitude` set, the map shows the Indonesia overview with no markers and a vague "Data lokasi tidak ditemukan" message. Users don't know why — they think the map is broken.

**Fix:** Distinguish between "no donations at all" and "donations exist but lack coordinates":

In `MapController@index`, add a count hint to the response:
```php
return response()->json([
    'type'     => 'FeatureCollection',
    'features' => $features,
    'meta'     => [
        'total_approved'     => Donation::where('status', 'approved')->count(),
        'without_coords'     => Donation::where('status', 'approved')
                                    ->whereNull('latitude')
                                    ->count(),
    ],
]);
```

Update `DonationMapFeatureCollection` type in `fe-nextjs/types/donation-map.ts`:
```typescript
export type DonationMapFeatureCollection = {
  type: "FeatureCollection";
  features: DonationMapFeature[];
  meta?: {
    total_approved: number;
    without_coords: number;
  };
};
```

In `DonationMapPageContent.tsx`, update the empty-state message:
```typescript
const totalApproved = data?.meta?.total_approved ?? 0;
const withoutCoords = data?.meta?.without_coords ?? 0;

const emptyMessage = features.length === 0
  ? totalApproved > 0 && withoutCoords === totalApproved
    ? `Ada ${totalApproved} donasi tersedia, namun belum ada yang memiliki koordinat lokasi. Donatur perlu mengisi koordinat saat membuat donasi.`
    : hasActiveFilter
      ? "Tidak ada donasi yang sesuai dengan filter Anda."
      : "Belum ada donasi tersedia di peta."
  : "";
```

---

### 3.4 Donation form — add coordinate picker

**Problem:** Donors currently fill in `location_address` as free text. Without coordinates, their donation never appears on the map.

**Fix:** Add a geolocation "Gunakan lokasi saya" button to the donation creation form.

**Modify:** `fe-nextjs/components/donations/DonationForm.tsx`

Read the current file. Find the location/address fields. Add below the address input:
```tsx
// Add state:
const [gettingLocation, setGettingLocation] = useState(false);

// Button:
<button
  type="button"
  onClick={() => {
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Set latitude/longitude fields in the form
        setValue("latitude", pos.coords.latitude.toFixed(7));
        setValue("longitude", pos.coords.longitude.toFixed(7));
        setGettingLocation(false);
      },
      () => setGettingLocation(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }}
  disabled={gettingLocation}
  className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-600)] hover:underline disabled:opacity-50"
>
  {gettingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
  {gettingLocation ? "Mendeteksi lokasi..." : "Gunakan lokasi saya"}
</button>
```

Check how the form manages `latitude`/`longitude` fields — they should already be in the form schema since the backend `DonationController@store` accepts them. Wire up `setValue` from `react-hook-form` or the equivalent state setter.

---

## 4. ACCEPTANCE CRITERIA

- [ ] Receiver map popup links correctly go to `/receiver/donations/{id}`
- [ ] Donatur map popup links correctly go to `/donatur/donations/{id}`
- [ ] Admin map popup links correctly go to `/admin/donations/{id}` (or a valid admin route)
- [ ] A "Pergi ke lokasi saya" button appears on the map when geolocation is active, and clicking it flies the camera to the user's position
- [ ] Empty state message distinguishes "no donations with coords" from "no donations at all"
- [ ] `DonationMapFeatureCollection.meta` is included in the backend response
- [ ] Donation creation form has a "Gunakan lokasi saya" button that fills in `latitude`/`longitude`
- [ ] `npm run build --prefix fe-nextjs` passes with no TypeScript errors (verify with MCP EXE)
- [ ] `php artisan test` passes (verify with MCP EXE)

---

## 5. DO NOT CHANGE

- The core `DonationMap.tsx` Leaflet setup (MapContainer, TileLayer, clustering)
- The `useDonationMap.ts` caching logic — only add `context` to `buildPath`
- `MapFilterPanel.tsx` — unless you are improving the mobile layout specifically
- The existing nav items in receiver/donatur layouts — they're already correct
- `be-laravel/database/migrations/2026_05_04_000050_add_map_fields_to_donations_table.php` — columns already exist

---

## 6. DESIGN NOTES

- The "fly to location" button should have `zIndex: 500` to float above the map tiles but below the sticky navbar (`z-20`)
- Use **Stocky** to fetch a nice food/map illustration for the empty state overlay when no coordinates exist — something like "community meal delivery" or "food location pin" — to make the empty state feel designed rather than broken
- Use **Magic** to generate the styled "Gunakan Lokasi Saya" FAB with proper loading state animation, matching the BagiPangan brand green color
- The `context` prop defaults to `"receiver"` in `DonationMapPageContent` so existing behavior is unchanged when no context is passed
- The `meta` fields in the backend response are cheap counts — they use DB COUNT queries, not table scans

---

## 7. FILE CHECKLIST

| File | Action |
|---|---|
| `be-laravel/app/Http/Controllers/MapController.php` | MODIFY — add `context` param to `index()` + `toFeature()`, add `meta` to response |
| `fe-nextjs/types/donation-map.ts` | MODIFY — add `context` to `DonationMapFilters`, add `meta` to `DonationMapFeatureCollection` |
| `fe-nextjs/hooks/useDonationMap.ts` | MODIFY — add `context` to `buildPath()` |
| `fe-nextjs/components/map/DonationMapPageContent.tsx` | MODIFY — accept `context` prop, better empty state message |
| `fe-nextjs/components/map/DonationMap.tsx` | MODIFY — add `FlyToUserLocationButton` component |
| `fe-nextjs/app/receiver/map/page.tsx` | MODIFY — pass `context="receiver"` |
| `fe-nextjs/app/donatur/map/page.tsx` | MODIFY — pass `context="donatur"` |
| `fe-nextjs/app/admin/map/page.tsx` | MODIFY — pass `context="admin"` |
| `fe-nextjs/components/donations/DonationForm.tsx` | MODIFY — add geolocation button |
