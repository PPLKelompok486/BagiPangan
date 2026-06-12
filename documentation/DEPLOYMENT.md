# BagiPangan Deployment

**Updated:** 2026-06-12
**Target:** Azure Ubuntu Server 24.04 VM
**Branch:** GitHub `main`

This document describes the current production deployment shape. It intentionally uses placeholders for secrets.

## Current Production Target

```text
Domain: https://bagipangan.eastasia.cloudapp.azure.com
App URL: https://bagipangan.eastasia.cloudapp.azure.com/bagipangan
VM OS: Ubuntu Server 24.04
App path: /var/www/bagipangan/current
Shared env path: /var/www/bagipangan/shared
Database: Supabase PostgreSQL
```

Runtime services:

```text
bagipangan-backend
bagipangan-frontend
bagipangan-queue
bagipangan-scheduler.timer
nginx
php8.4-fpm
```

## Azure Network Rules

The VM network security group must allow:

```text
SSH    TCP 22   Allow
HTTP   TCP 80   Allow
HTTPS  TCP 443  Allow
```

For the HTTPS inbound rule in Azure Portal:

```text
Source: Any
Source port ranges: *
Destination: Any
Service: HTTPS
Destination port ranges: 443
Protocol: TCP
Action: Allow
Priority: 330
Name: Allow-HTTPS
```

## One-Time Setup

SSH into the VM:

```bash
ssh <vm-user>@<vm-ip>
```

Create the app directory and clone `main`:

```bash
sudo mkdir -p /var/www/bagipangan/current
sudo chown -R "$USER:$USER" /var/www/bagipangan
git clone --branch main <repo-url> /var/www/bagipangan/current
cd /var/www/bagipangan/current
```

Create shared env files:

```bash
sudo mkdir -p /var/www/bagipangan/shared
sudo cp deploy/backend.env.example /var/www/bagipangan/shared/backend.env
sudo cp deploy/frontend.env.production.local.example /var/www/bagipangan/shared/frontend.env
sudo nano /var/www/bagipangan/shared/backend.env
sudo nano /var/www/bagipangan/shared/frontend.env
```

Set real Supabase and app values in `backend.env`:

```env
APP_NAME=BagiPangan
APP_ENV=production
APP_KEY=base64:your-generated-app-key
APP_DEBUG=false
APP_URL=https://bagipangan.eastasia.cloudapp.azure.com

DB_CONNECTION=pgsql
DB_HOST=your-supabase-pooler-host
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=your-supabase-db-user
DB_PASSWORD=your-supabase-db-password

SESSION_DOMAIN=bagipangan.eastasia.cloudapp.azure.com
```

Set frontend values in `frontend.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=
BAGIPANGAN_BACKEND_URL=http://127.0.0.1:8000
LARAVEL_API_BASE=https://bagipangan.eastasia.cloudapp.azure.com
NEXT_PUBLIC_LARAVEL_IMAGE_HOST=bagipangan.eastasia.cloudapp.azure.com
```

Fix permissions:

```bash
sudo chown deploy:www-data /var/www/bagipangan/shared/backend.env /var/www/bagipangan/shared/frontend.env 2>/dev/null || true
sudo chmod 640 /var/www/bagipangan/shared/backend.env /var/www/bagipangan/shared/frontend.env
```

## Main Deployment Command

Run this from the VM:

```bash
cd /var/www/bagipangan/current
chmod +x scripts/deploy/vm/full-deploy-ubuntu.sh

DOMAIN=bagipangan.eastasia.cloudapp.azure.com \
REPO_URL=<repo-url> \
BRANCH=main \
DEPLOY_PATH=/var/www/bagipangan \
RUN_MIGRATIONS=true \
ENABLE_HTTPS=true \
sudo -E bash scripts/deploy/vm/full-deploy-ubuntu.sh
```

The script installs or updates server packages, pulls `main`, installs Laravel and Next.js dependencies, builds the frontend, runs migrations, installs systemd units, configures Nginx, restarts services, and requests or renews the HTTPS certificate.

## Re-Deploy

After new commits are available on `main`, run the same command:

```bash
cd /var/www/bagipangan/current

DOMAIN=bagipangan.eastasia.cloudapp.azure.com \
REPO_URL=<repo-url> \
BRANCH=main \
DEPLOY_PATH=/var/www/bagipangan \
RUN_MIGRATIONS=true \
ENABLE_HTTPS=true \
sudo -E bash scripts/deploy/vm/full-deploy-ubuntu.sh
```

Set `RUN_MIGRATIONS=false` only when you intentionally want to skip migrations.

## GitHub Actions Deployment

Workflow:

```text
.github/workflows/deploy-vm.yml
```

Required GitHub secrets:

```text
VM_HOST=<vm-ip-or-domain>
VM_USER=deploy
VM_PORT=22
VM_SSH_KEY=<private-deploy-key>
DEPLOY_PATH=/var/www/bagipangan
DEPLOY_REPO_URL=<repo-url>
DEPLOY_DOMAIN=bagipangan.eastasia.cloudapp.azure.com
RUN_MIGRATIONS=true
ENABLE_HTTPS=true
```

The deploy user must be allowed to restart app services:

```bash
sudo tee /etc/sudoers.d/bagipangan-deploy >/dev/null <<'EOF'
deploy ALL=(root) NOPASSWD: /bin/systemctl daemon-reload, /bin/systemctl restart bagipangan-backend.service, /bin/systemctl restart bagipangan-frontend.service, /bin/systemctl restart bagipangan-queue.service, /bin/systemctl reload nginx
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl daemon-reload, /usr/bin/systemctl restart bagipangan-backend.service, /usr/bin/systemctl restart bagipangan-frontend.service, /usr/bin/systemctl restart bagipangan-queue.service, /usr/bin/systemctl reload nginx
EOF
sudo chmod 440 /etc/sudoers.d/bagipangan-deploy
sudo visudo -cf /etc/sudoers.d/bagipangan-deploy
```

## Verification

From any machine:

```bash
curl -I https://bagipangan.eastasia.cloudapp.azure.com/bagipangan
curl https://bagipangan.eastasia.cloudapp.azure.com/api/categories
```

On the VM:

```bash
sudo systemctl is-active bagipangan-backend bagipangan-frontend bagipangan-queue nginx php8.4-fpm
curl http://127.0.0.1:8000/api/donations/categories
curl http://127.0.0.1:3000
curl http://127.0.0.1/api/categories
sudo certbot certificates
```

Useful logs:

```bash
sudo journalctl -u bagipangan-backend -n 100 --no-pager
sudo journalctl -u bagipangan-frontend -n 100 --no-pager
sudo journalctl -u bagipangan-queue -n 100 --no-pager
sudo tail -n 100 /var/log/nginx/error.log
tail -n 100 /var/www/bagipangan/current/be-laravel/storage/logs/laravel.log
```

## Notes

- Keep Laravel private on `127.0.0.1:8000`.
- Keep browser-facing API traffic on the same domain through Next.js `/api/*`.
- HTTPS is required for browser location prompts.
- Do not commit real `.env` files or secrets.
- When a JIRA ticket is involved, include the ticket ID in branch and commit names.
