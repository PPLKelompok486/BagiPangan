# BagiPangan Architecture Document

**Version:** 1.0  
**Date:** 2026-04-27  
**Audience:** Backend/Frontend/DevOps engineers implementing and operating BagiPangan

---

## 1) System Overview

### 1.1 Product goals
BagiPangan is a food donation platform with two primary user roles and one operational role:
- `donatur`: creates donation entries.
- `penerima`: receives/claims donations.
- `admin`: moderates donations and manages users.

Current MVP focuses on:
1. User registration.
2. Admin dashboard KPI summary + activity feed.
3. Donation moderation (approve/reject).
4. User management (list/update role/active state).
5. CSV report export.

### 1.2 Non-functional goals
- **Reliable moderation path**: admin actions must be auditable.
- **Operationally simple**: monorepo, two deployable apps (Next.js + Laravel).
- **Low-latency admin dashboard** under normal traffic.
- **Safe-by-default access**: admin endpoints protected by auth + role checks.

### 1.3 Hard constraints (from current codebase)
- Backend: Laravel 13, PHP 8.5 (`be-laravel/composer.json`).
- Frontend: Next.js 16 App Router, React 19 (`fe-nextjs/package.json`).
- Auth guard for admin APIs uses Laravel `web` session guard (`auth:web`).
- Session auth flow (login/session issuance) is assumed from another stream; this module consumes it.
- Current CORS is configured with `supports_credentials=false`; cross-origin cookie-based direct FE->BE calls are constrained. Current FE avoids this by proxying via Next Route Handlers.

---

## 2) High-Level Architecture

## 2.1 Runtime components
1. **Next.js Frontend (`fe-nextjs`)**
   - Renders pages (`/admin`, `/register`, landing pages).
   - Exposes internal API proxy endpoints under `/api/**`.
2. **Next.js API Proxy Layer**
   - Route handlers forward requests to Laravel backend.
   - Forwards request cookies for session continuity on admin requests.
3. **Laravel API Backend (`be-laravel`)**
   - Core domain logic, persistence, authorization checks.
   - Admin endpoints and registration endpoint.
4. **PostgreSQL database (or compatible SQL DB)**
   - Stores users, donations, claims, activity logs, sessions.
5. **Optional queue/cache services (future scale stage)**
   - Laravel supports DB/Redis queue and cache drivers; currently defaults are DB-backed.

## 2.2 High-level request path
1. Browser hits Next page/API route.
2. Next API route calls Laravel API endpoint.
3. Laravel authenticates (`auth:web`), checks role (`admin` middleware), runs controller logic.
4. Laravel reads/writes DB and returns JSON/CSV.
5. Next returns normalized response to browser.

## 2.3 Why this split
- Keeps backend domain logic centralized in Laravel.
- Avoids exposing backend origin directly to browser for each feature.
- Allows FE to evolve independently (BFF-like proxy behavior) without changing backend contracts.

---

## 3) Component-Level Breakdown

## 3.1 Frontend modules (Next.js)

### A. Admin UI module
- Path: `app/admin/**`
- Responsibilities:
  - Render KPI cards, activity feed, user table.
  - Fetch data from internal routes (`/api/admin/dashboard/summary`, `/api/admin/users`).
  - Handle loading/fallback states.

### B. Registration UI module
- Path: `app/register/**`
- Responsibilities:
  - Multi-step client-side registration form UX.
  - Local validation before submit.
  - Calls `/api/register` (proxy to Laravel `/api/register`).

### C. Next API proxy module
- Path: `app/api/**`
- Responsibilities:
  - Forward request/response between browser and Laravel.
  - Forward `cookie` header for admin routes.
  - Keep backend base URL configurable (`BAGIPANGAN_BACKEND_URL`).

## 3.2 Backend modules (Laravel)

### A. AuthZ middleware
- `EnsureAdminRole`
- Responsibilities:
  - Block unauthenticated requests (401).
  - Block non-admin requests (403).
  - Block deactivated users (403).

### B. Registration service + controller
- `RegisterService`, `RegisterController`
- Responsibilities:
  - Validate registration payload.
  - Create user with role/profile fields.
  - Return structured success/error response.

### C. Admin Dashboard controller
- `DashboardController@summary`
- Responsibilities:
  - Aggregate KPI metrics.
  - Fetch latest activity logs (limit 8).

### D. Moderation controller
- `ModerationController`
- Responsibilities:
  - Queue listing with status filter + pagination.
  - Approve/reject donation.
  - Write audit events to `activity_logs`.

### E. User management controller
- `UserManagementController`
- Responsibilities:
  - Paginated searchable user listing.
  - Update role/admin/active state.
  - Manage `deactivated_at` consistency.
  - Write audit log for updates.

