# AI Development Prompt
# Feature: As a receiver, I can upload proof of pickup
# FR-11 — Unggah Bukti Pengambilan · BagiPangan

---

## 1. CONTEXT & GOAL

You are building a feature for **BagiPangan**, a web-based food surplus distribution platform. The platform connects food donors (Donatur) with receivers (Penerima). The full donation flow is:

> **Post → Lihat → Klaim → Konfirmasi**

After a receiver physically picks up food (offline), they must upload a photo as proof. This is **FR-11 — Unggah Bukti Pengambilan**.

**User story:**
> As a Penerima (receiver), after I have physically collected my claimed donation, I can upload a photo as confirmation of pickup. The system saves the proof linked to my claim and marks the donation as completed.

**Why it matters:** Without a photo proof, the system has no way to close the loop and confirm that food was actually distributed. The proof is how the donation status transitions from `claimed` → `completed`.

---

## 2. TECH STACK

| Layer | Technology |
|---|---|
| Backend | Laravel 13, PHP ^8.5 |
| Auth | Laravel Sanctum (Bearer token) |
| Database | SQLite (local dev) — schema must also work with Supabase PostgreSQL |
| File Storage | Use Laravel's local disk for now (`storage/app/public/proofs/`); Supabase JS client is already installed on the frontend for future migration |
| Frontend | Next.js 16.2.3, React 19, TypeScript 5 |
| Styling | Tailwind CSS 4 (CSS variables `var(--brand-*)`, no arbitrary values unless needed) |
| Animation | Framer Motion 12 |
| Icons | Lucide React |

---

## 3. EXISTING CODEBASE — WHAT'S ALREADY THERE

### 3.1 Backend file tree (relevant parts)

```
be-laravel/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php        ← login/logout
│   │   │   ├── DonationController.php    ← index, show, claim, myClaims
│   │   │   └── RegisterController.php
│   │   └── Middleware/
│   │       └── EnsureReceiver.php        ← enforces role === 'penerima'
│   ├── Models/
│   │   ├── Donation.php                  ← existing model
│   │   └── User.php
│   └── Services/
│       └── RegisterService.php
├── database/
│   └── migrations/
│       ├── 0001_01_01_000000_create_users_table.php
│       ├── 2026_04_14_000001_add_role_to_users_table.php
│       ├── 2026_04_14_000002_add_profile_fields_to_users_table.php
│       └── 2026_04_17_100001_create_donations_table.php
└── routes/
    └── api.php
```

### 3.2 Existing Donation model (`app/Models/Donation.php`)

```php
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
}
```

Donation statuses: `available | claimed | completed | cancelled`

### 3.3 Existing DonationController (`app/Http/Controllers/DonationController.php`)

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

### 3.4 Existing API routes (`routes/api.php`)

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

### 3.5 Frontend file tree (relevant parts)

```
fe-nextjs/
├── app/
│   ├── api/proxy/[...path]/route.ts   ← reverse proxy — forwards all /api/proxy/* to Laravel
│   └── receiver/
│       ├── dashboard/page.tsx
│       ├── donations/[id]/page.tsx
│       ├── my-claims/page.tsx          ← MAIN FILE TO EDIT
│       └── layout.tsx
└── lib/
    ├── api.ts                          ← apiFetch utility
    └── donations.ts                    ← Donation type + helpers
```

### 3.6 Frontend API utility (`lib/api.ts`) — critical patterns

```typescript
export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data: unknown) { ... }
}

export function getToken(): string | null { ... }

// Main fetch helper — automatically adds Bearer token + Accept: application/json
// IMPORTANT: if opts.body exists and no Content-Type header, sets Content-Type: application/json
// For FormData uploads, do NOT set Content-Type — let the browser set it with boundary
export async function apiFetch<T = unknown>(path: string, opts: RequestInit = {}): Promise<T>
// Calls /api/proxy{path} internally
```

### 3.7 Donation TypeScript types (`lib/donations.ts`)

```typescript
export type DonationStatus = "available" | "claimed" | "completed" | "cancelled";

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
  donor?: { id: number; name: string; city?: string | null; phone?: string | null };
  receiver?: { id: number; name: string } | null;
  // proof field does NOT exist yet — you must add it
};
```

---

## 4. WHAT YOU MUST BUILD

### 4.1 Backend — Database Migration

Create a new migration: `create_proofs_table`

```
Table name: proofs
Columns:
  - id                 bigIncrements (PK)
  - donation_id        unsignedBigInteger, FK → donations.id, onDelete cascade
  - receiver_id        unsignedBigInteger, FK → users.id, onDelete cascade
  - image_path         string  — relative path on disk (e.g., proofs/uuid.jpg)
  - image_url          string  — publicly accessible URL
  - uploaded_at        timestamp (nullable, set on creation)
  - timestamps()       (created_at, updated_at)
  - unique constraint on donation_id (one proof per donation)
```

### 4.2 Backend — Proof Model

