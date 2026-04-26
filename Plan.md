Plan: Full Admin Platform Sync (Backend, Frontend, UI)
Build the admin feature in phased delivery, starting from backend admin capabilities and API contracts, then shipping admin frontend modules that stay visually aligned with the landing page while becoming denser for operational workflows.
This plan follows your choices: single admin role, session-auth assumed from another stream, MVP includes dashboard + moderation + user management, CSV export first, and map in phase 2.

Steps

Phase 1: Scope and contract freeze (blocks all implementation). Finalize endpoint contracts and response shapes for Admin Dashboard, Moderation Queue, and User Management; keep role model as single admin only.
Phase 2: Backend schema and admin foundation (depends on step 1). Extend role handling to include admin; add donations, claims, categories, and activity logs schema needed by dashboard and moderation flows.
Phase 3: Backend admin APIs and services (depends on step 2). Implement KPI/activity feed endpoint, moderation approve/reject/edit endpoints, user role/deactivate endpoints, CSV export endpoint, and audit logging for admin actions.
Phase 4: Frontend admin shell and architecture (depends on step 1; can run in parallel with steps 2-3 once contracts are fixed). Add admin route group, dashboard layout shell, nav, and session-auth integration boundary with unauthorized/forbidden handling.
Phase 5: Frontend admin modules (depends on steps 3-4). Build live data dashboard, moderation queue/detail/action flow, user management table/actions, and CSV report export controls.
Phase 6: UI synchronization with landing vision (parallel with step 5 after admin shell exists). Reuse existing token system, typography, motion language, and component primitives; increase data-density and hierarchy for admin contexts.
Phase 7: Verification and hardening (depends on steps 3-6). Add backend feature tests, contract checks, end-to-end admin scenarios, and accessibility/reduced-motion/responsive checks.
Phase 8: Phase-2 expansion (post-MVP). Implement donation map analytics and optional PDF reporting only after MVP validation.
Relevant files

RegisterService.php — service/validation pattern to mirror for admin services.
RegisterController.php — response and error envelope convention.
api.php — admin route grouping and endpoint registration.
app.php — middleware aliasing and admin middleware wiring.
User.php — role handling and admin checks.
2026_04_14_000001_add_role_to_users_table.php — role expansion to include admin.
AppServiceProvider.php — authorization and service bindings.
Feature — admin feature tests.
landing.css — visual tokens and brand variables.
layout.tsx — typography/theme wrapper.
dashboard-preview.tsx — KPI/feed visual blueprint.
button.tsx — shared interaction primitive.
motion.ts — reusable motion and reduced-motion behavior.
route.ts — API proxy pattern to replicate for admin routes.
Alignment_Analysis_Proposal_vs_Backlog.md — FR-15 to FR-19 and SCRUM mapping anchor.
Verification

Backend feature tests for authorization boundaries, moderation actions, user role/deactivate actions, KPI correctness, and CSV export output.
Contract validation between frontend admin fetch layer and backend response/error schemas.
Manual scenario checks: moderate donation, edit donation, deactivate user, change role, export CSV, and verify audit log records.
UI consistency pass against landing vision: token/typography/motion continuity plus operational density/readability.
Responsive and accessibility checks across desktop/mobile and reduced-motion behavior.
Decisions Captured

Included in MVP: dashboard KPIs + activity feed, moderation, user management, CSV export.
Role model: single admin role.
Auth assumption: session-based auth is provided by another stream and integrated, not built in this scope.
Map visualization: phase 2.
UI direction: hybrid approach, landing-inspired shell plus denser admin data views.
Excluded from MVP: multi-tier RBAC and PDF export.
Plan has been saved in session memory and is ready for handoff once you approve.