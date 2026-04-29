# AI Development Prompt
# Feature: As a receiver, I can view donation map visualization
# BagiPangan — Peta Visualisasi Donasi

---

## 1. CONTEXT & GOAL

You are building a feature for **BagiPangan**, a web-based food surplus distribution platform. The platform connects food donors (Donatur) with receivers (Penerima). The full donation flow is:

> **Post → Lihat → Klaim → Konfirmasi**

This feature adds an interactive **donation map** so receivers can visually see where available food donations are located, then claim directly from the map.

**User story:**
> As a Penerima (receiver), I can open a map page to see all available donations pinned on a map. Each pin shows the title, quantity, donor name, city, pickup time, and a button to go to the donation detail or claim it directly.

**Why it matters:** A text list of `pickup_address` strings is hard to scan geographically. The map lets receivers instantly see which donations are closest to them and plan pickup routes.

**Route:** `/receiver/map` — inside the existing receiver-only layout.

---

## 2. TECH STACK

| Layer | Tech |
|---|---|
| Backend | Laravel 13, PHP ^8.5, Sanctum Bearer token auth |
| Frontend | Next.js 16.2.3, React 19, TypeScript 5 |
| Styling | Tailwind CSS 4 with CSS variables (see §4) |
| Animation | Framer Motion 12 |
| Map library | **Leaflet** via `react-leaflet` (NOT yet installed — see §6) |
| Geocoding | **Nominatim** (OpenStreetMap) — free, no API key needed |
| API client | Custom `apiFetch` utility (see §3.2) |
| Auth | Bearer token stored in `localStorage`, mirrored to cookie |

---

## 3. EXISTING CODEBASE — READ THIS CAREFULLY

### 3.1 Backend — `be-laravel/routes/api.php`

```php
<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DonationController;
use App\Http\Controllers\RegisterController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [RegisterController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::middleware('receiver')->group(function () {
        Route::get('/donations', [DonationController::class, 'index']);
        Route::get('/donations/mine', [DonationController::class, 'myClaims']);
        Route::get('/donations/{donation}', [DonationController::class, 'show']);
        Route::post('/donations/{donation}/claim', [DonationController::class, 'claim']);
    });
});
```

> **Note:** The map page reuses the existing `GET /donations` endpoint. No new backend routes are needed for this feature.

---

### 3.2 Backend — `be-laravel/database/migrations/2026_04_17_100001_create_donations_table.php`

```php
Schema::create('donations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('donor_id')->constrained('users')->cascadeOnDelete();
    $table->foreignId('receiver_id')->nullable()->constrained('users')->nullOnDelete();
    $table->string('title');
    $table->text('description');
    $table->string('quantity');
    $table->string('pickup_address');    // ← plain text address, NO lat/lng columns yet
    $table->dateTime('pickup_time');
    $table->enum('status', ['available', 'claimed', 'completed', 'cancelled'])->default('available');
    $table->timestamp('claimed_at')->nullable();
    $table->timestamps();
});
```

> **Important:** The `donations` table currently has **no `latitude` or `longitude` columns**. The map feature must geocode `pickup_address` on the frontend using Nominatim (see §5 for exact strategy).

---

### 3.3 Backend — `be-laravel/app/Models/Donation.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'donor_id', 'receiver_id', 'title', 'description', 'quantity',
    'pickup_address', 'pickup_time', 'status', 'claimed_at',
])]
class Donation extends Model
{
    protected function casts(): array
    {
        return [
            'pickup_time' => 'datetime',
            'claimed_at' => 'datetime',
        ];
    }

    public function donor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'donor_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function proof(): HasOne
    {
        return $this->hasOne(Proof::class);
    }
}
```

---

### 3.4 Backend — `be-laravel/app/Http/Controllers/DonationController.php`

```php
<?php

namespace App\Http\Controllers;

