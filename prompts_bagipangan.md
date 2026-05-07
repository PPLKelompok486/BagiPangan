# BagiPangan — AI Implementation Prompts

> Stack: Laravel (PHP 8.2) · Next.js (SSR + CSR) · Tailwind CSS · Supabase PostgreSQL · Supabase Object Storage · Apache · Laravel Dusk (E2E Testing)

---

## SCRUM 61 — FR-09: View Donation Detail

### Context
A user (any role) clicks on a donation card and lands on the detail page. The page must show full donation info, photo gallery, donor details, and a conditional "Klaim Donasi" button visible only to Penerima (receivers).

### Prompt

```
You are a senior fullstack engineer working on BagiPangan, an Indonesian surplus food sharing platform.

Stack:
- Backend: Laravel (PHP 8.2), Supabase PostgreSQL (monolithic database)
- Frontend: Next.js (SSR + CSR), Tailwind CSS
- Storage: Supabase Object Storage (for donation photos)
- Web Server: Apache
- Testing: Laravel Dusk (Automated E2E)

Task — implement SCRUM 61 (FR-09): "As a user, I can view the donation detail."

### Backend (Laravel)

1. Create route: GET /api/donations/{id}
   - Public endpoint (no auth required to view)
   - Controller: DonationController@show
   - Return a DonationResource with fields:
     - id, title, description, quantity, unit, expiry_date
     - status (available | claimed | completed | cancelled)
     - category: { id, name }
     - donor: { id, name, phone, city }
     - photos: [{ url (signed Supabase URL), order }]
     - claimed_by: { id, name } (null if not claimed)
     - created_at, updated_at
   - Return 404 with JSON error if donation not found

2. In DonationResource, generate signed URLs for each photo using Supabase Storage SDK.

### Frontend (Next.js)

1. Create page: app/donations/[id]/page.jsx
   - Server component: fetch donation on the server using fetch() with cache: 'no-store'
   - Render:
     a. Photo carousel/gallery (use swiper or simple image tabs)
     b. Title, description, quantity, expiry date
     c. Status badge — color-coded:
        - available → green
        - claimed → yellow
        - completed → gray
        - cancelled → red
     d. Category chip
     e. Donor info card: name, city, phone (show phone only if user is logged in)
     f. "Klaim Donasi" button — render only if:
        - User is authenticated
        - User role === 'penerima'
        - Donation status === 'available'
     g. If status is 'claimed' and current user is the claimant, show "Lihat Status Klaim" button

2. Create a loading.jsx skeleton for the page.
3. Handle error state: if API returns 404, render not-found.jsx.

### Notes
- Use next/image for all photo rendering with proper width/height
- Ensure the page is fully responsive (mobile-first)
- Add breadcrumb: Home > Donasi > [title]
```

---

## SCRUM 40 — FR-15: Admin Generate Donation Reports & Analytics

### Context
Admin users need a dashboard with charts and statistics about donation activity, filterable by date range.

### Prompt

```
You are a senior fullstack engineer on BagiPangan, an Indonesian surplus food platform.

Stack: Laravel (PHP 8.2) · Next.js (SSR + CSR) · Tailwind CSS · Supabase PostgreSQL · recharts

Task — implement SCRUM 40 (FR-15): "As an admin, I can generate donation reports and analytics."

### Backend (Laravel)

1. Create route: GET /api/admin/dashboard
   - Protected: Auth middleware + role check (admin only), return 403 otherwise
   - Query params: date_from (Y-m-d), date_to (Y-m-d), optional
   - Response JSON:
     {
       "summary": {
         "total_donations": 120,
         "available": 40,
         "claimed": 50,
         "completed": 25,
         "cancelled": 5
       },
       "donations_per_day": [
         { "date": "2024-01-01", "count": 12 }
       ],
       "top_donors": [
         { "id": 1, "name": "Toko Sari", "total": 18 }
       ],
       "category_breakdown": [
         { "category": "Sayuran", "count": 30 }
       ]
     }
   - Use Eloquent with whereBetween for date filtering
   - Limit top_donors to 5 results

2. Create AdminDashboardController@index with the above logic.

### Frontend (Next.js)

1. Create page: app/admin/dashboard/page.jsx
   - Client component (uses recharts)
   - Fetch data from /api/admin/dashboard
   - UI sections:
     a. Date range picker (two <input type="date"> fields) — re-fetches on change
     b. Summary cards row: Total, Available, Claimed, Completed, Cancelled — each as a colored card
     c. Line chart (recharts LineChart): donations_per_day — x-axis: date, y-axis: count
     d. Donut/Pie chart (recharts PieChart): status breakdown with legend
     e. Bar chart (recharts BarChart): category_breakdown
     f. Top Donors table: rank, name, total donations

2. Add loading skeleton for each section.
3. Protect route: redirect to /login if user is not admin.

### Notes
- Use ResponsiveContainer from recharts for all charts
- Format dates in Indonesian locale (id-ID) for display
- Mobile: stack all cards and charts vertically
```

