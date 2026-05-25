# REFACTOR-PLAN.md — Phase 3 Plan

Phase 3 deliverable. Covers the 10 in-scope items ranked in `REFACTOR-MAP.md` §5. Tests-first; dedup before structural; perf last. Each step is atomic and independently revertable.

Date: 2026-05-22.

---

## Pre-step: clean the working tree

Before S1: commit the 27 staged 2026-05-17 security/UX fixes as **`chore: stage 2026-05-17 security & UX fixes`**. They are already in the index; no edits needed. This makes every refactor diff measurable against a clean baseline.

If the user prefers to ship the staged batch as a separate PR first, pause here.

---

## Sequencing rationale

```
S1 (composer PHP constraint) ──► unblocks tests for S2…S9
S2..S5 AuthController cleanup ──┐
S6 .env.example                 ├─► all on different files; can run in series safely
S7 routes/api.php unify ────────┘
S8..S9 DashboardController perf ─► same file → sequential
S10 TS error fix ────────────────► independent at any time
```

Parallel-safe (could be done in parallel sessions if needed): {S6}, {S10}, and {S7} are independent of each other and of {S2…S5, S8, S9}. But sequential execution is preferred for clean commit history.

---

## Common verification harness

Re-run after every step:

1. **Backend tests**: `cd be-laravel && composer test`. After S1, this should boot. Until then, expect the autoload ParseError baseline.
2. **TS diagnostics**: `mcp__ide__getDiagnostics` — baseline is 2 errors in `fe-nextjs/components/map/DonationMapPageContent.tsx:31`. Must not increase. S10 brings it to 0.
3. **No new lint errors**: `npm --prefix fe-nextjs run lint` — capture baseline before S1, never exceed.
4. **Perf probe (S8, S9 only)**: tiny script at `.refactor/baseline/dashboard_probe.php` that times `DashboardController::summary` against the same DB state. Capture once before S8, again after S8, again after S9.

---

## Steps

### S1 — Loosen `composer.json` PHP constraint to `^8.2`

| | |
|---|---|
| **Closes** | B13 |
| **Files** | `be-laravel/composer.json` |
| **What changes** | Line 9: `"php": "^8.5"` → `"php": "^8.2"`. |
| **Why** | Local PHP is 8.2.30; the constraint is the only thing preventing `composer install`/`composer test` from running. After this, the test suite either runs or surfaces the real PHP-8.3-typed-constant issue documented in `LEARN.md` §8 (in which case we pivot and bump local PHP). Either way, S1 is the unblocker. |
| **Verification** | `cd be-laravel && composer test` must produce a real test run (pass or fail per-test), not the autoload ParseError. Capture the pass/fail count as the post-S1 test baseline; all subsequent steps must keep this number ≥ baseline. |
| **Rollback** | Revert one line. |
| **Risk** | Low. |
| **Est diff** | ~1 line. |

> **If S1's test run reveals the vendor lock truly needs PHP 8.3**: stop the refactor and request the user upgrade local PHP. Do not "fix" by editing vendor.

---

### S2 — Stop returning `debug_token` from `forgot-password`

| | |
|---|---|
| **Closes** | B1 |
| **Files** | `be-laravel/app/Http/Controllers/AuthController.php`, `be-laravel/tests/Feature/Auth/ForgotPasswordTest.php` (new). |
| **What changes** | Remove the `'debug_token' => $token` key from the 200 JSON response (`AuthController.php:57`). Response becomes `{ message: 'Link reset password telah dibuat.' }`. Update message — drop "(Simulasi)". |
| **RED test** | New `tests/Feature/Auth/ForgotPasswordTest.php`: `test_forgot_password_does_not_return_token()` — POST `/api/forgot-password` with a seeded user, assert response JSON does NOT contain key `debug_token` and assert a row exists in `password_reset_tokens`. |
| **GREEN** | Apply the deletion. |
| **Why** | P0 account-takeover vector. |
| **Rollback** | One-line revert + delete the new test. |
| **Risk** | Medium — there may be a dev/QA flow that depends on `debug_token`. Audit with `grep -r "debug_token" .` before merging; if any FE/page consumes it, file a follow-up to wire a proper email channel. |
| **Est diff** | ~5 lines source + ~30 lines test. |

---

### S3 — Strip exception message from reset-password 500 response

