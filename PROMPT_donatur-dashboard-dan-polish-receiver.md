# Prompt AI untuk membuat halaman donatur dan polish halaman receiver

Gunakan prompt di bawah ini ke AI coding agent:

```md
You are working inside an existing Next.js 16 + React 19 + Tailwind CSS 4 frontend project for **Bagi Pangan**.

Your task is to create a **frontend-only donor experience** and **polish the existing receiver pages**.

Important:
- Do **not** change backend logic, API contracts, database schema, authentication payload shape, or Laravel code.
- Do **not** invent new backend endpoints.
- You may add frontend routes, components, mock/stub data, presentation helpers, and safe client-side redirects only.
- If a feature depends on backend work that does not exist yet, build the UI state and placeholder interactions without breaking current flows.

## Project context you must respect

- Tech stack: Next.js App Router, React 19, Tailwind CSS 4, Framer Motion, Lucide icons.
- Existing auth user shape is in `fe-nextjs/lib/api.ts`:
  - `role: "donatur" | "penerima"`
- Existing login page is in `fe-nextjs/app/login/page.tsx`
  - current donor landing is `/bagipangan`
  - current receiver landing is `/receiver/dashboard`
- Existing protected receiver area is already implemented under `fe-nextjs/app/receiver/*`
- Existing auth middleware is in `fe-nextjs/proxy.ts`
  - it currently protects only `/receiver/:path*`
- Existing visual identity uses green brand colors in `fe-nextjs/app/globals.css`
  - preserve the existing Bagi Pangan visual language

## Main objective

Build a **donor dashboard page** for users with role `donatur`, and make sure a donor who logs in is directed to that page instead of the landing page.

Also improve the visual quality and UX consistency of the receiver pages so both donor and receiver experiences feel like part of one polished product.

## Routing requirements

1. Create a dedicated donor route, preferably:
   - `/donatur/dashboard`
   or another equally clear donor dashboard route if you have a stronger structural reason.

2. Update the donor login redirect:
   - when login succeeds and `role === "donatur"`, redirect to the new donor dashboard
   - keep `penerima` redirecting to `/receiver/dashboard`

3. Keep backend/auth logic untouched:
   - use the existing `saveAuth`, `getUser`, and client-side auth flow
   - do not modify the response shape expected from `/api/login`

4. Add frontend route protection for donor pages:
   - donor pages should require authentication
   - if not logged in, redirect to `/login`
   - if logged in with the wrong role, redirect away safely
   - implement this in a way that matches the current receiver protection pattern

5. Registration flow constraint:
   - do not change backend registration behavior
   - if full auto-login after registration is not possible with the current backend, keep the existing register success flow but make the donor's next step clearly lead toward the donor dashboard after login

## Donor dashboard scope

Create a polished **frontend-only donor dashboard** with realistic UI and placeholder data where needed.

The page should feel modern, warm, trustworthy, and action-oriented, not generic admin boilerplate.

### Include these sections

1. Hero / welcome area
   - greet the donor by name if available
   - short message about food impact and active donations
   - prominent CTA like `Buat Donasi Baru`

2. KPI summary cards
   - total donations posted
   - active donations
   - completed donations
   - estimated meals distributed

3. Donation management area
   - list or cards for donor's donations
   - statuses like `draft`, `waiting review`, `active`, `claimed`, `completed`
   - search/filter UI
   - action buttons can be placeholder-only if backend is not ready

4. Impact / transparency section
   - timeline or activity feed
   - recent updates such as posted, claimed, picked up, completed
   - visual trust signals

5. Receiver engagement preview
   - show who claimed donations, pickup windows, or fulfillment progress
   - this can be mock UI based on static placeholder data

6. Empty states and responsive states
   - design a strong zero-data state for first-time donors
   - loading skeletons
   - mobile-friendly layout

## Receiver polish scope

Polish the existing receiver experience without changing backend behavior.

Focus on these files/pages if useful:
- `fe-nextjs/app/receiver/layout.tsx`
- `fe-nextjs/app/receiver/dashboard/page.tsx`
- `fe-nextjs/app/receiver/map/page.tsx`
- `fe-nextjs/app/receiver/my-claims/page.tsx`
- `fe-nextjs/app/receiver/donations/[id]/page.tsx`

### Receiver improvements should aim for

- stronger visual consistency with the new donor dashboard
- better spacing, hierarchy, and readability
- clearer CTA emphasis
- better mobile behavior
- improved empty/loading/error states
- more polished cards, chips, and top navigation
- keep the existing useful functionality intact

## Design direction

Do not produce a bland template.

Use a design direction that fits a food donation platform:
- warm, clean, trustworthy, community-centered
- keep the green brand identity from the existing project
- use subtle gradients, depth, layered cards, and intentional motion
- avoid purple-heavy SaaS styling
- avoid overly dark UI unless already needed in a small section

Use the current project patterns where they exist, but elevate the craftsmanship.

## Component architecture

Prefer clean separation:
- donor layout component
- donor dashboard page
- reusable donor widgets/cards
- shared status badge / metric card patterns where helpful

Do not create unnecessary abstraction.

## Data handling rules

- If donor-specific backend data does not exist yet, use local mock arrays/constants for frontend rendering.
- Clearly isolate mock data so it can be replaced later.
- Do not break existing receiver data fetching.
- Do not remove or rewrite working receiver logic unless needed for presentation polish.

## MCP tool instruction

If the MCP tools `magic`, `stock`, and `exe` are available in the environment:
- use them to improve UI craft, layout quality, stock visual selection, and finishing polish
- use them especially for donor dashboard visual refinement and receiver page polish

If those MCP tools are **not available**, do **not** block the task:
- continue with normal implementation
- preserve the same design intent without depending on those tools

## Files likely to change

- `fe-nextjs/app/login/page.tsx`
- `fe-nextjs/proxy.ts`
- new donor route files under `fe-nextjs/app/donatur/`
- new donor components as needed
- selected receiver UI files for polish

## Acceptance criteria

- Donor login lands on the donor dashboard, not `/bagipangan`
- Receiver login still lands on `/receiver/dashboard`
- Backend/API behavior is untouched
- Donor dashboard looks production-quality even if some actions are placeholder-only
- Receiver pages feel more polished and visually aligned with donor pages
- Responsive behavior works on mobile and desktop
- Code is organized and easy for another developer to connect to real backend functions later

## Output expectation

Implement the code changes directly in the project.

At the end, summarize:
- which files you changed
- what frontend behavior was added
- what is still placeholder-only for my friend to connect later
```

## Catatan

- `magic`, `stock`, dan `exe` MCP tools tidak tersedia di sesi saya sekarang, jadi saya menulis prompt ini dengan fallback yang aman.
- Prompt ini sudah disesuaikan dengan struktur project kamu sekarang, termasuk route login, role `donatur/penerima`, dan area `receiver` yang sudah ada.
