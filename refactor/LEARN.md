# LEARN.md — BagiPangan Codebase Learning Pass

Phase 1 output of the structured refactor (REFACTOR-PROMPT.md). READ-ONLY artifact. No code was modified to produce this.
Date: 2026-05-22. Branch: `main`. Working tree has 27 staged changes from the 2026-05-17 security audit; see "State of the tree" below.

---

## 1. Purpose of the codebase

BagiPangan is a food-donation marketplace web app. Donors (`donatur`) post surplus food; receivers (`penerima`) browse a list and a map, claim items, and confirm pickup with a photo proof. Admins (`admin`) moderate posts, manage users and categories, and pull CSV/JSON reports.

Two deployable apps in a monorepo:
- `be-laravel/` — Laravel 13 REST API (PHP 8.5 declared in composer.json, actual local PHP 8.2.30).
- `fe-nextjs/` — Next.js 16 App Router frontend (React 19.2.4).

The frontend never talks to Laravel directly; every BE call goes through Next route handlers under `/api/proxy/...` and `/api/admin/...` that forward headers/cookies.

---

## 2. Top-level architecture diagram

```
                ┌──────────────────────────────────────────────┐
                │  Browser (donatur / penerima / admin UI)     │
                │  - localStorage: bagi_token, bagi_user       │
                │  - cookie: bagi_token (non-httpOnly)         │
                └──────────────┬───────────────────────────────┘
                               │ fetch /api/proxy/...
                               ▼
   ┌──────────────────────────────────────────────────────────┐
   │  Next.js 16 (fe-nextjs)                                  │
   │  app/api/proxy/[...path]/route.ts  → Bearer forward      │
   │  app/api/admin/* (login, dashboard, users, …) → cookie   │
   │  Pages: /donatur, /penerima, /admin, /bagipangan         │
   └──────────────┬───────────────────────────────────────────┘
                  │ HTTP (BAGIPANGAN_BACKEND_URL / default localhost:8000)
                  ▼
   ┌──────────────────────────────────────────────────────────┐
   │  Laravel 13 (be-laravel)                                 │
   │  routes/api.php  → token.auth + admin (for /admin/*)     │
   │  routes/web.php  → web guard (admin session)             │
   │  Controllers (fat) → Eloquent models → PostgreSQL        │
   │  Cache: file driver, 5 min TTL on donation_categories    │
   │  HasAuditTrail trait → activity_logs                     │
   └──────────────┬───────────────────────────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────────────────────────┐
   │  PostgreSQL — Supabase pooler (aws-1-ap-northeast-1)     │
   │  users, donations, claims, donation_categories,          │
   │  activity_logs, fund_donations, sessions,                │
   │  password_reset_tokens                                   │
   └──────────────────────────────────────────────────────────┘
```

---

## 3. Module-by-module summary (LOC excludes vendor/ and node_modules/)

### Backend (`be-laravel/`, 89 PHP files, ~6,655 LOC tracked)

