# Progress Codebase vs Proposal (BagiPangan)

**Date:** 2026-04-27  
**References:** [documentation/PROPOSAL_TUGAS_BESAR.md](documentation/PROPOSAL_TUGAS_BESAR.md), [documentation/ARCHITECTURE.md](documentation/ARCHITECTURE.md)

## Summary Snapshot
- **Implemented strongly:** Admin operational core (dashboard summary, moderation queue approve/reject, user list/update, CSV export) + registration.
- **Partially implemented:** Admin account management CRUD scope, dashboard/report scope from proposal, audit logging scope, frontend admin coverage.
- **Not yet implemented (major):** Donor and receiver functional flows (post/search/detail/claim/proof/history/notifications/map), category CRUD, profile CRUD, login backend flow.

---

## 1) Functional Requirements Status (FR-01 to FR-19)

| ID | Proposal Feature | Current Status | Evidence in Codebase | Notes |
|---|---|---|---|---|
| FR-01 | Manajemen Akun (CRUD) | **Partial** | [be-laravel/routes/api.php](be-laravel/routes/api.php), [be-laravel/app/Http/Controllers/Admin/UserManagementController.php](be-laravel/app/Http/Controllers/Admin/UserManagementController.php) | Only `GET /admin/users` + `PATCH /admin/users/{user}`. No create/delete user API. |
| FR-02 | Registrasi Akun | **Done** | [be-laravel/routes/api.php](be-laravel/routes/api.php), [be-laravel/app/Http/Controllers/RegisterController.php](be-laravel/app/Http/Controllers/RegisterController.php), [be-laravel/app/Services/RegisterService.php](be-laravel/app/Services/RegisterService.php), [fe-nextjs/app/api/register/route.ts](fe-nextjs/app/api/register/route.ts) | End-to-end registration path exists via Next proxy to Laravel. |
| FR-03 | Login | **Not Started (in this repo scope)** | [be-laravel/routes/api.php](be-laravel/routes/api.php), [fe-nextjs/app/login/page.tsx](fe-nextjs/app/login/page.tsx) | No login API/controller flow implemented here; proposal expects it. |
| FR-04 | Manajemen Profile (CRUD) | **Not Started** | [be-laravel/routes/api.php](be-laravel/routes/api.php) | No profile endpoints/controller/UI CRUD found. |
| FR-05 | Manajemen Kategori (CRUD) | **Not Started (domain ready)** | [be-laravel/app/Models/DonationCategory.php](be-laravel/app/Models/DonationCategory.php), [be-laravel/database/migrations/2026_04_23_000004_create_donation_categories_table.php](be-laravel/database/migrations/2026_04_23_000004_create_donation_categories_table.php) | Table/model exists; no category API/controller/UI. |
| FR-06 | Manajemen Posting Donasi (CRUD) | **Not Started (domain ready)** | [be-laravel/app/Models/Donation.php](be-laravel/app/Models/Donation.php), [be-laravel/routes/api.php](be-laravel/routes/api.php) | Donation model exists, but no donor CRUD routes/controllers/UI. |
| FR-07 | Edit & Pembatalan Donasi | **Not Started** | [be-laravel/routes/api.php](be-laravel/routes/api.php) | No donor edit/cancel endpoint/workflow. |
| FR-08 | Pencarian Posting Donasi | **Not Started** | [be-laravel/routes/api.php](be-laravel/routes/api.php) | No public listing/search endpoint and no receiver listing page flow. |
| FR-09 | Detail Posting Donasi | **Not Started** | [be-laravel/routes/api.php](be-laravel/routes/api.php) | No detail endpoint for donation post. |
| FR-10 | Klaim Donasi | **Not Started (data model ready)** | [be-laravel/app/Models/Claim.php](be-laravel/app/Models/Claim.php), [be-laravel/database/migrations/2026_04_23_000006_create_claims_table.php](be-laravel/database/migrations/2026_04_23_000006_create_claims_table.php) | Claim model/table exist; no claim API/UI flow. |
| FR-11 | Unggah Bukti Pengambilan | **Not Started** | [be-laravel/app/Models/Claim.php](be-laravel/app/Models/Claim.php) | Field exists (`proof_image_url`), but no upload endpoint/storage pipeline/UI. |
| FR-12 | Notifikasi Klaim | **Not Started** | [be-laravel/routes/api.php](be-laravel/routes/api.php) | No notification service, endpoints, or UI list. |
| FR-13 | Riwayat Donasi | **Not Started** | [be-laravel/routes/api.php](be-laravel/routes/api.php) | No donor history endpoint/page. |
| FR-14 | Riwayat Klaim | **Not Started** | [be-laravel/routes/api.php](be-laravel/routes/api.php) | No receiver history endpoint/page. |
| FR-15 | Dashboard & Laporan Singkat | **Partial** | [be-laravel/app/Http/Controllers/Admin/DashboardController.php](be-laravel/app/Http/Controllers/Admin/DashboardController.php), [fe-nextjs/app/admin/page.tsx](fe-nextjs/app/admin/page.tsx) | Implemented for admin KPI + activity only; proposal scope broader (roles/visualization breadth). |
| FR-16 | Manajemen & Moderasi Admin | **Partial (backend solid, UI limited)** | [be-laravel/app/Http/Controllers/Admin/ModerationController.php](be-laravel/app/Http/Controllers/Admin/ModerationController.php), [be-laravel/app/Http/Controllers/Admin/UserManagementController.php](be-laravel/app/Http/Controllers/Admin/UserManagementController.php), [fe-nextjs/app/admin/layout.tsx](fe-nextjs/app/admin/layout.tsx) | Backend moderation APIs exist; frontend moderation page/actions not yet wired (`Moderasi (segera)`). |
| FR-17 | Export Laporan | **Partial** | [be-laravel/app/Http/Controllers/Admin/ReportController.php](be-laravel/app/Http/Controllers/Admin/ReportController.php), [fe-nextjs/app/api/admin/reports/export/csv/route.ts](fe-nextjs/app/api/admin/reports/export/csv/route.ts) | CSV export implemented; proposal mentions PDF/Excel options. |
| FR-18 | Audit Trail & Logging | **Partial** | [be-laravel/app/Models/ActivityLog.php](be-laravel/app/Models/ActivityLog.php), [be-laravel/app/Http/Controllers/Admin/ModerationController.php](be-laravel/app/Http/Controllers/Admin/ModerationController.php), [be-laravel/app/Http/Controllers/Admin/UserManagementController.php](be-laravel/app/Http/Controllers/Admin/UserManagementController.php) | Logging exists for admin moderation/user updates; not yet full system-wide trail (posting/claim lifecycle). |
| FR-19 | Visualisasi Peta Lokasi Donasi | **Not Started** | [fe-nextjs/app](fe-nextjs/app), [be-laravel/routes/api.php](be-laravel/routes/api.php) | No map data endpoint or map UI module. |

