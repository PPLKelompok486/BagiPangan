# BagiPangan Architecture

**Updated:** 2026-06-12

**Audience:** frontend, backend, and deployment maintainers

## Product Overview

BagiPangan is a food donation platform with three main roles:

- `donatur`: creates and manages donation entries.
- `penerima`: browses, filters, maps, and claims available donations.
- `admin`: moderates donations and manages operational data.

The repository is a monorepo with a Laravel backend, a Next.js frontend, shared deployment assets, and automated test-case traceability checks.

## Runtime Components

```text
Browser
  -> Nginx :80/:443
  -> Next.js 127.0.0.1:3000
  -> Laravel 127.0.0.1:8000
  -> Supabase PostgreSQL
```

### Frontend

Path: `fe-nextjs`

Responsibilities:

- Render public, donor, receiver, profile, map, and admin pages.
- Provide Next.js API routes under `/api/*`.
- Proxy authenticated and unauthenticated requests to Laravel.
- Read browser location when map pages need user positioning.
- Use Supabase client configuration for auth-related frontend behavior.

Production service:

```text
bagipangan-frontend
```

The service runs:

```bash
npm run start --prefix fe-nextjs
```

on:

```text
127.0.0.1:3000
```

### Backend

Path: `be-laravel`

Responsibilities:

- Donation, category, claim, profile, and admin APIs.
- Business validation and authorization.
- Database access through Laravel models and migrations.
- Queue jobs and scheduled Laravel tasks.

Production services:

```text
bagipangan-backend
bagipangan-queue
bagipangan-scheduler.timer
```

The backend API runs internally on:

```text
127.0.0.1:8000
```

It is intentionally not exposed through a separate public API domain.

### Database

Production uses Supabase PostgreSQL.

Laravel connects through the values in:

```text
/var/www/bagipangan/shared/backend.env
```

No real database password, Supabase service key, or VM password should be committed to the repository.

### Reverse Proxy

Nginx owns the public HTTP and HTTPS ports:

```text
80
443
```

Current production domain:

```text
bagipangan.eastasia.cloudapp.azure.com
```

Public routing:

- `/` proxies to Next.js.
- `/bagipangan` is rendered by Next.js.
- `/api/*` proxies to Next.js API routes.
- `/storage/*` serves Laravel public storage files.

Next.js then calls Laravel through:

```env
BAGIPANGAN_BACKEND_URL=http://127.0.0.1:8000
```

This avoids the older split-domain deployment model and keeps browser-facing API behavior on one origin.

## Key Request Flows

### Category Loading

```text
Browser -> /api/categories -> Next.js route -> Laravel /api/donations/categories -> Supabase
```

The frontend should call the public Next.js route. Laravel remains internal on the VM.

### Donation Map

```text
Browser map page
  -> browser geolocation permission over HTTPS
  -> /api/proxy/donations/map
  -> Laravel /api/donations/map
  -> GeoJSON response
```

Geolocation prompts require HTTPS in modern browsers. Testing through plain HTTP public IP will not reliably show the location prompt.

### Profile

```text
Browser -> /profile -> /api/profile or /api/proxy/donations/mine -> Laravel authenticated APIs
```

The frontend forwards available bearer tokens and cookies to the Next.js proxy routes. When unauthenticated, profile-related APIs should return an auth error instead of a missing-route error.

### Admin

```text
Browser admin page -> Next.js /api/admin/* -> Laravel admin APIs -> Supabase
```

Admin APIs are protected by Laravel auth and role checks.

## Deployment Model

The VM is Ubuntu Server 24.04. The main deployment script is:

```text
scripts/deploy/vm/full-deploy-ubuntu.sh
```

It installs or updates:

- PHP 8.4 and Laravel extensions.
- Composer.
- Node.js 22.
- Nginx.
- Certbot.
- 2GB swapfile for small Azure VMs.
- systemd services.
- Laravel dependencies, migrations, caches, queue worker, and scheduler.
- Next.js dependencies and production build.
- Let's Encrypt HTTPS certificate when enabled.

The detailed deployment procedure is documented in:

```text
documentation/DEPLOYMENT.md
```

## Automated Testing

The root package exposes:

```bash
npm run test:tc
npm run test:be
npm run test:fe
npm run test:ci
```

Test workflow details are documented in:

```text
documentation/AUTOMATED_TESTING_WORKFLOW.md
```

## Operational Notes

- Keep Laravel reachable only on `127.0.0.1:8000` unless the architecture is intentionally changed.
- Keep public API calls on the same domain through Next.js `/api/*`.
- Restart services through systemd after deployment.
- Keep Azure NSG rules open for SSH, HTTP, and HTTPS.
- Do not commit real `.env` values.
- Include the JIRA ticket ID in branch and commit names when a JIRA ticket is involved.