use App\Models\Donation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DonationController extends Controller
{
    public function index()
    {
        $donations = Donation::with('donor:id,name,city')
            ->where('status', 'available')
            ->latest()
            ->get();

        return response()->json(['data' => $donations]);
    }

    public function show(Donation $donation)
    {
        $donation->load('donor:id,name,city,phone', 'receiver:id,name');
        return response()->json(['data' => $donation]);
    }

    public function claim(Request $request, Donation $donation)
    {
        $userId = $request->user()->id;

        $result = DB::transaction(function () use ($donation, $userId) {
            $fresh = Donation::lockForUpdate()->find($donation->id);

            if (! $fresh) return ['status' => 404];
            if ($fresh->status !== 'available') return ['status' => 409];

            $fresh->update([
                'status' => 'claimed',
                'receiver_id' => $userId,
                'claimed_at' => now(),
            ]);

            return ['status' => 200, 'donation' => $fresh->fresh(['donor:id,name,city,phone'])];
        });

        if ($result['status'] === 404) return response()->json(['message' => 'Donasi tidak ditemukan'], 404);
        if ($result['status'] === 409) return response()->json(['message' => 'Donasi sudah diklaim orang lain'], 409);

        return response()->json(['message' => 'Donasi berhasil diklaim', 'data' => $result['donation']]);
    }

    public function myClaims(Request $request)
    {
        $donations = Donation::with('donor:id,name,city,phone')
            ->where('receiver_id', $request->user()->id)
            ->latest('claimed_at')
            ->get();

        return response()->json(['data' => $donations]);
    }
}
```

---

### 3.5 Frontend — `fe-nextjs/lib/api.ts`

```typescript
export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: "donatur" | "penerima";
  city?: string | null;
  phone?: string | null;
};

const TOKEN_KEY = "bagi_token";
const USER_KEY = "bagi_user";

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUser; } catch { return null; }
}

export function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; samesite=lax`;
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(opts.headers);
  headers.set("Accept", "application/json");
  if (opts.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`/api/proxy${path.startsWith("/") ? path : `/${path}`}`, {
    ...opts,
    headers,
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : null) ?? `Request gagal (${res.status})`;
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}
```

---

### 3.6 Frontend — `fe-nextjs/lib/donations.ts`

```typescript
export type DonationStatus = "available" | "claimed" | "completed" | "cancelled";

export type DonationDonor = {
  id: number;
  name: string;
  city?: string | null;
  phone?: string | null;
};

export type Donation = {
  id: number;
  donor_id: number;
  receiver_id: number | null;
  title: string;
  description: string;
  quantity: string;
  pickup_address: string;
  pickup_time: string;
  status: DonationStatus;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
  donor?: DonationDonor;
  receiver?: { id: number; name: string } | null;
};

export function formatPickupTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      weekday: "short", day: "numeric", month: "short",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

export const STATUS_LABEL: Record<DonationStatus, string> = {
  available: "Tersedia",
  claimed: "Diklaim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const STATUS_TONE: Record<DonationStatus, string> = {
  available: "bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-100)]",
  claimed: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};
```

---

### 3.7 Frontend — `fe-nextjs/app/receiver/layout.tsx` (FULL FILE)

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, Package, ListChecks } from "lucide-react";
import { apiFetch, clearAuth, getUser, type AuthUser } from "@/lib/api";