### F. Reporting controller
- `ReportController@exportCsv`
- Responsibilities:
  - Stream donation report as CSV.
  - Use chunked DB reads (`chunk(200)`) to avoid large memory spikes.

## 3.3 Data model layer (Eloquent)
- `User`, `Donation`, `Claim`, `DonationCategory`, `ActivityLog`
- Responsibilities:
  - Declare relations/casts/constants for status enums.
  - Provide query helpers (`User::scopeActive`, `isAdmin()`).

---

## 4) Data Flow (Key Features)

## 4.1 Admin Dashboard load
1. Browser opens `/admin`.
2. Client component runs `getDashboardData()` + `getUsersData()` in parallel.
3. Next API proxy forwards request + cookies to Laravel endpoints.
4. Laravel runs `auth:web` then `admin` middleware.
5. `DashboardController@summary` computes KPIs and activity feed from DB.
6. `UserManagementController@index` returns paginated user list.
7. FE renders cards/feed/table.

## 4.2 Donation moderation (approve/reject)
1. Admin requests moderation queue (pending by default).
2. Admin selects item and triggers approve/reject.
3. Laravel updates donation status and moderation metadata (`approved_by`, `approved_at`, optional reject reason).
4. Laravel inserts `activity_logs` row (`donation.approved` or `donation.rejected`).
5. FE refreshes queue and activity feed to reflect latest state.

## 4.3 User management update
1. Admin opens user list (optional `search` query).
2. Admin submits update (`role`, `is_admin`, `is_active`).
3. Laravel validates payload and updates row.
4. If deactivated, sets `deactivated_at`; if reactivated, clears it.
5. Laravel writes `activity_logs` with metadata of changed flags.
6. FE refreshes table.

## 4.4 CSV export
1. Admin requests `/api/admin/reports/export/csv` from frontend.
2. Next proxy calls Laravel export endpoint with session cookie.
3. Laravel streams CSV line-by-line/chunk-by-chunk.
4. Browser receives downloadable file.

## 4.5 Registration flow
1. User completes step 1 (`/register`).
2. Step data is persisted client-side temporarily.
3. Final submit goes to `/api/register` (Next proxy).
4. Proxy forwards to Laravel `/api/register`.
5. Laravel validates + inserts `users` row.
6. Response returned to FE.

---

## 5) Database Design

## 5.1 Core tables

### `users`
- Key fields: `id`, `role`, `is_admin`, `is_active`, `deactivated_at`, `name`, `email`, `password`, profile fields.
- Reasoning:
  - `role` captures business persona (`admin/donatur/penerima`).
  - `is_admin` supports admin-flag path (currently also checked by `isAdmin()`).
  - `is_active` + `deactivated_at` supports operational suspension without deletion.

### `donation_categories`
- Key fields: `id`, `name`, `slug`, `description`, `is_active`.
- Reasoning:
  - Normalized category metadata and optional deactivation.

### `donations`
- FK: `user_id -> users.id`, `category_id -> donation_categories.id`, `approved_by -> users.id`.
- Key fields: title/description/location/time windows/portion_count/status/rejected_reason.
- Indexes: `(status, created_at)`, `location_city`.
- Reasoning:
  - Index supports moderation queue filtering by status + recency.
  - Stores moderation decisions in same row for fast reads.

### `claims`
- FK: `donation_id -> donations.id`, `receiver_id -> users.id`.
- Key fields: status, cancel_reason, proof_image_url, claimed_at, completed_at.
- Index: `(status, created_at)`.
- Reasoning:
  - Supports lifecycle tracking and duration KPI calculation.

### `activity_logs`
- FK: `actor_user_id -> users.id` (nullable).
- Key fields: `action`, `entity_type`, `entity_id`, `metadata (json)`.
- Indexes: `(entity_type, entity_id)`, `(action, created_at)`.
- Reasoning:
  - Generic append-only operational audit model.
  - JSON metadata keeps schema flexible for heterogeneous actions.

### Session/auth support tables
- `sessions`, `password_reset_tokens`.
- Reasoning:
  - Required by `web` session guard and account lifecycle operations.

## 5.2 Relationship summary
- `users (1) -> (N) donations`
- `users (1) -> (N) claims` (as receiver)
- `users (1) -> (N) donations approved` (as admin approver)
- `donation_categories (1) -> (N) donations`
- `donations (1) -> (N) claims`
- `users (1) -> (N) activity_logs` (actor)

## 5.3 Database decisions and rationale
- Kept transactional entities relational for strong consistency.
- Used enums/status strings for explicit finite workflows.
- Chosen append-only activity log for auditability and incident tracing.

---

## 6) API Design

## 6.1 Existing backend endpoints (Laravel)

