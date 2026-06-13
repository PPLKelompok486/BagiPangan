# BagiPangan

<div align="center">

**A food donation platform that helps donors, receivers, and admins move surplus food to the people who need it.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111111)](https://react.dev/)
[![Laravel](https://img.shields.io/badge/Laravel-13-FF2D20?logo=laravel&logoColor=white)](https://laravel.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Live App](https://bagipangan.eastasia.cloudapp.azure.com/bagipangan) ·
[Architecture](documentation/ARCHITECTURE.md) ·
[Deployment](documentation/DEPLOYMENT.md) ·
[Testing Workflow](documentation/AUTOMATED_TESTING_WORKFLOW.md)

</div>

## Table of Contents

- [About](#about)
- [Features](#features)
- [Built With](#built-with)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment](#environment)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## About

BagiPangan is a full-stack food donation system for posting, discovering, claiming, and moderating food donations. It is built as a monorepo with a Next.js frontend, a Laravel API backend, Supabase PostgreSQL, and production deployment assets for an Azure Ubuntu VM.

The product supports three primary roles:

- **Donors** create donation listings, manage their donations, upload food photos, and track claims.
- **Receivers** browse available donations, filter by category, use map-based discovery, and claim food.
- **Admins** moderate donations, manage users and categories, review activity logs, and export operational reports.

## Features

- Public landing experience for BagiPangan.
- Role-based donor, receiver, and admin flows.
- Donation posting with category, location, image, and status data.
- Map discovery powered by Leaflet and browser geolocation.
- Claim workflow for receivers and donation owners.
- Admin moderation, category management, user management, analytics, and CSV export.
- Notification support for donation and claim events.
- Automated traceability checks against project test-case evidence.
- Production-ready Nginx, systemd, HTTPS, queue, and scheduler configuration.

## Built With

| Layer | Stack |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, Leaflet, Recharts |
| Backend | Laravel 13, PHP 8.3+, PHPUnit |
| Data | Supabase PostgreSQL |
| Infrastructure | Azure Ubuntu Server 24.04, Nginx, systemd, Certbot |
| Automation | GitHub Actions, Node.js test runner, Laravel tests |

## Architecture

Production runs behind one public domain. Nginx receives public traffic, Next.js owns the browser-facing routes, and Laravel remains an internal API service.

```text
Browser
  -> Nginx :80/:443
  -> Next.js 127.0.0.1:3000
  -> Laravel 127.0.0.1:8000
  -> Supabase PostgreSQL
```

Key routing rules:

- `/` and `/api/*` are served through Next.js.
- Next.js API routes proxy backend requests to Laravel.
- Laravel is not exposed as a separate public API domain.
- `/storage/*` is served by Nginx from Laravel public storage.
- Browser geolocation requires HTTPS for map features.

See [documentation/ARCHITECTURE.md](documentation/ARCHITECTURE.md) for the full architecture notes.

## Getting Started

### Prerequisites

Install these locally:

- Node.js 22+ and npm
- PHP 8.3+
- Composer
- A PostgreSQL database, or a Supabase project

### Installation

Clone the repository:

```bash
git clone https://github.com/PPLKelompok486/BagiPangan.git
cd BagiPangan
```

Install root and frontend dependencies:

```bash
npm install
npm install --prefix fe-nextjs
```

Install backend dependencies and create the Laravel app key:

```bash
cd be-laravel
composer install
cp .env.example .env
php artisan key:generate
cd ..
```

Create the frontend environment file:

```bash
cp fe-nextjs/.env.local.example fe-nextjs/.env.local
```

Update the backend and frontend environment files with your database and Supabase values, then run migrations:

```bash
cd be-laravel
php artisan migrate --seed
cd ..
```

Start the frontend and backend together:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:fe
npm run dev:be
```

Default local services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

## Environment

Use the example files as references. Do not commit real credentials.

| File | Purpose |
| --- | --- |
| `be-laravel/.env.example` | Local Laravel API configuration |
| `fe-nextjs/.env.local.example` | Local Next.js and Supabase public configuration |
| `deploy/backend.env.example` | Production Laravel environment template |
| `deploy/frontend.env.production.local.example` | Production Next.js environment template |

Production environment files live on the VM under:

```text
/var/www/bagipangan/shared/backend.env
/var/www/bagipangan/shared/frontend.env
```

Important production value:

```env
BAGIPANGAN_BACKEND_URL=http://127.0.0.1:8000
```

## Testing

Run focused suites from the repository root:

| Command | What it checks |
| --- | --- |
| `npm run test:tc` | Automated test-case traceability |
| `npm run test:be` | Laravel feature and unit tests |
| `npm run test:fe` | Frontend lint and production build |
| `npm run test:ci` | Local CI-equivalent suite |

Testing details are documented in [documentation/AUTOMATED_TESTING_WORKFLOW.md](documentation/AUTOMATED_TESTING_WORKFLOW.md).

## Deployment

The current production target is an Azure Ubuntu Server 24.04 VM deployed from GitHub `main`.

Main deployment script:

```bash
scripts/deploy/vm/full-deploy-ubuntu.sh
```

Production services:

- `bagipangan-backend`
- `bagipangan-frontend`
- `bagipangan-queue`
- `bagipangan-scheduler.timer`
- `nginx`
- `php8.4-fpm`

See [documentation/DEPLOYMENT.md](documentation/DEPLOYMENT.md) for VM setup, GitHub Actions secrets, Nginx, systemd, HTTPS, and redeployment instructions.

## Project Structure

```text
be-laravel/       Laravel API backend
fe-nextjs/        Next.js frontend and API proxy routes
deploy/           Nginx, systemd, and production env examples
scripts/deploy/   VM bootstrap and deployment scripts
tests/automated/  Test-case traceability tests
documentation/    Architecture, deployment, proposal, and testing docs
tools/            Supporting developer utilities
```

## Documentation

- [Architecture](documentation/ARCHITECTURE.md)
- [Deployment](documentation/DEPLOYMENT.md)
- [Automated Testing Workflow](documentation/AUTOMATED_TESTING_WORKFLOW.md)
- [Progress vs Proposal](documentation/PROGRESS_VS_PROPOSAL.md)

## Contributing

Contributions are welcome. For a clean workflow:

1. Fork or branch from `main`.
2. Create a focused feature or fix branch.
3. Keep real credentials out of commits.
4. Run the relevant test commands before opening a pull request.
5. Include screenshots or screen recordings for user-facing UI changes.

When a JIRA ticket is involved, include the ticket ID in the branch and commit name.

```bash
git switch -c codex/SCRUM-123-update-docs
git commit -m "SCRUM-123 docs: update README"
```

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