---

## SCRUM 62 — FR-08: Filter and Search Donations

### Context
Users on the /donations listing page can search by keyword and filter by category, location, and status. Results are paginated and URL params stay in sync.

### Prompt

```
You are a senior fullstack engineer on BagiPangan, an Indonesian surplus food platform.

Stack: Laravel (PHP 8.2) · Next.js (SSR + CSR) · Tailwind CSS · Supabase PostgreSQL

Task — implement SCRUM 62 (FR-08): "As a user, I can filter and search for donations."

### Backend (Laravel)

1. Update route: GET /api/donations
   - Public endpoint
   - Accepted query params:
     - keyword (string) — search in title and description
     - category_id (integer)
     - location (string) — match donor city
     - status (string: available | claimed | completed)
     - sort (string: newest | oldest | expiry_soon), default: newest
     - page (integer), per_page (integer, default 12)
   - Return paginated JSON:
     {
       "data": [ DonationCard objects ],
       "meta": { "current_page", "last_page", "total", "per_page" }
     }
   - DonationCard fields: id, title, category, status, photo_thumbnail, donor_city, expiry_date
   - Use Eloquent scopes for each filter (scopeByKeyword, scopeByCategory, scopeByLocation, scopeByStatus)

2. Add index to donations table on: status, category_id, created_at for performance.

### Frontend (Next.js)

1. Create page: app/donations/page.jsx
   - Client component with useSearchParams + useRouter for URL sync
   - UI layout:
     a. Search bar (text input) — debounced 400ms, updates ?keyword= in URL
     b. Filter bar:
        - Category dropdown (fetched from GET /api/categories)
        - Location text input
        - Status select (All | Available | Claimed | Completed)
        - Sort select (Terbaru | Terlama | Segera Kadaluarsa)
     c. Results grid: 3 columns desktop / 2 tablet / 1 mobile
     d. DonationCard component: thumbnail, title, status badge, city, expiry date
     e. Pagination controls: Previous / Page numbers / Next
     f. Empty state: illustration + "Belum ada donasi yang sesuai"

2. On first render, read filter values from URL searchParams (supports direct link sharing).
3. Each filter change updates URL params without full page reload (router.push with shallow).

### Notes
- Debounce keyword input to avoid excessive API calls
- Show skeleton cards (6 items) while loading
- Clear all filters button resets URL to /donations
```

---

## SCRUM 51 — FR-17: Export Reports

### Context
Admin can export donation data as a CSV file, filtered by date range, status, and donor, with an audit log entry created on each export.

### Prompt

```
You are a senior fullstack engineer on BagiPangan, an Indonesian surplus food platform.

Stack: Laravel (PHP 8.2) · Next.js (SSR + CSR) · Tailwind CSS · Supabase PostgreSQL

Task — implement SCRUM 51 (FR-17): "As a user, I can export reports."

### Backend (Laravel)

1. Create route: GET /api/admin/reports/export
   - Protected: admin only (Auth middleware + role check)
   - Query params:
     - date_from (Y-m-d, required)
     - date_to (Y-m-d, required)
     - status (string, optional)
     - donor_id (integer, optional)
   - Validate params with FormRequest; return 422 on validation error
   - Stream a CSV response:
     - Headers: Content-Type: text/csv, Content-Disposition: attachment; filename="donasi_export_{date}.csv"
     - CSV columns: ID, Judul, Kategori, Donatur, Kota, Status, Jumlah, Satuan, Tgl Dibuat, Tgl Klaim
   - Use Laravel's response()->stream() or LazyCollection for memory-efficient large exports
   - After streaming, write an entry to audit_logs table:
     { user_id, action: 'export_report', meta: { date_from, date_to, total_rows } }

2. Create ExportReportController@export with the above logic.

### Frontend (Next.js)

1. Create page: app/admin/reports/page.jsx
   - Client component
   - UI:
     a. Date range pickers: "Dari Tanggal" and "Sampai Tanggal" (<input type="date">)
     b. Status filter select (optional)
     c. Donor search/select (optional, autocomplete from GET /api/admin/donors)
     d. "Export CSV" button
   - On button click:
     a. Build URL: /api/admin/reports/export?date_from=...&date_to=...
     b. Fetch with credentials: 'include'
     c. Get response as Blob
     d. Create object URL and trigger <a> download programmatically
     e. Revoke object URL after download
   - Show loading spinner on the button while export is in progress
   - Show success toast: "Laporan berhasil diunduh"
   - Show error toast if API returns non-2xx

2. Protect route: redirect to /login if not admin.

### Notes
- Never open the CSV in a new tab — always trigger as file download via Blob
- Validate that date_from <= date_to on the frontend before calling API
- Filename should include the export date range: donasi_2024-01-01_to_2024-01-31.csv
```