Create `app/Models/Proof.php`:
- Use `#[Fillable([...])]` attribute style (matches existing codebase pattern)
- Cast `uploaded_at` to datetime
- `belongsTo` Donation
- `belongsTo` User (as receiver)

### 4.3 Backend — Update Donation Model

Add to `app/Models/Donation.php`:
```php
public function proof(): HasOne
{
    return $this->hasOne(Proof::class);
}
```

### 4.4 Backend — ProofController

Create `app/Http/Controllers/ProofController.php` with a single `store(Request $request, Donation $donation)` method.

**Validation rules (all must pass):**
1. The authenticated user must be the receiver of this donation (`donation->receiver_id === auth user id`) → 403
2. The donation status must be `claimed` (not already `completed` or other) → 422 with `message: 'Bukti sudah diunggah atau donasi belum diklaim'`
3. The donation must not already have a proof → 422 same message
4. Request must include `image` file field: required, file, mimes: jpg,jpeg,png,webp, max: 5120 (5MB)

**On success:**
1. Store the image to `storage/app/public/proofs/` using a UUID-based filename to avoid collisions
2. Generate the public URL using `asset(Storage::url($path))` or `url(Storage::url($path))`
3. Create the Proof record in the database
4. Update the donation status to `completed` (use `$donation->update(['status' => 'completed'])`)
5. Return `201` with `message: 'Bukti berhasil diunggah'` and `data: { proof, donation }`

**Error responses follow the same JSON pattern:**
```json
{ "message": "..." }
```

**Important — storage symlink:** Make sure `php artisan storage:link` is noted as a required setup step. The controller uses `Storage::disk('public')`.

### 4.5 Backend — Update DonationController

Update `myClaims()` to eager-load proof:
```php
$donations = Donation::with('donor:id,name,city,phone', 'proof')
    ->where('receiver_id', $request->user()->id)
    ->latest('claimed_at')
    ->get();
```

Update `show()` to also load proof:
```php
$donation->load('donor:id,name,city,phone', 'receiver:id,name', 'proof');
```

### 4.6 Backend — Register New Route

Add inside the existing `receiver` middleware group in `routes/api.php`:
```php
Route::post('/donations/{donation}/proof', [ProofController::class, 'store']);
```

Also add the import at the top:
```php
use App\Http\Controllers\ProofController;
```

---

### 4.7 Frontend — Update Donation type (`lib/donations.ts`)

Add `proof` to the `Donation` type:

```typescript
export type DonationProof = {
  id: number;
  donation_id: number;
  receiver_id: number;
  image_path: string;
  image_url: string;
  uploaded_at: string | null;
  created_at: string;
  updated_at: string;
};

// Add to existing Donation type:
proof?: DonationProof | null;
```

### 4.8 Frontend — Upload UI in `my-claims/page.tsx`

Modify `ClaimCard` (and/or inline within the page) to show an upload section for donations that are:
- `status === 'claimed'` (not yet completed)
- `proof === null || proof === undefined` (no proof uploaded yet)

**Upload component behavior:**

1. Show a clearly labeled section: `"Konfirmasi Pengambilan"` with a subtitle like `"Unggah foto bukti bahwa Anda sudah mengambil donasi ini."`

2. **File input** — styled button (not a raw input), accepts `image/*`, shows selected file name.

3. **Image preview** — when a file is selected, show a small preview thumbnail (`object-cover`, rounded corners). 

4. **Submit button** — `"Unggah Bukti"` — disabled when no file selected or when uploading.

5. **Loading state** — show a spinner or text `"Mengunggah..."` while the request is in flight.

6. **Success** — on 201 response:
   - Update the local donation state to include the returned proof and mark status as `completed`
   - Show a success message: `"Bukti berhasil diunggah! Donasi selesai."`
   - Hide the upload form (since proof now exists)
   - The `ClaimProgress` bar should advance to step 3 (Selesai)

7. **Error** — show the API error message inline below the upload button. Common cases:
   - File too large: `"Ukuran file maksimal 5MB"`
   - Wrong type: `"Hanya format JPG, PNG, atau WebP yang didukung"`
   - Already uploaded: show the server message directly

**FormData upload — critical:** Since this is a file upload, you MUST use `FormData` and avoid setting `Content-Type` manually (the browser sets it with the multipart boundary). The `apiFetch` utility automatically sets `Content-Type: application/json` if there is a body — you must bypass this by NOT going through `apiFetch` for the upload, OR by passing the FormData through with a custom header workaround. The safest approach:

```typescript
// Example upload function — do NOT use apiFetch directly for FormData
async function uploadProof(donationId: number, file: File): Promise<{ proof: DonationProof; donation: Donation }> {
  const token = getToken();
  const form = new FormData();
  form.append("image", file);

  const res = await fetch(`/api/proxy/donations/${donationId}/proof`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Do NOT set Content-Type — browser sets it with boundary
    },
    body: form,
  });

  const text = await res.text();
  let data: unknown = null;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!res.ok) {
    const message = (data && typeof data === "object" && "message" in data)
      ? String((data as { message: unknown }).message)
      : `Upload gagal (${res.status})`;
    throw new ApiError(res.status, message, data);
  }

  return (data as { data: { proof: DonationProof; donation: Donation } }).data;
}
```