export default function ReceiverLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace("/login"); return; }
    if (u.role !== "penerima") { router.replace("/"); return; }
    setUser(u);
  }, [router]);

  const handleLogout = async () => {
    try { await apiFetch("/logout", { method: "POST" }); } catch {}
    clearAuth();
    router.replace("/login");
  };

  if (!user) return null;

  const navItems = [
    { href: "/receiver/dashboard", label: "Donasi tersedia", icon: Package },
    { href: "/receiver/my-claims", label: "Klaim saya", icon: ListChecks },
    // ← YOU WILL ADD: { href: "/receiver/map", label: "Peta donasi", icon: Map }
  ];

  return (
    <div className="bagi-theme min-h-screen bg-[var(--cream)]">
      <header className="bg-white border-b border-[var(--brand-100)] sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/receiver/dashboard" className="flex items-center gap-2">
            <span className="bg-[var(--brand-600)] text-white font-bold rounded-xl px-2.5 py-1 text-sm">BP</span>
            <span className="font-bold text-[var(--brand-950)]">Bagi Pangan</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    active
                      ? "bg-[var(--brand-50)] text-[var(--brand-700)]"
                      : "text-[var(--text-mid)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-[var(--brand-950)]">{user.name}</div>
              <div className="text-xs text-[var(--text-mid)]">Penerima</div>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-[var(--brand-700)] border border-[var(--brand-100)] hover:bg-[var(--brand-50)]"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        <nav className="md:hidden flex items-center gap-1 px-4 pb-3 overflow-x-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${
                  active ? "bg-[var(--brand-50)] text-[var(--brand-700)]" : "text-[var(--text-mid)]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
```

---

### 3.8 Frontend — CSS Variables (Tailwind 4 design tokens)

The project uses **CSS variables** — never use Tailwind arbitrary values for brand colors. Common tokens:

```
--brand-50      very light green background
--brand-100     light green border
--brand-200     medium light border
--brand-300     medium border (hover)
--brand-400     medium (focus ring)
--brand-600     primary brand green (buttons, links)
--brand-700     darker green (hover, active nav)
--brand-800     even darker
--brand-950     near-black text
--text-mid      secondary text gray
--cream         page background
--shadow-card   card box-shadow
--shadow-soft   elevated card shadow
```

Always use: `bg-[var(--brand-600)]`, `text-[var(--brand-950)]`, `border-[var(--brand-100)]`, etc.

---

### 3.9 Frontend — Framer Motion patterns

All components use Framer Motion 12. Standard patterns in this project:

```tsx
const EASE_OUT_QUART: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Fade-in entry
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.55, ease: EASE_OUT_QUART }}
>

// AnimatePresence for conditional rendering
<AnimatePresence>
  {condition && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
    >
  )}
</AnimatePresence>

// Tap scale
<motion.button whileTap={{ scale: 0.95 }}>
```

---

## 4. WHAT TO BUILD

### 4.1 Install dependencies

```bash
npm install react-leaflet leaflet
npm install --save-dev @types/leaflet
```

---

### 4.2 New file: `fe-nextjs/app/receiver/map/page.tsx`

This is the only new file needed. It is a **`"use client"` page** that:

1. Fetches `GET /donations` on mount using `apiFetch`
2. Geocodes each `pickup_address` using Nominatim (see §4.4)
3. Renders an interactive Leaflet map with one marker per donation
4. Each marker popup shows: title, quantity, donor name + city, pickup time, and a "Lihat detail" link
5. Has loading, error, and empty states

**Critical Next.js + Leaflet requirement:** The `MapContainer` from `react-leaflet` uses browser APIs and cannot render on the server. You **must** wrap it in `dynamic()` with `ssr: false`. Structure the page as two components:

```tsx
// At the top of the file, after imports:
import dynamic from "next/dynamic";

const DonationMap = dynamic(() => import("./DonationMap"), { ssr: false });

export default function MapPage() {
  // ... fetch logic, loading/error states
  return <DonationMap donations={geocodedDonations} />;
}
```

But since this is a single-file solution, create everything in `page.tsx` itself — export the page as default and define the inner map component in the same file, importing it dynamically. See §4.6 for the exact pattern.

---

### 4.3 Fix Leaflet default marker icons

Leaflet's default icon images break in Next.js because webpack mangles the URLs. Fix this once at the top of your client map component:

```tsx
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// Fix broken default icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: iconUrl.src,
  iconRetinaUrl: iconRetinaUrl.src,
  shadowUrl: shadowUrl.src,
});
```

> **Alternative (simpler):** Use a custom `divIcon` instead of the default marker. This avoids the image issue entirely and lets you style with Tailwind. Recommended — see §4.5.

---

### 4.4 Geocoding strategy with Nominatim

The `donations` table has `pickup_address` (plain text) but no `latitude`/`longitude` columns. You must geocode on the frontend.

**API endpoint:** `https://nominatim.openstreetmap.org/search`