### Public
- `POST /api/register`
  - Purpose: create a new user with role/profile fields.

### Admin (requires `auth:web` + `admin` middleware)
- `GET /api/admin/dashboard/summary`
  - Purpose: return KPI snapshot + latest activity.
- `GET /api/admin/moderation/queue?status=pending`
  - Purpose: paginated moderation queue.
- `PATCH /api/admin/moderation/{donation}/approve`
  - Purpose: approve pending donation.
- `PATCH /api/admin/moderation/{donation}/reject`
  - Purpose: reject donation with reason.
- `GET /api/admin/users?search=...`
  - Purpose: paginated user listing.
- `PATCH /api/admin/users/{user}`
  - Purpose: update role/admin/active flags.
- `GET /api/admin/reports/export/csv`
  - Purpose: stream donation CSV report.

## 6.2 Response design guidelines
Implementers should keep these consistent across all endpoints:
- Success JSON: `{ message, data }`.
- Validation errors: `{ message, errors }` with HTTP 422.
- Unauthorized: HTTP 401.
- Forbidden: HTTP 403.
- Server error: HTTP 500 with safe generic message in production.

## 6.3 Recommended near-term additions
1. `GET /api/admin/moderation/{donation}` for detail panel.
2. Idempotency guard on moderation actions (ignore repeated approve/reject).
3. Explicit pagination metadata contract (total, per_page, current_page, next_page_url).
4. Versioning path for future breaking changes (`/api/v1/...`).

---

## 7) Scaling Strategy

## 7.1 Traffic growth assumptions
- Stage 1: low to moderate read-heavy admin traffic.
- Stage 2: growth in donation/claim writes and dashboard reads.
- Stage 3: regional growth requiring stronger isolation and async processing.

## 7.2 Horizontal scaling plan

### App layer
- **Next.js**: run stateless replicas behind load balancer.
- **Laravel**: run stateless API replicas behind load balancer.

### Session strategy
- Since admin uses `web` sessions, use a **shared session store** (database or Redis) across replicas.
- For higher scale, migrate from DB sessions to Redis sessions.

### Database scaling
1. Add/verify indexes for dominant query paths:
   - `donations(status, created_at)` already present.
   - `users(email)` already unique.
   - Add `users(is_active, role)` when admin filtering grows.
2. Introduce read-replicas for dashboard/reporting reads.
3. Keep all write paths on primary with transactions for moderation updates.

### Async workloads
- Move expensive non-critical work to queue workers:
  - CSV generation for large exports.
  - Notification dispatch.
  - Metrics rollups.

### Caching
- Cache dashboard summary for short TTL (e.g., 15–60s) to smooth spikes.
- Invalidate cache after moderation/user updates.

---

## 8) Failure Scenarios and Handling

## 8.1 Backend unavailable
- Symptom: Next proxy returns 500 from catch block.
- Current behavior: UI falls back to empty states.
- Required handling:
  - Show explicit “service unavailable” banner.
  - Log structured error with correlation ID.
  - Retry with capped exponential backoff on reads.

## 8.2 Database outage/slow queries
- Symptom: Laravel endpoints timeout/fail.
- Handling:
  - Set DB connection + request timeouts.
  - Return 503 for transient DB failures.
  - Circuit-break repeated failing endpoints at proxy layer (optional).

## 8.3 Partial update during moderation
- Risk: donation status changed but activity log not written.
- Handling:
  - Wrap donation update + activity insert in DB transaction.
  - Alert on transaction rollback rates.

## 8.4 Duplicate admin actions
- Risk: repeated approve/reject clicks.
- Handling:
  - Enforce state transition checks (`pending -> approved/rejected` only).
  - Return 409 Conflict on invalid transition.

## 8.5 Large CSV export memory pressure
- Current mitigation: chunked reads and streamed response.
- Additional handling:
  - Add hard max export time window/row cap.
  - Move to async export + downloadable artifact for large datasets.

---

## 9) Security Considerations

## 9.1 Authentication and authorization
- Admin routes protected by `auth:web` and `EnsureAdminRole`.
- `is_active` check blocks deactivated admins from API access.

## 9.2 Session/cookie security
- In production:
  - `SESSION_SECURE_COOKIE=true`
  - `SESSION_HTTP_ONLY=true` (already default)
  - `same_site=lax` or `strict` unless cross-site embedding is required.
- If frontend and backend are on different origins with cookies:
  - align CORS + credential settings carefully.
  - Currently backend has `supports_credentials=false`; this is incompatible with browser credentialed CORS.

## 9.3 Input and output hardening
- Validate all mutation payloads (already done in key controllers).
- Sanitize rejection reason and all user-generated text before rendering.
- Avoid exposing internal exception messages in production responses.