**Style guidelines:**
- Match the existing card design: `rounded-3xl`, `border border-[var(--brand-100)]`, `bg-white`, `shadow-[var(--shadow-card)]`
- Brand green: `bg-[var(--brand-600)]` for primary buttons, `text-[var(--brand-700)]` for accents
- Success state: `bg-emerald-50`, `text-emerald-700`, `border-emerald-200` (matches `completed` STATUS_TONE)
- Error state: `bg-red-50 text-red-700 border border-red-200`
- Use `motion.div` with `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}` for the upload section appearing
- Use `transition-all` on interactive elements
- Indonesian UI copy throughout

**ClaimProgress update:** The existing `STEPS` array shows 3 steps: `Terbuka → Diklaim → Selesai`. After a successful upload, the donation status becomes `completed` (index 2 = Selesai). The progress bar already supports this — just ensure the local state is updated.

---

## 5. ACCEPTANCE CRITERIA

The feature is complete when all of the following pass:

**Backend:**
- [ ] Migration runs without errors (`php artisan migrate`)
- [ ] `POST /api/donations/{id}/proof` with valid image returns `201` with proof data
- [ ] After upload, `donation.status` in the database is `completed`
- [ ] Only one proof per donation: second upload attempt returns `422`
- [ ] A different receiver cannot upload proof for someone else's claim → `403`
- [ ] A non-claimed donation (e.g., still `available`) cannot receive proof → `422`
- [ ] Files larger than 5MB → `422` validation error
- [ ] Non-image files (PDF, etc.) → `422` validation error
- [ ] `GET /api/donations/mine` now returns proof nested inside each donation object
- [ ] `GET /api/donations/{id}` returns proof when it exists

**Frontend:**
- [ ] In "Klaim Saya" page, active claimed donations show the upload section
- [ ] Selecting a file shows a preview thumbnail
- [ ] Upload in progress shows loading indicator, button is disabled
- [ ] On success: form disappears, success message shown, progress bar advances to "Selesai"
- [ ] On error: inline error message shown without page reload
- [ ] Donations with existing proof do NOT show the upload form
- [ ] Completed donations (already uploaded) show the proof image or a success badge instead

---

## 6. FILE CHECKLIST — FILES TO CREATE OR MODIFY

```
BACKEND — CREATE:
  be-laravel/database/migrations/XXXX_create_proofs_table.php
  be-laravel/app/Models/Proof.php
  be-laravel/app/Http/Controllers/ProofController.php

BACKEND — MODIFY:
  be-laravel/app/Models/Donation.php          (add proof() hasOne relation)
  be-laravel/app/Http/Controllers/DonationController.php  (eager-load proof in myClaims + show)
  be-laravel/routes/api.php                   (add proof route + import)

FRONTEND — MODIFY:
  fe-nextjs/lib/donations.ts                  (add DonationProof type, add proof field to Donation)
  fe-nextjs/app/receiver/my-claims/page.tsx   (add upload UI to ClaimCard)
```

---

## 7. DO NOT CHANGE

- Do not change the authentication system or Sanctum setup
- Do not change the `EnsureReceiver` middleware
- Do not change any existing migration files
- Do not change the proxy route (`app/api/proxy/[...path]/route.ts`)
- Do not introduce new npm packages or composer packages unless strictly necessary
- Do not change the `STATUS_LABEL` or `STATUS_TONE` maps in `donations.ts` — `completed` is already defined
- Keep all UI copy in Bahasa Indonesia to match the existing codebase

---

## 8. NOTES & EDGE CASES

- **Race condition:** The claim endpoint already uses `DB::transaction` + `lockForUpdate`. The proof upload is simpler — just check `$donation->proof()->exists()` before creating. A unique constraint on `donation_id` in the migration provides a database-level safety net.
- **Storage symlink:** Running `php artisan storage:link` is required to serve files from `storage/app/public/` via the `public/storage/` URL. Note this in a comment or in the README if one exists.
- **File naming:** Use `Str::uuid()` for the filename (e.g., `proofs/550e8400-e29b-41d4-a716-446655440000.jpg`) to avoid collisions and path traversal risks.
- **The `apiFetch` Content-Type gotcha:** The existing `apiFetch` helper sets `Content-Type: application/json` when there is a body. For `FormData`, you must use a raw `fetch` call (as shown in section 4.8) so the browser can set the correct `multipart/form-data; boundary=...` header automatically.
- **Optimistic UI:** You may optimistically update the UI on upload success using the `data` returned by the API (proof + updated donation), rather than re-fetching the full list.
- **Image display:** The `image_url` from the proof can be displayed inside the ClaimCard for completed claims as a small thumbnail to confirm the proof was received.