**Rate limit:** 1 request per second (Nominatim ToS). Respect this with a delay between requests.

**Required `User-Agent` header:** Nominatim requires a descriptive `User-Agent`.

**Exact geocoding function to implement:**

```typescript
type GeoResult = { lat: number; lng: number } | null;

async function geocodeAddress(address: string): Promise<GeoResult> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", address);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "id"); // Indonesia only — improves accuracy

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "BagiPangan/1.0 (food-surplus-app)",
        "Accept-Language": "id",
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;

    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}
```

**Batch geocoding with rate limiting:**

```typescript
async function geocodeAll(donations: Donation[]): Promise<Map<number, GeoResult>> {
  const results = new Map<number, GeoResult>();
  for (const donation of donations) {
    const geo = await geocodeAddress(donation.pickup_address);
    results.set(donation.id, geo);
    await new Promise((r) => setTimeout(r, 1100)); // 1.1s delay — respects 1 req/s limit
  }
  return results;
}
```

**Geocoding state flow:**

```typescript
type GeocodingState = "idle" | "geocoding" | "done";

const [geocodingState, setGeocodingState] = useState<GeocodingState>("idle");
const [geoMap, setGeoMap] = useState<Map<number, GeoResult>>(new Map());

// After donations load:
useEffect(() => {
  if (!donations || donations.length === 0) return;
  setGeocodingState("geocoding");
  geocodeAll(donations).then((map) => {
    setGeoMap(map);
    setGeocodingState("done");
  });
}, [donations]);
```

Show a progress indicator while geocoding: e.g., `"Menemukan lokasi (3/8)..."` — use a progress counter updated inside the loop.

---

### 4.5 Custom marker with `divIcon` (recommended over default icon)

Use a custom `divIcon` styled with brand colors to avoid the default icon image issue and for a nicer look:

```typescript
function createDonationIcon(isUrgent: boolean): L.DivIcon {
  const color = isUrgent ? "#ef4444" : "var(--brand-600, #2d7a4f)";
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 32px; height: 32px;
        background: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      "></div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });
}
```

---

### 4.6 Full page structure (single-file pattern)

Structure `page.tsx` like this:

```tsx
"use client";

// 1. React + Next.js imports
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

// 2. Framer Motion
import { motion, AnimatePresence } from "framer-motion";

// 3. Lucide icons
import { MapPin, Clock, Package, Loader2 } from "lucide-react";

// 4. Project libs
import { ApiError, apiFetch } from "@/lib/api";
import { type Donation, formatPickupTime } from "@/lib/donations";

// 5. Types
type GeoResult = { lat: number; lng: number } | null;
type GeocodingState = "idle" | "geocoding" | "done";

// 6. Geocoding helpers (geocodeAddress, geocodeAll) — defined here

// 7. The actual Leaflet map component — imported dynamically below
//    Define it in THIS same file but reference via dynamic()

// ──────────────────────────────────────────────────────────────
// LeafletMap — the actual map component (client-only)
// This component is what gets wrapped in dynamic()
// ──────────────────────────────────────────────────────────────
function LeafletMapInner({ ... }: LeafletMapProps) {
  // Import Leaflet and react-leaflet INSIDE this component to avoid SSR issues:
  // Actually — since the entire module is loaded via dynamic({ssr:false}),
  // top-level imports of react-leaflet ARE safe inside this file.
  // Just make sure this component is only referenced via the dynamic() import.
}

// 8. Dynamic import — wraps LeafletMapInner to disable SSR
const LeafletMap = dynamic(
  () => Promise.resolve(LeafletMapInner),
  { ssr: false, loading: () => <MapSkeleton /> }
);

// 9. Default export — the page
export default function DonationMapPage() {
  // fetch + geocode logic
  // returns layout with LeafletMap
}
```

