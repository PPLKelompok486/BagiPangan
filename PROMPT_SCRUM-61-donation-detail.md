# AI Development Prompt
# SCRUM 61 — As a user, I can view the donation detail
# BagiPangan — Halaman Detail Donasi

---

## TOOLS TO USE

This task should be implemented using:
- **MCP EXE** — run shell commands (`npm run lint`, `php artisan test`, `php artisan route:list`) to verify work
- **Stocky** — use the Stocky MCP to fetch donation-related food imagery via Pexels/Unsplash if thumbnail support is added
- **Magic** — use Magic for generating polished UI components (info rows, status badge, countdown timer, proof upload section)

---

## 1. CONTEXT & GOAL

You are improving a feature for **BagiPangan**, a web-based food surplus distribution platform (Laravel 13 backend + Next.js 16 frontend). The platform connects donors (Donatur) with receivers (Penerima).

**User story:** As a user (Penerima or Donatur), I can open a donation card and see the full donation detail — including title, description, status, category, location, pickup window, donor info, and a claim or upload-proof action.

The feature is **partially implemented**. The goal of this prompt is to **complete and improve** it by filling in the gaps described below.

**Git branch:** Push directly to the existing branch `SCRUM-61-As-a-user-I-can-view-the-donation-detail`.  
No PR needed yet — continue building on what's already there.

---

## 2. WHAT ALREADY EXISTS — DO NOT REBUILD

| File | Status |
|---|---|
| `be-laravel/app/Http/Controllers/DonationController.php` — `show($id)` | ✅ EXISTS — returns `donation` with `user` and `category` relationships |
| `be-laravel/routes/api.php` — `GET /donations/{id}` | ✅ EXISTS — public route, no auth required |
| `fe-nextjs/app/receiver/donations/[id]/page.tsx` | ✅ EXISTS — full detail page with claim/upload-proof/cancel-claim actions |
| `fe-nextjs/lib/donations.ts` — `mapApiDonation()`, `ApiDonation`, `Donation` types | ✅ EXISTS |
| `fe-nextjs/lib/api.ts` — `apiFetch()` | ✅ EXISTS |

**Receiver flow already works:** Penerima can view detail, confirm claim, upload proof, and cancel claim.

---

## 3. WHAT IS MISSING / NEEDS IMPROVEMENT

### 3.1 Backend — `DonationController@show`

Current implementation:
```php
public function show($id)
{
    $donation = Donation::with(['user', 'category'])->find($id);
    if (!$donation) {
        return response()->json(['message' => 'Donasi tidak ditemukan'], 404);
    }
    return response()->json(['data' => $donation]);
}
```

**Problems:**
1. `with(['user'])` returns ALL user fields including email and sensitive profile data. Restrict to only: `id`, `name`, `city`, `phone`.
2. No `address_detail` or computed `full_address` in the response — the frontend falls back to `location_address` only.
3. The response doesn't distinguish if the requesting user has already claimed this donation (a second API call to `/claims/mine` is required on the frontend).

**Fix:**
```php
public function show($id)
{
    $donation = Donation::with([
        'user:id,name,city,phone',
        'category:id,name',
    ])->find($id);

    if (!$donation) {
        return response()->json(['message' => 'Donasi tidak ditemukan'], 404);
    }

    // Optionally attach current user's claim if authenticated
    $currentClaim = null;
    if (auth('sanctum')->check()) {
        $currentClaim = \App\Models\Claim::where('donation_id', $donation->id)
            ->where('receiver_id', auth('sanctum')->id())
            ->whereIn('status', ['requested', 'approved', 'completed'])
            ->select(['id', 'status', 'proof_image_url', 'claimed_at', 'completed_at'])
            ->first();
    }

    return response()->json([
        'data' => $donation,
        'my_claim' => $currentClaim,
    ]);
}
```

> Note: the `token.auth` middleware uses a custom token (not Sanctum). Check `app/Http/Middleware/TokenAuth.php` — for the optional claim lookup, use `Auth::id()` instead of `auth('sanctum')->id()` if the route doesn't require auth.

---

### 3.2 Frontend — `lib/donations.ts`

**Problem:** The `ApiDonation` type and `mapApiDonation()` function are missing several fields that the backend already returns:
- `address_detail` — a more specific address string
- `latitude` / `longitude` — allows linking to the map page

**Add to `ApiDonation` type:**
```typescript
export type ApiDonation = {
  // ... existing fields ...
  address_detail?: string | null;
  latitude?: string | null;
  longitude?: string | null;
};
```

**Add to `Donation` type:**
```typescript
export type Donation = {
  // ... existing fields ...
  address_detail?: string | null;
  has_coordinates: boolean;
};
```

**Update `mapApiDonation()`:**
```typescript
export function mapApiDonation(donation: ApiDonation): Donation {
  return {
    // ... existing mapping ...
    pickup_address: resolvePickupAddress(donation),
    address_detail: donation.address_detail ?? null,
    has_coordinates: Boolean(donation.latitude && donation.longitude),
  };
}
```

---

### 3.3 Frontend — `app/receiver/donations/[id]/page.tsx`

**Problem 1 — Category badge missing.** The detail page shows donor name, pickup time, location, quantity — but NOT the donation category. Add it.

