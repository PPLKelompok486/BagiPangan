# TODO Codex Checkpoint

## Current Status

- Parsed `E:/Donlot/test_case_v4 (1).xlsx` into code-based manifest.
- Excel baseline: 80 total TC, 64 functional, 16 non-functional.
- Checked JIRA SCRUM through Composio MCP:
  - 56 visible issues.
  - 50 Done, 6 To Do.
  - Every ticket referenced by Excel exists in SCRUM.
- Added automated TC traceability/source-contract tests.
- Added account lockout implementation for `SCRUM-24`/`TC-FR03-04` and `TC-FR03-05`.
- Added GitHub Actions workflow for push/PR automated testing.
- Added documentation for the automated testing workflow.
- Frontend lint errors were fixed; lint now passes with 2 existing warnings.
- Frontend build now passes after fixing `fe-nextjs/app/admin/users/page.tsx`.

## Files Changed

- `.github/workflows/automated-testing.yml`
- `package.json`
- `tests/automated/test-case-manifest.json`
- `tests/automated/test-case-manifest.test.mjs`
- `tests/automated/source-contract.test.mjs`
- `documentation/AUTOMATED_TESTING_WORKFLOW.md`
- `be-laravel/app/Http/Controllers/LoginController.php`
- `be-laravel/tests/Feature/Auth/LoginControllerTest.php`
- `be-laravel/phpunit.xml`
- `fe-nextjs/app/bagipangan/components/sections/navbar.tsx`
- `fe-nextjs/app/donatur/layout.tsx`
- `fe-nextjs/app/login/page.tsx`
- `fe-nextjs/app/supabase-demo/page.tsx`
- `TODO_Codex.md`

## Last Commands and Results

- `npm run test:tc`
  - Passed: 165 tests/subtests, including 80 TC source-contract subtests.
- `php artisan test --filter=LoginControllerTest` with PostgreSQL env override
  - Passed: 3 tests, 19 assertions.
- `php artisan test` with PostgreSQL env override
  - Timed out after 185 seconds because remote DB test run is too slow.
- `npm run lint --prefix fe-nextjs`
  - Passed with 2 warnings in `fe-nextjs/utils/supabase/middleware.ts`.
- `npm run build` in `fe-nextjs`
  - Passed after fixing `URLSearchParams` typing in `fe-nextjs/app/admin/users/page.tsx`.
- `git status --short`
  - Shows Codex changes plus pre-existing unrelated changes/untracked folders:
    - `fe-nextjs/app/api/forgot-password/route.ts`
    - `fe-nextjs/app/api/profile/route.ts`
    - `fe-nextjs/app/api/register/route.ts`
    - `fe-nextjs/app/api/reset-password/route.ts`
    - `fe-nextjs/next.config.ts`
    - `deploy/`
    - `docs/`
    - `scripts/deploy/`

## Blockers / Notes

- Local PHP does not have `pdo_sqlite`, so local SQLite PHPUnit cannot run. CI installs `pdo_sqlite` through `shivammathur/setup-php`.
- Full local backend suite against remote PostgreSQL is too slow and timed out.
- `FR-12` notification TCs have no JIRA ticket in the workbook and repo documentation still marks FR-12 as not started. Manifest marks them as `documented-gap-contract`.

## Concrete Next Steps

1. Review pre-existing unrelated working tree changes before staging.
2. On a machine/CI runner with `pdo_sqlite`, run `npm run test:ci`.
3. If staging/committing, include a JIRA ticket in branch/commit name per `AGENTS.md`.