> **Note on the dynamic import pattern:** When the component being wrapped is defined in the same file, use `Promise.resolve(ComponentFn)` as shown above. Alternatively, split `LeafletMapInner` into a separate file `./LeafletMap.tsx` and use `dynamic(() => import("./LeafletMap"), { ssr: false })` — either approach is correct. The separate-file approach is cleaner if the component is large.

---

### 4.7 Leaflet map configuration

```tsx
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Map center — default to Indonesia (Jakarta area)
const DEFAULT_CENTER: [number, number] = [-6.2088, 106.8456];
const DEFAULT_ZOOM = 12;

<MapContainer
  center={DEFAULT_CENTER}
  zoom={DEFAULT_ZOOM}
  style={{ height: "600px", width: "100%" }}
  className="rounded-3xl z-0"   // match project border-radius; z-0 keeps it below sticky header
>
  <TileLayer
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />

  {donations.map((donation) => {
    const geo = geoMap.get(donation.id);
    if (!geo) return null;
    return (
      <Marker
        key={donation.id}
        position={[geo.lat, geo.lng]}
        icon={createDonationIcon(isUrgent(donation))}
      >
        <Popup>
          <DonationPopup donation={donation} />
        </Popup>
      </Marker>
    );
  })}
</MapContainer>
```

**Map container height:** On mobile, use `h-[calc(100vh-180px)]`; on desktop, `h-[600px]` or `h-[70vh]`.

---

### 4.8 Marker popup content

The `DonationPopup` component renders inside a Leaflet `<Popup>`. Keep it compact. It must show:

- **Title** — `donation.title` (bold)
- **Quantity** — `donation.quantity` with a Package icon
- **Donor** — `donation.donor?.name` + city if available
- **Pickup time** — `formatPickupTime(donation.pickup_time)`
- **"Lihat detail"** — `<Link href={/receiver/donations/${donation.id}}>` button

> **Note:** Leaflet popups render inside an iframe-like context. Use inline styles for popup-specific styling rather than relying on Tailwind classes. CSS variables from the host page may not apply inside popups.

Example popup structure using minimal inline styles:

```tsx
function DonationPopup({ donation }: { donation: Donation }) {
  return (
    <div style={{ minWidth: 200, maxWidth: 240, fontFamily: "inherit" }}>
      <p style={{ fontWeight: 700, fontSize: 14, margin: "0 0 4px" }}>{donation.title}</p>
      <p style={{ fontSize: 12, color: "#555", margin: "0 0 2px" }}>
        📦 {donation.quantity}
      </p>
      <p style={{ fontSize: 12, color: "#555", margin: "0 0 2px" }}>
        👤 {donation.donor?.name ?? "Donatur"}{donation.donor?.city ? ` · ${donation.donor.city}` : ""}
      </p>
      <p style={{ fontSize: 12, color: "#555", margin: "0 0 10px" }}>
        🕐 {formatPickupTime(donation.pickup_time)}
      </p>
      <a
        href={`/receiver/donations/${donation.id}`}
        style={{
          display: "block",
          background: "#2d7a4f",
          color: "white",
          padding: "6px 12px",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          textAlign: "center",
          textDecoration: "none",
        }}
      >
        Lihat detail →
      </a>
    </div>
  );
}
```

---

### 4.9 Page layout

The full `DonationMapPage` component structure:

```
<div>
  <!-- Page header -->
  <motion.div initial/animate fade-in>
    <h1>Peta Donasi</h1>
    <p>subtitle text</p>
  </motion.div>

  <!-- Geocoding progress bar (shows while geocodingState === "geocoding") -->
  <AnimatePresence>
    {geocodingState === "geocoding" && (
      <motion.div ...>
        <Loader2 className="animate-spin" />
        Menemukan lokasi ({geocodedCount}/{total})...
      </motion.div>
    )}
  </AnimatePresence>

  <!-- Error state -->
  {error && <ErrorBanner message={error} />}

  <!-- Loading skeleton (donations not yet fetched) -->
  {donations === null && <MapSkeleton />}

  <!-- Empty state (no available donations) -->
  {donations?.length === 0 && <EmptyState />}

  <!-- Map -->
  {donations && donations.length > 0 && geocodingState !== "idle" && (
    <div className="rounded-3xl overflow-hidden border border-[var(--brand-100)] shadow-[var(--shadow-card)]">
      <LeafletMap
        donations={donations}
        geoMap={geoMap}
        geocodingState={geocodingState}
      />
    </div>
  )}

  <!-- Legend / hint text below map -->
  {geocodingState === "done" && (
    <p className="text-xs text-[var(--text-mid)] text-center mt-3">
      Klik penanda untuk melihat detail donasi
    </p>
  )}
</div>
```

---

### 4.10 Modify: `fe-nextjs/app/receiver/layout.tsx`

Add "Peta donasi" as the third nav item. Import `Map` from `lucide-react`:

```tsx
import { LogOut, Package, ListChecks, Map } from "lucide-react";

const navItems = [
  { href: "/receiver/dashboard", label: "Donasi tersedia", icon: Package },
  { href: "/receiver/my-claims", label: "Klaim saya", icon: ListChecks },
  { href: "/receiver/map", label: "Peta donasi", icon: Map },   // ← ADD THIS
];
```

No other changes to `layout.tsx`.

---

### 4.11 Loading skeleton (`MapSkeleton`)

```tsx
function MapSkeleton() {
  return (
    <div
      className="rounded-3xl border border-[var(--brand-100)] bg-[var(--brand-50)] animate-pulse"
      style={{ height: 500 }}
    />
  );
}
```

---

### 4.12 Urgency helper

Reuse the urgency logic from the dashboard for red markers:

```typescript
const URGENT_HOURS = 6;

function isUrgent(donation: Donation): boolean {
  const h = (Date.parse(donation.pickup_time) - Date.now()) / 3_600_000;
  return h >= 0 && h < URGENT_HOURS;
}
```

---

## 5. GEOCODING EDGE CASES