| | |
|---|---|
| **Closes** | B3 |
| **Files** | `be-laravel/app/Http/Controllers/AuthController.php`, `be-laravel/tests/Feature/Auth/ResetPasswordTest.php` (new). |
| **What changes** | `AuthController.php:95` — change `'Terjadi kesalahan server: ' . $e->getMessage()` to `'Terjadi kesalahan server.'`. Add `Log::error('reset_password failed', ['exception' => $e]);` so we don't lose the signal. |
| **RED test** | `test_reset_password_500_does_not_leak_exception_message()` — Mock `User::save` to throw `RuntimeException('SECRET DETAIL')`, hit the endpoint, assert 500 response body does NOT contain `SECRET DETAIL`. |
| **GREEN** | Apply the change. |
| **Why** | P1 info disclosure. |
| **Rollback** | One-line revert. |
| **Risk** | Low. |
| **Est diff** | ~3 lines source + ~30 lines test. |

---

### S4 — Delete dead `AuthController::login`

| | |
|---|---|
| **Closes** | D5 / B9 |
| **Files** | `be-laravel/app/Http/Controllers/AuthController.php`. |
| **What changes** | Delete `AuthController::login` (lines 14–33). Routes wire `/api/login` to `LoginController::login`; this method is not referenced. |
| **Pre-check** | Before deletion: `grep -r "AuthController::class, 'login'" be-laravel/` and `grep -r "[AuthController::class, 'login']" be-laravel/` and `grep -r "AuthController.*login" be-laravel/routes/` — all must return empty. |
| **RED test** | No new test. The pre-check IS the test. Existing `tests/Feature/...` must still pass. |
| **GREEN** | Delete the method. |
| **Why** | Dead code that duplicates `LoginController::login` without token issuance — a future maintainer could wire it by mistake. |
| **Rollback** | Recover from git. |
| **Risk** | Low (proven by grep). |
| **Est diff** | -20 lines. |

---

### S5 — Single source of truth for `password_reset_tokens` table name

| | |
|---|---|
| **Closes** | D1 / B6 |
| **Files** | `be-laravel/app/Http/Controllers/AuthController.php`. |
| **What changes** | Add a private constant `private const RESET_TABLE = 'password_reset_tokens';` and remove both `Schema::hasTable(...) ? ... : ...` ternaries (`AuthController.php:48`, `:70`). The legacy `password_resets` branch is dead — Laravel hasn't shipped that name since 8.x and no migration in `database/migrations/` creates it. |
| **Pre-check** | `grep -r "password_resets" be-laravel/ --include="*.php"` must show only the two ternary lines being removed. If anything else references it, scope creeps and we bail. |
| **RED test** | Extend `tests/Feature/Auth/ResetPasswordTest.php` from S3 — `test_reset_password_succeeds_against_password_reset_tokens_table()` — happy-path flow that asserts the token row was written/read using the canonical name. |
| **GREEN** | Apply the constant. |
| **Why** | Removes two information-schema queries per password-reset call and removes a dead branch that confuses maintainers. |
| **Rollback** | Restore the ternaries. |
| **Risk** | Low (assertion guarded). |
| **Est diff** | -8 lines source + ~20 lines test. |

---

### S6 — Sanitize `.env.example`

| | |
|---|---|
| **Closes** | B2 |
| **Files** | `be-laravel/.env.example`. |
| **What changes** | Replace lines 24–28 (Supabase real credentials) with placeholders: `DB_HOST=...`, `DB_USERNAME=...`, `DB_PASSWORD=...`. Add an inline comment block: `# Copy this to .env and fill from your team's secrets manager. NEVER commit real credentials here.` |
| **Pre-check** | None — it's a non-runtime template file. |
| **RED test** | Shell-level guard added to `composer.json` `scripts.test` is overkill; instead add a one-line `tests/Feature/EnvExampleHasNoSecretsTest.php` (PHPUnit) that reads `.env.example` and asserts no value matches the leaked password literal or the Supabase pooler host. |
| **GREEN** | Edit `.env.example`. |
| **OPERATIONAL ACTION (user)** | After merge, rotate the Supabase password and update the team secrets store. The plan flags this; we cannot do it. |
| **Rollback** | Recover from git. |
| **Risk** | Low. |
| **Est diff** | ~6 lines source + ~15 lines test. |

---

### S7 — Unify the two admin route groups in `routes/api.php`