---

## SCRUM 63 — FR-19: Map Visualization

### Context
Users can view available donations on an interactive map. Donations with lat/lng coordinates are shown as green map markers with popups. The map uses OpenStreetMap tiles via react-leaflet.

### Prompt

```
You are a senior fullstack engineer on BagiPangan, an Indonesian surplus food platform.

Stack: Laravel (PHP 8.2) · Next.js (SSR + CSR) · Tailwind CSS · Supabase PostgreSQL · Supabase Object Storage · react-leaflet · Leaflet.js

Task — implement SCRUM 63 (FR-19): "As a user, I can view a map visualization."

### Database

1. Add migration to add lat/lng to donations:
   Schema::table('donations', function (Blueprint $table) {
       $table->decimal('latitude', 10, 7)->nullable();
       $table->decimal('longitude', 10, 7)->nullable();
   });

2. Update DonationController@store and @update to accept and save lat/lng fields.

### Backend (Laravel)

1. Create route: GET /api/donations/map
   - Public endpoint
   - Return only donations where status = 'available' AND latitude IS NOT NULL
   - Response array (no pagination — return all at once for map rendering):
     [
       {
         "id": 1,
         "title": "Nasi Box",
         "category": "Makanan Siap Saji",
         "donor_city": "Bandung",
         "expiry_date": "2024-02-01",
         "latitude": -6.9175,
         "longitude": 107.6191,
         "thumbnail": "https://..."
       }
     ]
   - Cap the response at 500 records for performance

2. Add index: donations(status, latitude) for fast map queries.

### Frontend (Next.js)

1. Install packages: npm install react-leaflet leaflet react-leaflet-cluster
   Add to next.config.js: transpilePackages: ['react-leaflet-cluster']

2. Create page: app/donations/map/page.jsx
   - Use next/dynamic with ssr: false to import the map component (Leaflet requires browser)
   - Pass donation data as props (fetched server-side)

3. Create component: components/DonationMap.jsx
   - Client component
   - Import Leaflet CSS in useEffect to avoid SSR issues
   - Use MapContainer, TileLayer (OpenStreetMap), MarkerClusterGroup
   - For each donation, render a Marker with a custom green icon:
     L.icon({ iconUrl: '/icons/marker-green.svg', iconSize: [32, 40] })
   - Popup content per marker:
     - Thumbnail (50x50)
     - Title (bold)
     - Category chip
     - Expiry date
     - "Lihat Detail" link → /donations/{id}
   - Default center: Bandung, Indonesia [-6.9175, 107.6191], zoom: 12
   - Add a "Gunakan Lokasi Saya" button (geolocation):
     navigator.geolocation.getCurrentPosition → map.flyTo(userCoords, 14)
   - Show a blue dot marker at user's location when geolocation is granted

4. Add /icons/marker-green.svg to /public/icons/

### Notes
- IMPORTANT: All Leaflet imports must be inside dynamic() or useEffect — never at top-level
- react-leaflet-cluster handles overlapping markers automatically
- Add a fallback message if no available donations have coordinates
- Map height: 100vh minus navbar height (use CSS calc)
```

---

## Groq AI Assistant — Role-Aware System Prompt (FR-AI)

### Context
An in-app AI chat assistant powered by Groq API (llama3-70b-8192) that helps all three user roles: Donatur (donors), Penerima (receivers), and Admin.

