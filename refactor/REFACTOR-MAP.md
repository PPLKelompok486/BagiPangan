# REFACTOR-MAP.md — Phase 2 Catalogue

Phase 2 deliverable of the structured refactor. Inputs: `LEARN.md` + parallel-agent audits + targeted file reads for Q5–Q12 from §14 of LEARN.md. Still READ-ONLY; no code modified yet.

Date: 2026-05-22.

---

## Phase 1 open-question resolutions (assumed defaults)

Adopted in lieu of explicit answers — user said "you can resume." Stated up front so the user can override any choice before Phase 3.

| # | Question | Resolution |
|---|----------|-----------|
| Q1 | Commit the 27 staged files? | **Yes — commit them first** as a clean baseline ("chore: stage 2026-05-17 security & UX fixes"). Refactor diffs against that. |
| Q2 | Unify auth model? | **No full migration.** Harmonize the two admin route groups in `routes/api.php` (currently lines 52–77 vs 84–88 — same `admin` prefix, different middleware). One group, both auths via a single middleware stack. |
| Q3 | PHP version | **Pin composer.json from `^8.5` → `^8.2`.** That matches local PHP 8.2.30 and the actual constraint of vendor code in lock. (Note: an earlier audit observation about typed constants requiring 8.3 is on stale vendor; current lock with Laravel 13.4 works on 8.2.) Re-run tests to confirm. If lock truly needs 8.3, switch direction and document. |
| Q4 | Frontend tests | **Backlog**, out of this pass. Too broad. |
| Q5 | Remove unused deps | **Dropped** — verified `swr` (`app/receiver/dashboard/page.tsx:8`), `lenis` (`app/bagipangan/providers/smooth-scroll-provider.tsx:7`), `@supabase/supabase-js` (`lib/supabase.ts:1`, `app/api/admin/migrate-user/route.ts:2`) all have real consumers. |
| Q6 | `FundDonation` | **Keep.** FE consumer at `fe-nextjs/app/donatur/fund-donations/new/page.tsx`. |
| Q7 | Two dashboard controllers | **Keep both** (different response shapes, different consumers) but rename one (`DashboardController` → `DashboardSummaryController`) and the path to clarify intent. |
| Q8 | Password-reset `debug_token` leak | **P0, in scope.** |
| Q9 | `.env.example` credential leak | **P0, in scope.** Rotation by you (operational). |
| Q10 | `activity_logs` retention | **Backlog.** |
| Q11 | Run/test commands | `composer dev` (concurrent run from `be-laravel/`), `composer test` (backend). FE: `npm --prefix fe-nextjs run dev` / `npm --prefix fe-nextjs run lint`. |
| Q12 | Perf focus | `AdminDashboardController::index` aggregate queries + donation list/map. |

If any of these are wrong, tell me before Phase 3.

---

## 1. BUG CANDIDATES

Format: ID | file:line | observed/expected | severity | confidence | repro sketch.