---

## 2) Architecture/Proposal Alignment (Important Gaps)

1. **Microservices plan vs actual implementation**
   - Proposal describes logical microservices and API gateway behavior.
   - Current implementation is **modular monolith backend** (single Laravel app) + Next route-proxy pattern.

2. **Supabase usage in proposal vs codebase**
   - Proposal references Supabase Postgres/Object Storage.
   - Current backend is standard Laravel DB configuration with flexible drivers; explicit Supabase integration path is not present in app code yet.

3. **Frontend scope difference**
   - Proposal mockups include donor and receiver app surfaces.
   - Current frontend is mostly landing/register/admin summary; donor/receiver functional modules are not implemented end-to-end.

4. **Testing maturity**
   - Proposal mentions broad testing direction.
   - Current automated test coverage is minimal and focused on admin access guard behavior only ([be-laravel/tests/Feature/Admin/AdminAccessTest.php](be-laravel/tests/Feature/Admin/AdminAccessTest.php)).

---

## 3) Current Delivery Progress (Practical Estimate)

- **Data model foundation:** ~60% (users, donations, claims, categories, activity logs exist)
- **Backend business APIs:** ~35–40% (admin + registration mostly done; donor/receiver APIs missing)
- **Frontend product flows:** ~25–30% (landing + registration + admin summary/users display)
- **Proposal FR completion overall:** **~30% complete**, **~25% partial**, **~45% not started**

> This estimate is based on implemented executable flows, not just schema/model presence.

---

## 4) Small Recommendations (Prioritized)

1. **Close the highest-value gap first: donor/receiver MVP flow**
   - Implement FR-06/08/09/10/11 in sequence (post -> list/search -> detail -> claim -> proof upload).
   - This unlocks the platform’s core transaction loop.

2. **Finish admin UI wiring for already-built backend features**
   - Add frontend pages/actions for moderation approve/reject and report export button.
   - Low effort, high visibility because backend endpoints already exist.

3. **Standardize response envelope now**
   - Keep all success responses in `{ message, data }` and align existing registration response (`user`) to avoid frontend inconsistencies.

4. **Add transactional safety for moderation mutations**
   - Wrap donation state update + `activity_logs` insert in a DB transaction to prevent partial writes.

5. **Expand tests around implemented paths before adding many new modules**
   - Add feature tests for moderation approve/reject, user update, dashboard summary, and CSV export.
   - This reduces regression risk while feature velocity increases.

6. **Defer FR-19 map until core claim flow is stable**
   - Keep map in phase 2, matching current architecture guidance and avoiding premature complexity.

---

## 5) Suggested Next Milestone (2 Sprint Scope)

- **Sprint A:** FR-06, FR-08, FR-09 + frontend pages + tests.
- **Sprint B:** FR-10, FR-11, FR-13/14 + minimal notifications event placeholder + tests.

This sequence gives a complete donor-to-receiver value chain while staying aligned with the current codebase architecture.