**In the info grid section, add:**
```tsx
{donation.category && (
  <InfoRow
    icon={<Tag className="h-4 w-4" />}
    label="Kategori"
    value={donation.category.name}
  />
)}
```
Import `Tag` from `lucide-react`.

**Problem 2 — No "Lihat di Peta" link.** If the donation has coordinates, show a link to `/receiver/map` that deep-links to that donation.

```tsx
{donation.has_coordinates && (
  <Link
    href={`/receiver/map?q=${encodeURIComponent(donation.title)}`}
    className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-600)] hover:underline mt-2"
  >
    <MapPin className="h-4 w-4" />
    Lihat di peta
  </Link>
)}
```

**Problem 3 — `available_from` is not shown.** The detail page only shows `available_until` as "waktu jemput". Show both the start and end of the pickup window.

Replace the single pickup time row with:
```tsx
<InfoRow
  icon={<Clock className="h-4 w-4" />}
  label="Jendela jemput"
  value={`${formatPickupTime(donation.available_from)} – ${formatPickupTime(donation.pickup_time)}`}
/>
```
Where `donation.available_from` maps to `ApiDonation.available_from`.

**Problem 4 — No `my_claim` optimization.** The page currently makes two API calls on load (`/donations/${id}` + `/claims/mine`). If the backend now returns `my_claim` in the show response, use it to skip the second call:

```typescript
const load = async () => {
  const res = await apiFetch<{ data: ApiDonation; my_claim?: ApiClaim | null }>(`/donations/${id}`);
  setDonation(mapApiDonation(res.data));
  if (res.my_claim !== undefined) {
    setClaim(res.my_claim ? mapApiClaim(res.my_claim) : null);
  } else {
    await loadClaim(); // fallback: fetch separately
  }
};
```

---

### 3.4 Frontend — Donatur's donation detail view

**Problem:** Donatur can see their donation list at `/donatur/donations` but there is NO detail view. Clicking a card shows nothing. Add a detail route for donors.

**Create:** `fe-nextjs/app/donatur/donations/[id]/page.tsx`

This is a donor-only view. It should show:
- The full donation data (same `GET /donations/{id}` endpoint)
- Status badge and status history context (e.g. "Menunggu verifikasi admin")
- Claim info: if someone has claimed it, show a masked "Ada 1 penerima mengklaim" message (no personal info)
- Edit button → links to a future edit page
- Cancel button → calls `DELETE /donations/{id}` (already exists in backend as `cancel()`)

Protect the page: redirect to `/donatur/dashboard` if `donation.user_id !== currentUser.id`.

**Minimal implementation:**
```tsx
// app/donatur/donations/[id]/page.tsx
"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ApiError, apiFetch, getUser } from "@/lib/api";
import { type ApiDonation, mapApiDonation, STATUS_LABEL, STATUS_TONE } from "@/lib/donations";

export default function DonorDonationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // fetch, render title/description/status/category/location/portion/dates
  // show Edit and Cancel buttons if status is pending/approved
}
```

---

## 4. ACCEPTANCE CRITERIA

- [ ] `GET /donations/{id}` returns `user` with only `id, name, city, phone`
- [ ] `GET /donations/{id}` optionally returns `my_claim` if the authenticated user has a claim
- [ ] `ApiDonation` type includes `address_detail`, `latitude`, `longitude`
- [ ] Receiver detail page shows the donation category
- [ ] Receiver detail page shows both `available_from` and `available_until`
- [ ] Receiver detail page shows "Lihat di peta" link when coordinates exist
- [ ] Receiver detail page uses `my_claim` from the show response when available (avoids double fetch)
- [ ] Donatur can navigate to `/donatur/donations/{id}` and see their donation's full detail and status
- [ ] `npm run lint --prefix fe-nextjs` passes with no new errors (use MCP EXE to verify)
- [ ] `cd be-laravel && php artisan test` continues to pass

---

## 5. DO NOT CHANGE

- `fe-nextjs/lib/api.ts` — do not modify `apiFetch`
- `fe-nextjs/app/receiver/dashboard/page.tsx` — do not touch
- `fe-nextjs/app/receiver/my-claims/page.tsx` — do not touch
- `be-laravel/app/Models/Donation.php` — do not add new columns
- `be-laravel/routes/api.php` — do not change the route path, only the controller logic

---

## 6. DESIGN NOTES

- Use CSS variables, not hardcoded colors: `text-[var(--brand-600)]`, `border-[var(--brand-100)]`
- Use Framer Motion entry animations: `initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}`
- For food imagery in the donatur detail view, use **Stocky** to search Pexels for a relevant image based on `donation.title` keywords if `thumbnail_url` is null
- Match the existing `InfoRow` component pattern from the receiver detail page

---

## 7. FILE CHECKLIST

| File | Action |
|---|---|
| `be-laravel/app/Http/Controllers/DonationController.php` | MODIFY — `show()` method only |
| `fe-nextjs/lib/donations.ts` | MODIFY — add fields to `ApiDonation`, `Donation`, and `mapApiDonation` |
| `fe-nextjs/app/receiver/donations/[id]/page.tsx` | MODIFY — category badge, pickup window, map link, `my_claim` optimization |
| `fe-nextjs/app/donatur/donations/[id]/page.tsx` | CREATE — new donor detail page |