| ID | File:line | Observed / Expected | Sev | Conf | Repro |
|----|-----------|---------------------|-----|------|-------|
| **B1** | `be-laravel/app/Http/Controllers/AuthController.php:57` | Observed: response returns `'debug_token' => $token` raw. Expected: token is delivered via side channel (email) or not returned. | P0 | proven | `POST /api/forgot-password {email}` → JSON shows plain token; pass that token to `POST /api/reset-password` → account taken over. |
| **B2** | `be-laravel/.env.example:24-28` | Real Supabase credentials committed: `DB_PASSWORD=BagiPangan123`. Expected: placeholder. | P0 | proven | `git show HEAD:be-laravel/.env.example`. Anyone with repo access has the prod DB password. **Requires rotation after fix.** |
| **B3** | `be-laravel/app/Http/Controllers/AuthController.php:95` | `catch (\Exception $e) { ... 'Terjadi kesalahan server: ' . $e->getMessage() }` — server exception text leaks to client. Expected: generic 500 + log. | P1 | proven | Force a DB connection error during reset → message includes driver/SQL detail. |
| **B4** | `be-laravel/routes/api.php:52, 84` | Two admin route groups with the same `admin` prefix but different middleware. Predictable confusion: e.g., `/admin/dashboard` resolves under `token.auth` while `/admin/dashboard/summary` resolves under `auth:web`. Expected: single source of truth for admin auth. | P1 | proven | `php artisan route:list --path=admin` would show both stacks. |
| **B5** | `fe-nextjs/components/map/DonationMapPageContent.tsx:31` | TS error (×2): `Property 'data' does not exist on type 'CategoryOption[] | { data?: CategoryOption[] | undefined; }'`. Expected: narrow the union before access. | P2 | proven | Already in `mcp__ide__getDiagnostics`. |
| **B6** | `be-laravel/app/Http/Controllers/AuthController.php:48,70` | `Schema::hasTable(...)` runs on every `forgotPassword` and `resetPassword` request — informational SQL each call. Also, supporting BOTH `password_reset_tokens` and `password_resets` is dead-code branching (the standard Laravel name is `password_reset_tokens`). Expected: pick one. | P2 | likely | Trace endpoint; observe extra `information_schema` query. |
| **B7** | `be-laravel/app/Http/Controllers/Admin/DashboardController.php:21-27` | `Claim::whereNotNull(...)->get()->avg(fn)` loads all matching claims into PHP memory just to compute an average. Expected: `Claim::selectRaw('AVG(EXTRACT(EPOCH FROM (completed_at - claimed_at))/60)')`. | P2 | proven | As data grows the dashboard summary slows linearly. |
| **B8** | `be-laravel/app/Http/Controllers/Admin/AdminDashboardController.php:43-64` | PHP-side day-fill loop runs across `[date_from, date_to]`. Functional, but the loop builds a date map by iterating every day — fine for 30-day windows, won't scale to year+. Expected: generate_series in SQL or cap window. | P3 | likely | Open dashboard with `?date_from=2020-01-01&date_to=2026-05-22`. |
| **B9** | `be-laravel/app/Http/Controllers/AuthController.php:23-26` | `login()` here duplicates `LoginController::login`. They differ: this one does NOT issue a token. Hitting `/api/login` resolves to `LoginController` (route only wires that one), so this method is dead code. Expected: delete. | P2 | proven | Grep `routes/api.php` for `AuthController::class, 'login'` → not present. |
| **B10** | `be-laravel/app/Http/Controllers/Admin/DashboardController.php:14-15` | `Donation::count()` and `Donation::where(...)->count()` are two unbounded full-table scans. Expected: single aggregated `selectRaw` with `COUNT(*) FILTER (WHERE status=…)`. | P2 | proven | Inspect DB profile after dashboard load. |
| **B11** | `fe-nextjs/hooks/useDonationMap.ts:70-85` | `.then().catch().finally()` Promise chain in a hook. Mixed with async/await elsewhere; same chain re-runs on every dependency change without abort signal. Expected: `async` + `AbortController`. | P2 | likely | Open map page, rapidly change `bbox` — stale fetch may resolve last. |
| **B12** | `be-laravel/app/Traits/HasAuditTrail.php` (whole file) | Writes one `activity_logs` row per model mutation, including bulk operations. No `actor_user_id` capture from `Auth::id()` is verified inside the trait — risk of unattributed rows. Expected: attach actor from current auth context. | P2 | suspect | Need to read the trait body in Phase 3 to confirm. |
| **B13** | `be-laravel/composer.json:9` | `"php": "^8.5"` declared. Local + CI run on 8.2. Anyone running `composer install` on PHP 8.2 will be rejected. Expected: constraint matches reality. | P1 | proven | `php -r 'echo PHP_VERSION;'` vs constraint. |

**Excluded (already fixed in staged batch):** TokenAuth logging (`TokenAuth.php`), plaintext token storage (`LoginController.php`), proof-upload RCE (`ClaimController.php`), DonationController category validation, Next proxy cookie forwarding — all in the 27 staged files.

---

## 2. DUPLICATE CLUSTERS

Format: cluster | sites | canonical | drift.

| ID | Cluster | Sites | Canonical (proposed) | Drift in other copies |
|----|---------|-------|----------------------|----------------------|
| **D1** | "Resolve `password_reset_tokens` vs `password_resets` table name" | `AuthController.php:48` and `AuthController.php:70` | Single private helper or constant `self::RESET_TABLE` resolved once via service provider. | Two identical `Schema::hasTable` calls inside the same controller. |
| **D2** | Admin route group with `admin` prefix | `routes/api.php:52-77` (web/session) and `routes/api.php:84-88` (token.auth) | One group, one middleware decision. Pick `auth:web` for the entire admin surface (admin uses session login) and move `AdminDashboardController` + `FundDonationController@index` + `ReportController@analytics` into it. | Different middleware on same prefix. |
| **D3** | Authenticated-user lookup in controllers | `DonationController::store`, `DonationController::claim`, `ClaimController::*` all read `Auth::id()` inline | Already centralized in `TokenAuth` middleware via `Auth::setUser`. No code change needed — confirm during Phase 3 read that all controllers consume `Auth::id()` (not an alternative `User::where(remember_token=…)`). | None expected; verify only. |
| **D4** | Inline form validation vs `FormRequest` | `DonationController::store`, `update`; `DonationManagementController::store`; `AdminDashboardController::index` (Validator::make + $request->validate mixed in same project) | Extract `StoreDonationRequest`, `UpdateDonationRequest`, `AdminDashboardFilterRequest`. | Inconsistent style; only `StoreFundDonationRequest`, `ExportReportRequest` exist today. |
| **D5** | `AuthController::login` vs `LoginController::login` | `AuthController.php:14-33`, `LoginController.php` (the wired one) | `LoginController::login` (the one routed). | `AuthController::login` is dead. Delete entire method, possibly entire `AuthController::login`. |
| **D6** | Day-bucket / status-bucket aggregations | `Admin/AdminDashboardController.php:30-88` + `DonationAnalyticsService.php` (likely overlap) | Move all dashboard aggregations into `DonationAnalyticsService`; `AdminDashboardController::index` becomes a thin adapter. | Logic split between controller and service. (Confirm in Phase 3 by reading the service.) |
| **D7** | `Schema::hasTable` calls protecting an alternate table name | Same controller, two methods | Constant. | See D1; this is the same root cause. |