| Path | LOC | Purpose |
|------|-----|---------|
| `app/Http/Controllers/` (19 files) | 2,258 | Request handlers. Fat-controller style; Eloquent calls inline. |
| `app/Http/Controllers/Admin/*` | (subset of above) | AdminAuthController, ModerationController, CategoryManagementController, DonationManagementController, UserManagementController, ActivityLogController, AdminDashboardController, DashboardController, ExportReportController, ReportController. |
| `app/Models/` (6 files) | 329 | User, Donation, Claim, DonationCategory, ActivityLog, FundDonation. |
| `app/Http/Middleware/` (2 files) | 70 | TokenAuth (sha256 hashed bearer), EnsureAdminRole. |
| `app/Http/Requests/` (3 files) | 96 | FormRequest validators — only StoreFundDonationRequest, ExportReportRequest, one other. Underused. |
| `app/Services/` (2 files) | 159 | DonationAnalyticsService (admin analytics queries), RegisterService (registration validation + creation). |
| `app/Traits/HasAuditTrail.php` | ~40 | Hooks model events → writes ActivityLog rows. |
| `database/migrations/` (15 files) | ~200 | Schema. Most recent: `2026_05_04_add_map_fields_to_donations_table.php`. |
| `routes/api.php` | 88 lines | All API routes. |
| `routes/web.php` | 22 lines | Welcome page + profile CRUD. |
| `tests/` (12 files) | ~700 | PHPUnit Feature tests; Admin/*, donations, claims, fund-donations. |

### Frontend (`fe-nextjs/`, 105 TS/TSX files, ~15,646 LOC tracked)

| Path | LOC | Purpose |
|------|-----|---------|
| `app/` (87 files) | 13,494 | Next.js App Router pages, layouts, route handlers. |
| `app/bagipangan/` | ~2,000 | Landing page (hero, FAQ, testimonials, navbar). |
| `app/admin/` | ~1,500 | Admin UI; protected client-side by AdminAuthGate. |
| `app/donatur/` | ~1,200 | Donor dashboard + donation forms. |
| `app/penerima/` | (subset) | Receiver list / map / claim. |
| `app/api/proxy/[...path]/route.ts` | 75 | Forwards Bearer token + select headers to Laravel. |
| `app/api/admin/*/route.ts` | ~800 (with siblings) | Admin proxy routes; forward cookies. |
| `components/` (8 files) | 1,163 | DonationForm, DonationMap, UI primitives. |
| `lib/` (4 files) | 314 | `api.ts` (apiFetch wrapper), `donations.ts`, `supabase.ts`. |
| `hooks/` (2 files) | 160 | `useDonationMap`, `useUserGeolocation`. |
| Tests | 0 | **No frontend test runner installed.** |

---

## 4. Hot paths (highest impact code)

1. **Donation list + map** — `GET /donations`, `GET /donations/map`. Used on landing & receiver pages. Throttled 60/min for `/map`. Cache: `donation_categories` 5 min TTL. (`MapController`, `DonationController::index`.)
2. **Donation detail + claim** — `GET /donations/{id}`, `POST /donations/{id}/claim`. DB::transaction with `lockForUpdate`. (`DonationController::show` / `claim`.)
3. **Proof upload + complete** — `POST /claims/{claim}/proof`. Filesystem write to `public/uploads/claims/`, transaction updates claim + donation. (`ClaimController::uploadProof`.)
4. **Admin dashboard summary** — `GET /admin/dashboard/summary`. Aggregations across donations + activity_logs. (`DashboardController`, `AdminDashboardController`, `DonationAnalyticsService`.)
5. **TokenAuth middleware** — runs on every authenticated API request; hashes inbound token and SELECTs from `users` by `remember_token`.

---

## 5. I/O boundaries

| Boundary | Where |
|----------|-------|
| PostgreSQL (Supabase) | All Eloquent reads/writes. Configured via `DB_HOST=aws-1-ap-northeast-1.pooler.supabase.com`. |
| Filesystem | Claim proof uploads → `public/uploads/claims/claim_{id}_{time}.{ext}`. Image-only via `mimes:jpeg,png,jpg,webp`, max 4096 KB. |
| HTTP outbound (FE → BE) | `fetch` in route handlers using `BAGIPANGAN_BACKEND_URL` (default `http://localhost:8000`). Hardcoded fallback `http://localhost:8000/api` in `app/api/reset-password/route.ts:3`. |
| HTTP outbound (BE) | None active. Guzzle present (transitive) but no direct calls. |
| Cache | Laravel `Cache::remember('donation_categories', 300, …)`. Default driver is `file`. |
| Mail | None deployed (config exists). |
| Queue | None deployed; config defaults to `sync` for tests. `composer dev` script starts `queue:listen` but no jobs dispatched anywhere. |
| Browser storage | `localStorage.bagi_token`, `localStorage.bagi_user`, cookie `bagi_token` (max-age 7 days, non-httpOnly). |
| Third-party | `@supabase/supabase-js` imported in `lib/supabase.ts` but no observable consumers in src. Suspect dead. |

---

## 6. State model

| State | Owner | Mutability |
|-------|-------|------------|
| Bearer token | `users.remember_token` (sha256 hash); browser holds plaintext in localStorage + cookie | Mutates on login / logout / password reset. |
| Admin session | Laravel `sessions` table via web guard | Mutates on `/api/admin/login` / `/api/admin/logout`. |
| Donation lifecycle | `donations.status` enum: pending → approved → claimed → completed (or rejected) | Moderation actions + claim flow. |
| Claim lifecycle | `claims.status`: requested → approved → completed (or cancelled) | Claim creation, proof upload, cancel. |
| Audit trail | `activity_logs` (append-only) | Written via `HasAuditTrail` trait + explicit `ActivityLog::record()` calls. **No retention policy.** |
| Donation categories cache | Cache key `donation_categories`, 5 min TTL | Invalidated on category mutations? — needs verification. |

---

## 7. Conventions in use