| Situation | Handling |
|---|---|
| Nominatim returns no results for an address | `geocodeAddress` returns `null`; skip marker for that donation (don't crash) |
| Nominatim rate limit hit (429) | `geocodeAddress` returns `null` for that item; the 1.1s delay should prevent this |
| Fetch network error | `geocodeAddress` catches and returns `null` |
| All donations fail to geocode | Show a warning banner: "Tidak dapat menemukan lokasi untuk donasi yang tersedia" |
| `donations` is an empty array | Skip geocoding entirely, show empty state immediately |
| Component unmounts while geocoding | Use a ref `cancelled = true` inside `geocodeAll` to stop processing |

**Cancellation pattern:**

```typescript
useEffect(() => {
  if (!donations || donations.length === 0) return;
  let cancelled = false;
  setGeocodingState("geocoding");
  setGeocodedCount(0);

  (async () => {
    const results = new Map<number, GeoResult>();
    for (const donation of donations) {
      if (cancelled) break;
      const geo = await geocodeAddress(donation.pickup_address);
      results.set(donation.id, geo);
      if (!cancelled) setGeocodedCount((c) => c + 1);
      await new Promise((r) => setTimeout(r, 1100));
    }
    if (!cancelled) {
      setGeoMap(results);
      setGeocodingState("done");
    }
  })();

  return () => { cancelled = true; };
}, [donations]);
```

---

## 6. ACCEPTANCE CRITERIA

- [ ] `npm install react-leaflet leaflet @types/leaflet` runs without error
- [ ] `/receiver/map` is accessible only to authenticated users with role `penerima` (enforced by existing `ReceiverLayout`)
- [ ] "Peta donasi" nav item appears in both desktop and mobile navbars
- [ ] Page fetches `GET /donations` and shows all available donations as map markers
- [ ] While geocoding, a progress indicator shows `(n/total)` count
- [ ] Each marker popup shows: title, quantity, donor name + city, pickup time, "Lihat detail" link
- [ ] Clicking "Lihat detail" in a popup navigates to `/receiver/donations/:id`
- [ ] Donations whose address cannot be geocoded are silently skipped (no crash)
- [ ] Urgent donations (pickup within 6 hours) show a red marker; others show brand-green
- [ ] Loading skeleton shown while `donations === null` (initial fetch)
- [ ] Empty state shown when no available donations exist
- [ ] Map does not render on the server (no SSR crash)
- [ ] `z-index` of map (`z-0`) does not overlap the sticky header (`z-20`)
- [ ] Navigating away from the page cancels any in-progress geocoding loop

---

## 7. FILE CHECKLIST

| File | Action |
|---|---|
| `fe-nextjs/app/receiver/map/page.tsx` | **CREATE** — new map page |
| `fe-nextjs/app/receiver/layout.tsx` | **MODIFY** — add Map nav item |
| `fe-nextjs/package.json` | **MODIFY** — `react-leaflet`, `leaflet`, `@types/leaflet` added after install |

**No backend changes required.** The existing `GET /donations` endpoint returns everything the map needs.

---

## 8. DO NOT CHANGE

- `be-laravel/routes/api.php` — no new routes needed
- `be-laravel/app/Http/Controllers/DonationController.php` — no changes
- `be-laravel/app/Models/Donation.php` — no changes
- `fe-nextjs/lib/api.ts` — do not modify `apiFetch`
- `fe-nextjs/lib/donations.ts` — do not modify unless adding a `DonationProof` type for an unrelated feature
- `fe-nextjs/app/receiver/dashboard/page.tsx` — do not touch
- `fe-nextjs/app/receiver/my-claims/page.tsx` — do not touch
- `fe-nextjs/app/receiver/donations/[id]/page.tsx` — do not touch

---

## 9. NOTES & GOTCHAS

### Leaflet + Next.js App Router
Leaflet reads `window`, `document`, and `navigator` at module load time. In Next.js App Router, every `page.tsx` is treated as a Server Component by default. Even with `"use client"`, the module is pre-evaluated on the server during SSR. **Always use `dynamic(() => import(...), { ssr: false })` for any component that imports from `react-leaflet` or `leaflet`.**

### Leaflet CSS z-index conflicts
Leaflet sets high `z-index` values on its control layer (zoom buttons, attribution) and tile layer. The sticky header in `ReceiverLayout` uses `z-20`. Wrap the `MapContainer` in a container with `relative z-0` to establish a new stacking context so Leaflet's internals don't bleed above the header.

```tsx
<div className="relative z-0 rounded-3xl overflow-hidden">
  <MapContainer ... />
</div>
```

### Nominatim accuracy for Indonesian addresses
Nominatim handles Indonesian addresses reasonably well when `countrycodes=id` is set. Addresses like `"Jl. Sudirman No. 5, Jakarta Selatan"` will geocode correctly. Very short or vague addresses (e.g., `"dekat masjid"`) will return null — handle gracefully.

### react-leaflet version compatibility
Install `react-leaflet` v4 (latest as of mid-2025) which supports React 18+. It is compatible with React 19. If you encounter peer dependency warnings, add `--legacy-peer-deps` to the install command.

### `Map` icon name conflict
`lucide-react` exports a `Map` icon. Make sure the import doesn't conflict with JavaScript's built-in `Map` type. Rename the import to avoid confusion:

```tsx
import { Map as MapIcon } from "lucide-react";
// Then in navItems:
{ href: "/receiver/map", label: "Peta donasi", icon: MapIcon }
```

### Geocoding on every page mount
The geocoding loop runs every time the user navigates to `/receiver/map`. For an MVP this is acceptable. For production, consider caching geocoded coordinates in the backend (add `latitude`/`longitude` columns to `donations`) and populating them on donation creation.