| | |
|---|---|
| **Closes** | B4 / D2 / A11 |
| **Files** | `be-laravel/routes/api.php`, possibly `bootstrap/app.php` (middleware aliases). One new feature test. |
| **What changes** | Merge `routes/api.php:52-77` (web/session block) and `routes/api.php:84-88` (token.auth block) into a single `Route::prefix('admin')` group. Apply `['web', 'auth:web', 'admin']` to the entire admin surface — admin login is session-based per `AdminAuthController`, so session is the source of truth. Move `AdminDashboardController@index`, `FundDonationController@index` (admin monitoring), and `ReportController@analytics` into the unified group. |
| **Pre-check** | Verify FE call sites for `/admin/dashboard` and `/admin/fund-donations/monitoring` and `/admin/reports/analytics`. If any of these are called from FE with a Bearer token (not cookie), this step changes behavior and must include FE proxy adjustments. Grep `fe-nextjs/app/` for those paths first. **If FE uses Bearer for these**, escalate to the user before proceeding — we may instead need to keep token.auth and remove the web/auth:web block, going the other direction. |
| **RED test** | `tests/Feature/Admin/AdminRouteAuthTest.php`: assert (a) `GET /admin/dashboard` returns 401 without session, (b) returns 200 with valid admin session, (c) returns 403 for non-admin session, (d) `GET /admin/dashboard/summary` same three assertions. |
| **GREEN** | Apply the merge. |
| **Why** | Same `admin` prefix routed through two different middleware stacks is a foot-gun. One stack = one mental model. |
| **Rollback** | Recover the two `Route::prefix('admin')` blocks. |
| **Risk** | **Medium-High.** Changes admin auth surface. Mandatory FE pre-check above. |
| **Est diff** | ~30 lines `routes/api.php` (merged) + ~80 lines test. |

> If pre-check uncovers FE Bearer usage on the now-session-protected paths, **stop the step and re-plan**. Document the finding in this file under "Plan revisions" (per the prompt §4.4).

---

### S8 — Push avg-claim-minutes to SQL

| | |
|---|---|
| **Closes** | P1 / B7 |
| **Files** | `be-laravel/app/Http/Controllers/Admin/DashboardController.php`. Possibly `be-laravel/app/Services/DonationAnalyticsService.php` if we put the query there. |
| **What changes** | Replace `DashboardController.php:20-27` (PHP-side `->get()->avg(fn)`) with one SQL aggregate: `Claim::whereNotNull('claimed_at')->whereNotNull('completed_at')->selectRaw('AVG(EXTRACT(EPOCH FROM (completed_at - claimed_at)) / 60) as avg_minutes')->value('avg_minutes')`. Cast result to `int` matching current behavior. Postgres-specific SQL (`EXTRACT(EPOCH FROM …)`) is acceptable — the project uses Postgres exclusively. |
| **Perf baseline** | Run `.refactor/baseline/dashboard_probe.php` against current state (3 warm runs, take median). Record in this file under "Plan revisions" once we have the number. |
| **RED test** | Extend `tests/Feature/Admin/DashboardSummaryTest.php` (new): seed 5 claims with known `claimed_at`/`completed_at` deltas (e.g., 10, 20, 30, 40, 50 minutes); assert `kpis.avg_claim_minutes == 30`. |
| **GREEN** | Apply the SQL change. |
| **Post-perf** | Re-run probe. Win must be > 1ms (i.e., faster, not slower) AND functional test must pass. If win is below noise floor, still acceptable — the change pays back as `claims` grows. |
| **Rollback** | Recover the PHP-side loop. |
| **Risk** | Low-Medium — Postgres-specific SQL; if the project ever supports SQLite/MySQL this needs a driver shim. We accept this; `phpunit.xml` targets Postgres. |
| **Est diff** | ~8 lines source + ~40 lines test. |

---

### S9 — Combine KPI counts into a single grouped query