- **Naming**: PHP PascalCase classes, snake_case columns, kebab-case URL paths. FE PascalCase components, kebab-case route directories. Consistent.
- **File org**: Laravel default layout. `app/Services/` exists but only 2 services; most logic lives in fat controllers. Tests in `tests/Feature/` and `tests/Unit/` (1 example file).
- **Validation**: Mixed. Some inline `$request->validate()`, some `Validator::make()`, some FormRequest. No standard.
- **Error handling**: No global Exception handler customizations. `AuthController::resetPassword` has try/catch returning generic messages; `LoginController::login` has `Log::error` on exceptions; `DonationController` relies on Laravel's validator exception. Inconsistent.
- **Response envelope**: `{ message, data }` for success; `{ message, errors }` for 422; status codes consistent (200/201/401/403/404/409/422/500).
- **Logging**: `Log::error` only in 3 places; observability is via the `activity_logs` table, not the application log. FE has no `console.log` in production paths.
- **Async**: FE uses `async/await` consistently except `useDonationMap.ts:70-85` (legacy `.then().catch().finally()`). BE is fully synchronous; queue infrastructure exists but is unused.
- **Localization**: Indonesian for auth, donation flows. Mixed Indonesian/English in admin and navbar (e.g., `navbar.tsx:188` "Go to dashboard").

---

## 8. Test inventory

- **Framework**: PHPUnit 12.5.18 (backend). No FE test runner.
- **Test files**: 11 Feature + 1 Unit (`ExampleTest`).
- **Tests by file (approx)**:
  - `tests/Feature/Admin/AdminAccessTest.php` — 4
  - `tests/Feature/Admin/ActivityLogControllerTest.php` — 5
  - `tests/Feature/Admin/CategoryManagementTest.php` — 6
  - `tests/Feature/Admin/ModerationControllerTest.php` — 5
  - `tests/Feature/DonationDetailTest.php` — modified in working tree (token hash migration)
  - `tests/Feature/DonationIndexTest.php` — ~7 (filters, search)
  - `tests/Feature/DonationMapTest.php` — 6, includes rate-limit test (61 sequential requests, line 148)
  - `tests/Feature/DonationMineTest.php`
  - `tests/Feature/FundDonationTest.php` — 5, modified (token hash migration)
  - `tests/Feature/ExampleTest.php` — 1
  - `tests/Unit/ExampleTest.php` — 1
- **Coverage gaps**: ~14 of 19 controllers have ZERO tests. No tests for `LoginController`, `AdminAuthController`, `AuthController` (password reset), `ProfileController`, `ClaimController` proof/cancel, `ExportReportController`, `ReportController`, `UserManagementController`, `DonationManagementController`. Only ~8 of 58 API routes touched.
- **Factories**: User, Donation, DonationCategory, FundDonation. Seeders match.
- **Recently modified (uncommitted)**: `DonationDetailTest.php`, `DonationMapTest.php`, `FundDonationTest.php` — all updated to store sha256-hashed tokens to match the new `TokenAuth` implementation (security fixes from 2026-05-17).
- **CI**: None. No `.github/workflows/`.

### Pre-existing baseline failures (NOT caused by upcoming refactor)
- `php artisan test` → **autoload ParseError** at `vendor/sebastian/environment/src/Console.php:41` because typed-constant syntax (`public const int STDIN = 0`) requires PHP 8.3+. Local PHP is 8.2.30. **0 tests can run on this machine** until PHP is upgraded.
- No frontend test runner; nothing to run.

---

## 9. Dependency inventory

### Backend (composer.json)
- Runtime: Laravel 13.4.0, Carbon 3.11.4, Guzzle 7.10.0 (transitive), Symfony 8.0.8 (transitive), Monolog 3.10.0.
- Dev: phpunit 12.5.18, mockery 1.6.12, laravel/pint 1.29, laravel/pail 1.2.6, fakerphp/faker 1.24.1, nunomaduro/collision 8.9.3.
- **No active CVEs known. PHP constraint `^8.5` declared, but local runtime is 8.2.30 — code in vendor relies on PHP 8.3+ syntax.**