### System Prompt Template

```
You are a helpful assistant for BagiPangan, an Indonesian platform that connects food donors with people in need to reduce food waste.

You are currently helping: {{USER_NAME}} (Role: {{USER_ROLE}})

## Platform Overview
BagiPangan allows:
- Donatur (Donors): Post surplus food donations with photos, quantity, expiry date, and pickup location.
- Penerima (Receivers): Browse available donations, claim them, and confirm receipt by uploading proof.
- Admin: Monitor all activity, generate reports, manage users, and oversee the donation lifecycle.

## Donation Lifecycle
Post (available) → Claimed (klaim) → Completed (konfirmasi) → [or Cancelled]

## How to help based on user role:

### If USER_ROLE is "donatur":
- Help them post a donation: required fields are title, category, quantity, unit, expiry date, pickup address, and at least one photo.
- Guide them to track their posted donations at /my-donations.
- Remind them to mark a donation as completed after the receiver picks it up.
- Current stats available to you: {{DONOR_TOTAL_DONATIONS}} donations posted, {{DONOR_ACTIVE_COUNT}} currently available.

### If USER_ROLE is "penerima":
- Help them find donations: use the search page (/donations) with keyword, category, or location filters.
- Explain the claim process: click "Klaim Donasi" → coordinate with donor → upload proof of receipt at /my-claims.
- Guide them to upload bukti penerimaan (proof photo) to mark a claim as completed.
- Current stats: {{RECEIVER_ACTIVE_CLAIMS}} active claims.

### If USER_ROLE is "admin":
- Help with dashboard navigation: /admin/dashboard for analytics, /admin/reports for CSV export.
- Explain how to manage users, review flagged donations, or generate filtered reports.
- Guide through the export flow: date range → optional filters → Export CSV button.
- Current stats: {{ADMIN_TOTAL_USERS}} registered users, {{ADMIN_PENDING_CLAIMS}} pending claims.

## Tone & Language
- Use Bahasa Indonesia by default. Switch to English if the user writes in English.
- Be friendly, concise, and practical.
- If you don't know something specific about BagiPangan data, say so and guide the user to the right page.

## Boundaries
- Do NOT make up donation listings, user names, or data.
- Do NOT perform actions on behalf of the user — only guide them.
- If asked about something unrelated to food donation or the platform, politely redirect: "Saya hanya bisa membantu seputar BagiPangan 😊"
```

### TypeScript Integration

```typescript
// lib/groqChat.ts
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface UserContext {
  name: string;
  role: "donatur" | "penerima" | "admin";
  stats: Record<string, number>;
}

function buildSystemPrompt(ctx: UserContext): string {
  return SYSTEM_PROMPT_TEMPLATE
    .replace("{{USER_NAME}}", ctx.name)
    .replace("{{USER_ROLE}}", ctx.role)
    .replace("{{DONOR_TOTAL_DONATIONS}}", String(ctx.stats.totalDonations ?? 0))
    .replace("{{DONOR_ACTIVE_COUNT}}", String(ctx.stats.activeDonations ?? 0))
    .replace("{{RECEIVER_ACTIVE_CLAIMS}}", String(ctx.stats.activeClaims ?? 0))
    .replace("{{ADMIN_TOTAL_USERS}}", String(ctx.stats.totalUsers ?? 0))
    .replace("{{ADMIN_PENDING_CLAIMS}}", String(ctx.stats.pendingClaims ?? 0));
}

export async function chatWithBagiPanganAI(
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  userContext: UserContext
) {
  const completion = await groq.chat.completions.create({
    model: "llama3-70b-8192",
    messages: [
      { role: "system", content: buildSystemPrompt(userContext) },
      ...conversationHistory,
      { role: "user", content: userMessage },
    ],
    temperature: 0.5,
    max_tokens: 512,
  });
  return completion.choices[0].message.content;
}
```

### Usage Example (Next.js API Route)

```typescript
// app/api/chat/route.ts
import { chatWithBagiPanganAI } from "@/lib/groqChat";
import { getServerSession } from "next-auth";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { message, history } = await req.json();

  const reply = await chatWithBagiPanganAI(message, history, {
    name: session.user.name,
    role: session.user.role,
    stats: await getUserStats(session.user.id, session.user.role),
  });

  return Response.json({ reply });
}
```

---

*Generated for BagiPangan — Tugas Besar PPL · Sprint 2–3*
