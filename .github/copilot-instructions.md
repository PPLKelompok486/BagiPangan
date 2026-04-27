# Copilot Instructions for BagiPangan

## Big picture architecture
- Monorepo with two apps:
  - `be-laravel/` = Laravel 13 API + domain logic + DB access.
  - `fe-nextjs/` = Next.js 16 App Router UI + API proxy routes.
- Key boundary: browser should call Next routes (`fe-nextjs/app/api/**`), then Next forwards to Laravel (`/api/**`).
- Admin flow is session-based: Laravel admin routes use `auth:web` + `admin` middleware (`be-laravel/routes/api.php`, `be-laravel/app/Http/Middleware/EnsureAdminRole.php`).
- Cookie forwarding pattern is required in admin proxy handlers (see `fe-nextjs/app/api/admin/dashboard/summary/route.ts`).

## Current domain modules (MVP)
- Registration: `POST /api/register` via `RegisterController` + `RegisterService`.
- Admin dashboard: KPI + activity feed (`DashboardController@summary`).
- Moderation: queue + approve/reject (`ModerationController`).
- User management: list/update users (`UserManagementController`).
- Reporting: streamed CSV export (`ReportController@exportCsv`).

## Developer workflows
- Run full stack from repo root: `npm run dev` (starts Next + Laravel concurrently).
- Frontend only: `npm run dev --prefix fe-nextjs`.
- Backend only: `cd be-laravel && php artisan serve`.
- Backend tests: `cd be-laravel && php artisan test` (uses sqlite in-memory via `phpunit.xml`).
- Frontend checks: `npm run lint --prefix fe-nextjs`, `npm run build --prefix fe-nextjs`.

## Project-specific coding patterns
- API response envelope is typically `{ message, data }`; validation uses `{ message, errors }` with 422.
- Admin mutation endpoints should write `activity_logs` entries (action/entity/metadata audit trail).
- Donation and claim state use string constants in models (`Donation::STATUS_*`, `Claim::STATUS_*`). Reuse constants; do not hardcode status literals in new backend logic.
- User admin access uses `User::isAdmin()` (`role === 'admin' || is_admin`). Preserve this behavior unless explicitly refactoring role model.
- Frontend admin page currently fetches via internal routes and handles fallback empty data states (`fe-nextjs/app/admin/page.tsx`).

## Integration and config notes
- Backend base URL for Next proxy routes: `BAGIPANGAN_BACKEND_URL` (fallback `http://localhost:8000`).
- CORS in Laravel currently has `supports_credentials=false` (`be-laravel/config/cors.php`), so direct credentialed browser calls to Laravel are not the default pattern.
- Session driver defaults to database (`be-laravel/config/session.php`), so shared session storage matters if scaling Laravel horizontally.

## Agent guardrails for this repo
- Check `fe-nextjs/AGENTS.md` before Next.js changes: this project warns Next 16 has breaking differences from older conventions.
- Prefer small, targeted edits; keep Indonesian user-facing copy style where existing endpoints/pages already use Bahasa Indonesia.
- When adding admin features, update both sides together:
  1) Laravel route/controller/service/model.
  2) Next proxy route under `fe-nextjs/app/api/admin/**`.
  3) Admin UI module under `fe-nextjs/app/admin/**`.