| | |
|---|---|
| **Closes** | P2 / B10 |
| **Files** | `be-laravel/app/Http/Controllers/Admin/DashboardController.php`. |
| **What changes** | Replace `DashboardController.php:14-18` (two `Donation::count()` calls + portion sum) with `Donation::selectRaw('COUNT(*) as total, COUNT(*) FILTER (WHERE status = ?) as completed, COALESCE(SUM(portion_count), 0) as portions', [Donation::STATUS_COMPLETED])->first()`. Derive `completion_rate` from the single row. |
| **Perf baseline** | Same probe as S8. Capture before & after. |
| **RED test** | Extend `tests/Feature/Admin/DashboardSummaryTest.php`: seed 4 donations (1 completed, 2 approved, 1 cancelled) with portions [3, 5, 7, 11]; assert `kpis.total_donations == 4`, `kpis.completion_rate == 25`, `kpis.total_portions == 26`. |
| **GREEN** | Apply the consolidation. |
| **Rollback** | Recover the two `count()` calls + `sum()`. |
| **Risk** | Low (semantic equivalence via test). |
| **Est diff** | ~10 lines source + ~30 lines test (extends S8's file). |

---

### S10 — Fix the 2 TS errors in `DonationMapPageContent.tsx:31`

| | |
|---|---|
| **Closes** | B5 |
| **Files** | `fe-nextjs/components/map/DonationMapPageContent.tsx`. Possibly the API response type in `lib/donations.ts` or wherever `CategoryOption` is defined. |
| **What changes** | Read the file (Phase 4 task — not now). The TS error signals that the `categories` source is a union `CategoryOption[] | { data?: CategoryOption[] }` and line 31 accesses `.data` on the union. Two narrowing options: (a) coerce at boundary with a type guard `const list = Array.isArray(raw) ? raw : raw.data ?? [];`, (b) tighten the response type upstream. Prefer (a) for least surface area. |
| **Pre-check** | Run `mcp__ide__getDiagnostics` and confirm both errors still on line 31 (they were as of Phase 1). |
| **RED test** | None (no FE runner). Diagnostic count IS the test. |
| **GREEN** | Apply the narrowing. |
| **Verification** | `mcp__ide__getDiagnostics` post-step shows 0 errors in that file. |
| **Rollback** | Recover the previous line. |
| **Risk** | Low. |
| **Est diff** | ~5 lines. |

---

## Step independence matrix

| | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 | S10 |
|---|----|----|----|----|----|----|----|----|----|----|
| Depends on | – | S1 | S1 | S1 | S1, S3 | S1 | S1 | S1 | S1, S8 | – |
| Shares file with | – | S3, S4, S5 | S2, S4, S5 | S2, S3, S5 | S2, S3, S4 | – | – | S9 | S8 | – |

- S10 is the only step that can land before S1 (no dependency on the BE test suite).
- S8 → S9 must be sequential (same file + same probe).
- S2–S5 must be sequential (same file, AuthController).
- S6 and S7 are independent of all but S1.

---

## Plan revisions (live)

- **2026-05-22, S1**: Target constraint changed from `^8.2` to **`^8.3`**. Vendor (`sebastian/environment Console.php:41`) uses PHP-8.3 typed class constants. Local PHP 8.2.30 still cannot run the test suite after this change — that requires a user-side PHP upgrade. S1's value is making `composer.json` honest about runtime requirements; the test-unblock benefit is conditional on the user's local PHP. All subsequent backend steps (S2–S9) will be verified by careful reading + targeted greps + writing-tests-but-not-running-them locally; tests will run in CI / on the upgraded environment.
- **2026-05-22, S2**: Original fix "delete `debug_token` from response" would break FE: `fe-nextjs/app/login/page.tsx:200` consumes it to auto-advance the simulated reset flow (no email channel is wired). Revised fix: gate `debug_token` behind `config('app.debug') === true`. In production the field is absent; FE degrades to a "check your email" message and the user cannot complete reset until email is wired. New backlog item: **B-EMAIL** — wire a real email channel for password reset. The vulnerability is closed because production never has `APP_DEBUG=true`.
- **2026-05-23, S4 pre-check uncovered**: `AuthController::forgotPassword` and `::resetPassword` are not wired in `routes/api.php` (line 18 imports `AuthController` but no `Route::*` uses it). The FE call to `/api/forgot-password` 404s on the Laravel side today. S2 and S3 patched code that no live caller could reach. Inserting **S2.5** before S4: wire the two routes so the FE flow becomes reachable and S2/S3 actually defend a live endpoint. Net diff stays tiny.
- **2026-05-23, S7 stop-gate hit**: The FE pre-check showed `apiFetch` always sends Bearer (Next proxy strips cookies — the May-17 leak fix). `app/admin/page.tsx:27` calls `apiFetch('/admin/dashboard/summary')`, but the backend route is on `auth:web` (session). That call is already 401-ing in production; the admin landing's summary panel is silently broken. Unifying under session would make this worse. Unifying under `token.auth` is the right direction but requires `AdminAuthController::login` to issue a Bearer token and the FE to consume it — too big for this refactor. **Skipping S7. Filed as backlog item `B-ADMIN-AUTH`: unify admin auth under `token.auth` (FE already wants Bearer; BE needs to follow).**

---

## STOP — awaiting "go"

Total estimated diff: ~110 LOC source + ~245 LOC test across 10 commits. Three commits (S2, S3, S5) add new test files; the rest extend existing or modify source only.

Per the refactor prompt, Phase 4 (execution) does not start until you approve this plan. Reply "go" or "go with edits: …".