## 9.4 Abuse prevention
- Add rate limiting on:
  - `POST /api/register`
  - admin mutation endpoints.
- Add audit records for all privileged actions (already partly implemented).

## 9.5 Secrets and environment
- Never hardcode backend URLs in route handlers for production.
- Use env vars for backend URL, DB creds, app keys.
- Restrict production `.env` access and rotate credentials periodically.

---

## 10) Deployment Architecture (CI/CD + Environments)

## 10.1 Environment topology
- **Local**: developer machine, `npm run dev` at repo root.
- **Staging**: mirror production topology, anonymized seed-like data.
- **Production**: multi-instance FE+BE, managed DB, centralized logs.

## 10.2 Target production topology
1. CDN + HTTPS termination.
2. Next.js service (SSR/API routes).
3. Laravel API service.
4. PostgreSQL primary (+ optional read replica).
5. Redis (sessions/cache/queue) as scale phase.
6. Queue worker service for async jobs.

## 10.3 CI pipeline (recommended)
On each PR:
1. Install deps for both apps.
2. Frontend checks:
   - `npm --prefix fe-nextjs run lint`
   - `npm --prefix fe-nextjs run build`
3. Backend checks:
   - `composer --working-dir be-laravel install --no-interaction`
   - `php be-laravel/artisan test`
4. Optional contract tests between Next proxies and Laravel endpoints.

On merge to main:
1. Build artifacts/containers.
2. Deploy staging.
3. Run smoke tests (register, admin summary auth checks).
4. Manual or automated promotion to production.
5. Run migrations with zero-downtime strategy.

## 10.4 Release safety controls
- Blue/green or rolling deployment.
- Backward-compatible DB migrations first.
- Feature flags for new admin modules.
- Automatic rollback on health check failures.

---

## 11) Trade-offs and Decision Rationale

1. **Monorepo (FE + BE) vs split repos**
   - Chosen: monorepo for coordination speed and simpler onboarding.
   - Trade-off: larger repo and mixed toolchains in one workspace.

2. **Session auth (`web` guard) for admin APIs vs token/JWT**
   - Chosen: session guard integrates naturally with Laravel.
   - Trade-off: shared session store and cookie handling complexity for multi-origin deployments.

3. **Next API proxy (BFF-lite) vs direct browser-to-Laravel calls**
   - Chosen: proxy shields browser from backend origin details and simplifies cookie forwarding strategy.
   - Trade-off: extra hop and duplicated error handling layer.

4. **Single `activity_logs` polymorphic table vs typed audit tables**
   - Chosen: flexible, fast to evolve.
   - Trade-off: weaker schema guarantees, requires disciplined metadata conventions.

5. **Computed dashboard KPIs on demand vs pre-aggregated analytics tables**
   - Chosen: on-demand for MVP simplicity.
   - Trade-off: may become expensive under heavy traffic; cache/materialized aggregates needed later.

6. **Synchronous CSV streaming vs async report generation**
   - Chosen: synchronous streaming for MVP implementation simplicity.
   - Trade-off: long requests under large datasets; eventually move to async job + object storage download.

---

## Implementation Priorities (next 2 sprints)
1. Add transaction boundaries to moderation and user update + activity log writes.
2. Finalize API contracts for pagination/error envelope consistency.
3. Add missing admin moderation UI + proxy routes in frontend.
4. Introduce rate limiting and production-safe error responses.
5. Set up CI with FE build/lint and BE tests on every PR.
6. Prepare Redis-backed session/cache for horizontal scaling readiness.

---

## Appendix A: Current API Contract Snapshot

### Dashboard summary (`GET /api/admin/dashboard/summary`)
Returns:
- `data.kpis.total_donations`
- `data.kpis.completion_rate`
- `data.kpis.total_portions`
- `data.kpis.avg_claim_minutes`
- `data.activity_feed[]` (action/entity/metadata/timestamp)

### Users index (`GET /api/admin/users`)
Returns Laravel paginator object in `data` with `data[]` array entries containing:
- `id`, `name`, `email`, `role`, `is_admin`, `is_active`, `city`, `created_at`.

### CSV report (`GET /api/admin/reports/export/csv`)
Returns streamed CSV with header columns:
- `ID`, `Title`, `Status`, `City`, `Portions`, `Created At`.

---

## Appendix B: Open Architectural Risks

1. Role model currently supports both `role=admin` and `is_admin=true`; this duality can diverge.
   - Mitigation: choose one source of truth and migrate.
2. `supports_credentials=false` in CORS may conflict with future direct cross-origin auth flows.
   - Mitigation: keep BFF proxy pattern, or revise CORS/session settings consistently.
3. Some FE fallback behavior can hide backend outages.
   - Mitigation: explicit error UI + observability signals.