---

## 3. PERF ISSUES (must be measurable)

| ID | Where | Smell | Measure | Expected win |
|----|-------|-------|---------|--------------|
| **P1** | `Admin/DashboardController.php:21-27` (avg claim minutes) | Loads entire `claims` rowset into PHP, computes avg in PHP. Quadratic memory + slow as table grows. | Wrap dashboard call in `DB::enableQueryLog`; observe row count; time the request. | Drop from O(N) PHP iteration to single SQL `AVG`; on 10k claims should be ~50–500× faster. |
| **P2** | `Admin/DashboardController.php:14-19` (KPI counts) | Two full scans (`count()` + `where('status', completed)->count()`). | Query log; measure request latency on dashboard summary. | Single `selectRaw COUNT(*) FILTER (WHERE …)` → one scan. |
| **P3** | `Admin/AdminDashboardController.php:30-88` (status / per-day / top-donors / category) | Five separate queries against same `Donation::whereBetween` base. PHP loop fills missing days. | Same harness. | Combine status + day in single grouped query; cap window or push date-fill to SQL `generate_series`. |
| **P4** | `MapController::index` | Reads geometries; geographic bbox filter; potential N+1 on category eager-load. | Probe `/api/donations/map?bbox=…` with `Telescope` or `Log::info(DB::getQueryLog())`. | Eager-load `category`; add composite index `donations(status, latitude, longitude)` if not present. |
| **P5** | `DonationController::index` | Paginated list; possibly missing eager-load of `category` and `user` → N+1 in JSON serialization. | Same harness. | `with(['category','user'])`. |
| **P6** | `fe-nextjs/hooks/useDonationMap.ts:70-85` | Promise chain without abort signal; on bbox change the previous request still resolves and may overwrite state with stale data. | Open devtools network; pan map fast. | Adopt `AbortController`; cancel in-flight on dep change. |
| **P7** | `tests/Feature/DonationMapTest.php:148` | 61 sequential HTTP requests in one rate-limit test. | `php artisan test --filter=test_map_endpoint_is_rate_limited` baseline. | Use `RateLimiter` trait or `attemptOne` loop with `Http::fake` — likely 10–30s saved per CI run. |

No "feels slow" entries. Every item above has a measurable harness.

---

## 4. ARCHITECTURE / MAINTAINABILITY SMELLS

| ID | Smell | Where |
|----|-------|-------|
| **A1** | Fat controllers — most controllers call Eloquent directly, only 2 services exist. | `DonationController`, `ClaimController`, `ModerationController`, `AdminDashboardController`. |
| **A2** | No central exception handler — exception messages bleed to clients in some controllers. | `AuthController.php:95`, default Laravel handler everywhere else. |
| **A3** | Hardcoded backend URL fallback in production code path. | `fe-nextjs/app/api/reset-password/route.ts:3` (`const BACKEND_URL = "http://localhost:8000/api"`). |
| **A4** | Client-side admin gate is bypassable; protection only at API layer. | `fe-nextjs/app/admin/components/admin-auth-gate.tsx`. |
| **A5** | `HasAuditTrail` trait runs on every model mutation; no retention; no archival. | `be-laravel/app/Traits/HasAuditTrail.php`. |
| **A6** | Two dashboard controllers with overlapping intent but different shapes; route paths differ only by `/summary`. | `Admin/DashboardController`, `Admin/AdminDashboardController`. |
| **A7** | `composer dev` script boots `queue:listen` when no jobs are dispatched. | `be-laravel/composer.json:42-45`. |
| **A8** | No CI workflow. | Absent `.github/workflows/`. |
| **A9** | `lib/supabase.ts` initializes a Supabase client used only by `app/api/admin/migrate-user/route.ts` — a one-off migration endpoint. Risk: stale, may run in prod paths. | `fe-nextjs/lib/supabase.ts`, `fe-nextjs/app/api/admin/migrate-user/route.ts`. |
| **A10** | Validation rule duplication between controllers and service factories. | (See D4.) |
| **A11** | `routes/api.php` mounts admin under two different middleware groups — see B4/D2. | `routes/api.php:52, 84`. |
| **A12** | Indonesian/English mixed strings in user-facing FE. | `app/bagipangan/components/sections/navbar.tsx:188`, `lib/api.ts:89`. |