### Frontend (package.json)
| Package | Version | Status |
|---------|---------|--------|
| next | 16.2.3 | Latest 16.x. AGENTS.md says treat as breaking; consult `node_modules/next/dist/docs/` before writing Next.js code. |
| react / react-dom | 19.2.4 | Latest stable. |
| @supabase/supabase-js | ^2.102.1 | **Imported in lib/supabase.ts but no consumers found.** Candidate for removal. |
| leaflet / react-leaflet / leaflet.markercluster | ^1.9.4 / ^5.0 / ^1.5.3 | Active — map UI. |
| recharts | ^3.8.1 | Active — admin dashboard charts. |
| framer-motion | ^12.38.0 | Used in DonationForm animations. |
| lenis | ^1.3.23 | **No usage found.** Candidate for removal. |
| swr | ^2.4.1 | **Duplicate of custom `apiFetch` in `lib/api.ts`.** Candidate for removal. |
| react-countup | ^6.5.3 | Counter UI. |
| react-icons | ^5.6.0 | Active. |
| clsx / tailwind-merge | ^2.1.1 / ^3.5.0 | Standard. |
| Dev: typescript ^5, eslint ^9, eslint-config-next 16.2.3, tailwindcss ^4, @tailwindcss/postcss ^4 | — | OK. |

- **No `engines` field; no `.nvmrc`.** Next.js 16 needs Node ≥ 20; local is Node 25.7.0 (works).
- `composer audit` and `npm audit` not yet executed in this session.

---

## 10. Perf baseline

Could not capture runtime probes — local PHP 8.2 cannot boot the Laravel kernel (see §8 baseline failure). Frontend dev server not started in this read-only phase.

Captured static baselines instead:

| Metric | Value |
|--------|-------|
| Backend LOC (tracked, ex-vendor) | 6,655 |
| Frontend LOC (tracked, ex-node_modules) | 15,646 |
| Backend `app/Http/Controllers` LOC | 2,258 across 19 files (avg 119 LOC/controller — moderately fat) |
| Migrations | 15 |
| API routes declared in routes/api.php | 88 lines |
| `donation_categories` cache TTL | 300 s |
| `/api/donations/map` rate limit | 60 req/min |
| Rate-limit test request count | 61 sequential calls |

Runtime probes (cold start, end-to-end request latency, build time, bundle size) deferred to Phase 4. We will recapture against the same probe script for any perf-claimed step.

---

## 11. Diagnostic baseline

`mcp__ide__getDiagnostics` at session start:

- **2 TypeScript errors** in `fe-nextjs/components/map/DonationMapPageContent.tsx:31`:
  - `Property 'data' does not exist on type 'CategoryOption[] | { data?: CategoryOption[] | undefined; }'.` (twice on the same line.)
- All other open files clean.

The refactor must not increase this count.

---

## 12. State of the tree (carry-over from previous session)

27 modified files in the working tree are uncommitted security/UX fixes from the 2026-05-17 audit. Highlights — these are pre-existing changes, not refactor scope:

- `app/Http/Middleware/TokenAuth.php` — token logging removed, sha256 hashed comparison.
- `app/Http/Controllers/LoginController.php` — token hashed before storage; exception leakage removed.
- `app/Http/Controllers/Admin/AdminAuthController.php`, `app/Http/Controllers/Admin/ReportController.php`, `app/Http/Controllers/DonationController.php`, `app/Http/Controllers/ClaimController.php`, `app/Http/Controllers/MapController.php`, `routes/api.php` — various P0/P1 fixes.
- `fe-nextjs/app/api/proxy/[...path]/route.ts` — stop forwarding browser cookies to backend (CSRF/leak fix).
- `fe-nextjs/app/login/page.tsx`, `fe-nextjs/app/donatur/donations/[id]/page.tsx` — UX + type-safety.
- Tests: `DonationDetailTest.php`, `DonationMapTest.php`, `FundDonationTest.php` — updated to hashed-token fixtures.
- Deletions: 7 prompt/script files at repo root + Laravel root + a one-off Next CSV export route.

**Before the refactor starts editing, decide:** (a) commit this batch first so the refactor can be diffed cleanly, or (b) include it in the refactor's first commit. See open question Q1.

---

## 13. Surprising / "why is this here?" findings

