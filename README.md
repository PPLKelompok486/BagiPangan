# BagiPangan

BagiPangan is a food donation platform for connecting donors, receivers, and admins. The app supports donation posting, category filtering, map-based discovery, claims, profile flows, and admin moderation.

Production URL:

- `https://bagipangan.eastasia.cloudapp.azure.com/bagipangan`

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Leaflet, Supabase client
- Backend: Laravel 13, PHP 8.4 on production, PostgreSQL through Supabase
- Infrastructure: Ubuntu Server 24.04 VM, Nginx, systemd, Certbot
- CI: GitHub Actions

## Repository Layout

```text
be-laravel/       Laravel API backend
fe-nextjs/        Next.js frontend and API proxy routes
deploy/           Nginx, systemd, and environment examples
scripts/deploy/   VM bootstrap and deployment scripts
tests/automated/  test-case traceability tests
documentation/    architecture, deployment, proposal, and testing docs
```

## Runtime Architecture

The production VM uses one public domain. Nginx receives public traffic and proxies all app and API requests to Next.js.

```text
Browser
  -> Nginx :80/:443
  -> Next.js 127.0.0.1:3000
  -> Laravel 127.0.0.1:8000
  -> Supabase PostgreSQL
```

Important routing rules:

- Public `/` and `/api/*` go to Next.js.
- Next.js API routes call Laravel through `BAGIPANGAN_BACKEND_URL=http://127.0.0.1:8000`.
- Laravel is not exposed as a separate public API domain.
- `/storage/*` is served by Nginx from Laravel public storage.
- Browser geolocation prompts require HTTPS.

## Local Development

Install root dependencies:

```bash
npm install
```

Install frontend dependencies:

```bash
npm install --prefix fe-nextjs
```

Install backend dependencies:

```bash
cd be-laravel
composer install
cp .env.example .env
php artisan key:generate
```

Run frontend and backend together from the repository root:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:fe
npm run dev:be
```

## Environment Files

Do not commit real secrets. Use these files as references:

- `deploy/backend.env.example`
- `deploy/frontend.env.production.local.example`
- `be-laravel/.env.example`
- `fe-nextjs/.env.local.example` if present

Production env files live on the VM under:

```text
/var/www/bagipangan/shared/backend.env
/var/www/bagipangan/shared/frontend.env
```

## Testing

Run automated test-case traceability checks:

```bash
npm run test:tc
```

Run Laravel tests:

```bash
npm run test:be
```

Run frontend lint and build:

```bash
npm run test:fe
```

Run the full local CI-equivalent suite:

```bash
npm run test:ci
```

## Deployment

The current deployment target is an Azure Ubuntu Server 24.04 VM using GitHub `main`.

Main deployment script:

```bash
scripts/deploy/vm/full-deploy-ubuntu.sh
```

Canonical deployment docs:

- `documentation/DEPLOYMENT.md`

The production services are:

- `bagipangan-backend`
- `bagipangan-frontend`
- `bagipangan-queue`
- `bagipangan-scheduler.timer`
- `nginx`
- `php8.4-fpm`

## Documentation

- `documentation/ARCHITECTURE.md`: current system architecture
- `documentation/DEPLOYMENT.md`: current Azure VM deployment process
- `documentation/AUTOMATED_TESTING_WORKFLOW.md`: automated testing and CI workflow
- `documentation/PROGRESS_VS_PROPOSAL.md`: proposal traceability evidence used by automated tests

## Git Convention

When a JIRA ticket is involved, include the ticket ID in the branch and commit name.

Example:

```bash
git switch -c codex/SCRUM-123-update-docs
git commit -m "SCRUM-123 docs: update deployment guide"
```