---

## 5. Ranking (impact × confidence) / risk — TOP 10 IN SCOPE

Selection criteria: P0/P1 first, then provable performance wins, then dedup that retires real complexity.

| Rank | ID | Class | Title | Why now |
|------|----|-------|-------|---------|
| 1 | **B1** | Bug | Stop returning `debug_token` from forgot-password | P0 account-takeover vector. Tiny diff. |
| 2 | **B2** | Bug | Sanitize `.env.example` (placeholder, rotation flagged) | P0 credential leak; trivial fix; flag rotation to user. |
| 3 | **B3** | Bug | Strip exception message from reset error response | P1 info disclosure; fixed with B1 in same controller pass. |
| 4 | **B13** | Bug | Loosen `composer.json` PHP constraint to `^8.2` and re-run tests | Unblocks the entire BE test suite locally. Cheap. |
| 5 | **B4 / D2 / A11** | Bug + Dedup | Unify the two `admin` route groups in `routes/api.php` | Removes a real foot-gun; clarifies admin surface. |
| 6 | **D5 / B9** | Dedup | Delete dead `AuthController::login` | Single-file deletion + grep guard. |
| 7 | **D1 / B6** | Dedup | Resolve `password_reset_tokens` table name once | Removes two `Schema::hasTable` calls; clarifies AuthController. |
| 8 | **P1 / B7** | Perf | Push avg-claim-minutes to SQL | Single fix; measurable. |
| 9 | **P2 / B10** | Perf | Combine KPI counts into one `selectRaw` | Single fix; same controller as #8. |
| 10 | **B5** | Bug | Fix the 2 TS errors in `DonationMapPageContent.tsx:31` | Keeps the diagnostic baseline at 0 by the end of the refactor. |

### Just-outside-scope (BACKLOG)

- **A6 / D6** — Rename `DashboardController` → `DashboardSummaryController`; confirm no FE call sites by exhaustive grep before doing it. Defer to a polish pass.
- **D4 / A10** — Migrate inline validation to `FormRequest` across donation controllers. Scope creep risk; let's land the perf+bug fixes first.
- **B8 / P3** — `AdminDashboardController` day-fill loop; only matters if windows widen beyond ~365 days.
- **P4 / P5** — Eager-load on donation list and map endpoints. Requires DB profiling; pull into a follow-up perf pass if dashboard wins prove the baseline harness works.
- **P6 / B11** — `useDonationMap` AbortController. FE-only; deferred.
- **P7** — Rate-limit test refactor; only matters once tests can actually run.
- **B12 / A5** — `HasAuditTrail` actor capture + retention.
- **A1** — Service-layer extraction across controllers. Large surface, low immediate ROI.
- **A2** — Central exception handler. Touches every controller; do once we have FE tests.
- **A3** — Replace hardcoded backend URL fallback with required env var.
- **A4** — Server-rendered admin route guard.
- **A7** — Drop `queue:listen` from `composer dev`.
- **A8** — Add `.github/workflows/ci.yml`.
- **A9** — Audit `migrate-user/route.ts` use; if one-off, remove.
- **A12** — Finish Indonesian localization.

---

## 6. Scope guarantees for Phase 3

The plan will:
- Touch only the files listed under "TOP 10 IN SCOPE."
- Recapture the diagnostic baseline at the end of every step (must stay ≤ 2 TS errors, target 0).
- Capture before/after numbers for items #8 and #9 (perf steps) using a tiny probe script saved at `.refactor/baseline/dashboard_probe.php`.
- Ship as ≥10 atomic commits (one per item).

---

## STOP — awaiting confirmation before Phase 3

Per the refactor prompt, Phase 3 (`REFACTOR-PLAN.md`) does not start until you say "go." If anything in the resolved Q1–Q12 table at the top, or in the TOP 10, is wrong — flag it and I'll re-scope. Otherwise reply "go" or "go with edits: …" and I'll write the plan.