- **Dual auth without a single source of truth.** API routes use a token-based middleware `token.auth`; admin web routes use Laravel's session guard `auth:web`; but `routes/api.php` mounts the admin block with both `web` and `auth:web` middleware, and at least one admin endpoint (`/admin/fund-donations/monitoring`) uses `token.auth + admin` instead. The frontend's `AdminAuthGate` only inspects `localStorage.bagi_user` — trivially bypassable; protection comes from the backend.
- **Password reset returns the raw token in the JSON response** (`app/Http/Controllers/AuthController.php` "debug_token"). Account-takeover vector. Not in the May 17 fix batch.
- **Custom `apiFetch()` wrapper and `swr` are both installed**; `swr` isn't imported anywhere. `lenis` and `@supabase/supabase-js` likewise look unused.
- **No CI.** No GitHub Actions; quality gates rely on local runs.
- **PHP version drift.** composer.json declares `^8.5`; vendor code already uses 8.3 typed constants; local machine is 8.2.30. Tests cannot boot.
- **Two admin "dashboard" controllers** (`Admin/DashboardController` and `Admin/AdminDashboardController`) with overlapping responsibilities. One serves `/admin/dashboard/summary`, the other `/admin/dashboard`. Not documented.
- **`FundDonation` feature** has model + ApiResource controller + tests, but no UI consumer in `fe-nextjs`. Stranded module or in-flight feature.
- **`HasAuditTrail` writes unbounded `activity_logs` rows** with no retention/archival.
- **`DonationMapTest` rate-limit test fires 61 sequential HTTP calls.** Functional but slow; potential test-suite tax once tests can actually run.
- **`composer dev` script starts `queue:listen`** even though no jobs are dispatched anywhere — wasted dev resource.
- **`.env.example` carries the real Supabase password** (`DB_PASSWORD=BagiPangan123`). Operational hygiene leak.
- **CORS** `supports_credentials=false` is correct for token auth, but the admin session flow theoretically needs credentialed CORS — works today only because the Next proxy forwards cookies server-side.
- **AdminAuthController** calls `Auth::guard('web')->login()` (session) but the frontend immediately uses `Bearer` tokens for subsequent admin requests via `apiFetch`. Authorization is honored only because the admin route guard accepts BOTH session and token in different declarations. Confusing.
- **No `Handler.php` customization** — production exception responses fall back to Laravel defaults, including stack traces when `APP_DEBUG=true`.

---

## 14. Open questions for the user (please answer before Phase 2)

1. **Carry-over commits**: Should we commit the 27 staged files (security/UX from 2026-05-17) as a separate PR before the refactor starts, or fold them into the refactor's first commit?
2. **Auth strategy direction**: We see two diverging auth models (session for admin, token for API; with inconsistencies). Do you want the refactor to unify on one — and if so, which: token-only, or session-only? (Recommend token-only with a server-checked admin role claim to remove client-side `AdminAuthGate`.)
3. **PHP version**: Should the refactor bump the local toolchain to PHP 8.3+ (so tests can actually run, matching what vendor code already requires), or stay on 8.2 and pin composer.json down to `^8.2`?
4. **Test command**: `composer test` (which runs `php artisan test`) is what we'd standardize on for backend. For frontend, is it acceptable to introduce **Vitest** (lightweight, Next-friendly) for the refactor's regression tests, or do you want to keep FE untested?
5. **Dependencies to remove**: `swr`, `lenis`, `@supabase/supabase-js` look unused. Confirm we can remove them (subject to a grep audit during execution).
6. **`FundDonation`**: Is this an in-flight feature we should preserve, or dead code to delete?
7. **Two dashboard controllers**: Is `Admin/DashboardController` deprecated, or are both endpoints actively consumed by the FE? (We'll grep before deciding.)
8. **Password-reset token leak**: Treat as a P0 in this refactor (we already hashed tokens but did not remove the `debug_token` echo). Confirm OK to fix in Phase 4.
9. **`.env.example` credential leak**: Replace `DB_PASSWORD=BagiPangan123` with a placeholder and rotate the Supabase password. The rotation is operational — we'll flag it, you do it. OK?
10. **`activity_logs` retention**: Add a console command to prune logs older than N days? If yes, what N (30/90/180)?
11. **Run / test commands**: What's the canonical "run the app" command you use locally? `composer dev` (root)? `npm --prefix fe-nextjs run dev`? Both? We'll use whichever for perf-baseline probes.
12. **Perf hotspots**: You said "discover during audit." Best candidates from this pass: admin dashboard aggregate queries (`AdminDashboardController` + `DonationAnalyticsService`) and the donation list/map combo. Confirm to focus there.

---

## STOP — awaiting your review

This document is the Phase 1 deliverable. Per the refactor prompt, I will not proceed to Phase 2 (REFACTOR-MAP.md) until you confirm:
- You're happy with the understanding above, and
- You've answered the 12 open questions in §14.

Reply with answers (free-form or "use your judgment on all of them"), and I'll begin Phase 2.
