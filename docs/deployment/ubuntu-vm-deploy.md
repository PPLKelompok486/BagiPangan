# Ubuntu Server 24.04 VM Deployment Guide

This guide deploys BagiPangan from GitHub `main` to one Ubuntu Server 24.04 VM.

## Assumptions

- VM OS: Ubuntu Server 24.04.
- GitHub branch: `main`.
- App path on VM: `/var/www/bagipangan`.
- Frontend domain: `bagipangan.example.com`.
- Backend/API domain: `api.bagipangan.example.com`.
- Initial VM user: your sudo-capable Ubuntu user.
- Runtime deploy user: `deploy`.

Replace these values everywhere:

```text
<VM_IP>
<OWNER>
<REPO>
bagipangan.example.com
api.bagipangan.example.com
```

## Target Architecture

- Frontend: Next.js from `fe-nextjs`, served by `bagipangan-frontend.service` on `127.0.0.1:3000`.
- Backend: Laravel from `be-laravel`, served by Nginx + PHP-FPM at `api.bagipangan.example.com`.
- Queue: Laravel `queue:work` via `bagipangan-queue.service`.
- Scheduler: Laravel scheduler via `bagipangan-scheduler.timer`.
- Deploy trigger: GitHub Actions workflow `.github/workflows/deploy-vm.yml`.
- Server path: `/var/www/bagipangan/current`.
- Production secrets: `/var/www/bagipangan/shared/backend.env` and `/var/www/bagipangan/shared/frontend.env`.

## 1. Point DNS To The VM

Create DNS records:

```text
bagipangan.example.com      A      <VM_IP>
www.bagipangan.example.com  A      <VM_IP>
api.bagipangan.example.com  A      <VM_IP>
```

If you do not have a domain yet, you can deploy first, but SSL and public domain verification must wait.

## 2. SSH Into The VM

```bash
ssh <your-ubuntu-user>@<VM_IP>
```

Update packages:

```bash
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y git
```

## 3. Clone The Repository Once

```bash
sudo mkdir -p /var/www/bagipangan/current
sudo chown -R "$USER:$USER" /var/www/bagipangan

git clone --branch main https://github.com/<OWNER>/<REPO>.git /var/www/bagipangan/current
cd /var/www/bagipangan/current
```

## 4. Bootstrap The VM

Run the bootstrap script:

```bash
chmod +x scripts/deploy/vm/*.sh

APP_NAME=bagipangan \
DEPLOY_USER=deploy \
DEPLOY_PATH=/var/www/bagipangan \
sudo -E bash scripts/deploy/vm/bootstrap-ubuntu.sh
```

This installs:

- Nginx.
- PHP 8.3 and required extensions.
- Composer.
- Node.js 22.
- Certbot.
- `deploy` user.
- Basic firewall rules for SSH, HTTP, and HTTPS.

## 5. Create GitHub Actions SSH Key

Run this on your local machine:

```bash
ssh-keygen -t ed25519 -C "github-actions-bagipangan" -f ./bagipangan_deploy_key
```

Copy the public key to the VM:

```bash
scp ./bagipangan_deploy_key.pub <your-ubuntu-user>@<VM_IP>:/tmp/bagipangan_deploy_key.pub
```

On the VM, add the key to the `deploy` user:

```bash
sudo mkdir -p /home/deploy/.ssh
sudo tee -a /home/deploy/.ssh/authorized_keys < /tmp/bagipangan_deploy_key.pub
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
rm /tmp/bagipangan_deploy_key.pub
```

## 6. Allow The Deploy User To Restart Services

On the VM:

```bash
sudo tee /etc/sudoers.d/bagipangan-deploy >/dev/null <<'EOF'
deploy ALL=(root) NOPASSWD: /bin/systemctl restart bagipangan-frontend.service, /bin/systemctl restart bagipangan-queue.service, /bin/systemctl reload nginx, /bin/systemctl daemon-reload
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart bagipangan-frontend.service, /usr/bin/systemctl restart bagipangan-queue.service, /usr/bin/systemctl reload nginx, /usr/bin/systemctl daemon-reload
EOF

sudo chmod 440 /etc/sudoers.d/bagipangan-deploy
sudo visudo -cf /etc/sudoers.d/bagipangan-deploy
```

## 7. Create Production Env Files

Create the shared env directory:

```bash
sudo mkdir -p /var/www/bagipangan/shared
```

Create backend env:

```bash
sudo cp /var/www/bagipangan/current/deploy/backend.env.example /var/www/bagipangan/shared/backend.env
sudo nano /var/www/bagipangan/shared/backend.env
```

Fill these at minimum:

```env
APP_NAME=BagiPangan
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.bagipangan.example.com

DB_CONNECTION=pgsql
DB_HOST=your-db-host
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password

SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SESSION_DOMAIN=.bagipangan.example.com
```

Generate Laravel `APP_KEY`:

```bash
cd /var/www/bagipangan/current/be-laravel
cp /var/www/bagipangan/shared/backend.env .env
php artisan key:generate --show
```

Copy the generated value into `/var/www/bagipangan/shared/backend.env`:

```env
APP_KEY=base64:...
```

Create frontend env:

```bash
sudo cp /var/www/bagipangan/current/deploy/frontend.env.production.local.example /var/www/bagipangan/shared/frontend.env
sudo nano /var/www/bagipangan/shared/frontend.env
```

Fill:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

BAGIPANGAN_BACKEND_URL=https://api.bagipangan.example.com
LARAVEL_API_BASE=https://api.bagipangan.example.com
NEXT_PUBLIC_LARAVEL_IMAGE_HOST=api.bagipangan.example.com
```

Fix ownership and permissions:

```bash
sudo chown deploy:www-data /var/www/bagipangan/shared/backend.env /var/www/bagipangan/shared/frontend.env
sudo chmod 640 /var/www/bagipangan/shared/backend.env /var/www/bagipangan/shared/frontend.env
sudo chown -R deploy:www-data /var/www/bagipangan
```

## 8. Install systemd Services

```bash
sudo cp /var/www/bagipangan/current/deploy/systemd/bagipangan-frontend.service /etc/systemd/system/
sudo cp /var/www/bagipangan/current/deploy/systemd/bagipangan-queue.service /etc/systemd/system/
sudo cp /var/www/bagipangan/current/deploy/systemd/bagipangan-scheduler.service /etc/systemd/system/
sudo cp /var/www/bagipangan/current/deploy/systemd/bagipangan-scheduler.timer /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable bagipangan-frontend.service bagipangan-queue.service bagipangan-scheduler.timer
```

Do not start the services yet. The first deploy will build the app and restart them.

## 9. Configure Nginx

Copy the Nginx template:

```bash
sudo cp /var/www/bagipangan/current/deploy/nginx/bagipangan.conf /etc/nginx/sites-available/bagipangan
sudo nano /etc/nginx/sites-available/bagipangan
```

Replace all placeholder domains:

```text
bagipangan.example.com
www.bagipangan.example.com
api.bagipangan.example.com
```

Enable the site:

```bash
sudo ln -sfn /etc/nginx/sites-available/bagipangan /etc/nginx/sites-enabled/bagipangan
sudo nginx -t
sudo systemctl reload nginx
```

## 10. Add GitHub Secrets

Open the GitHub repository:

```text
Settings > Secrets and variables > Actions > New repository secret
```

Add:

```text
VM_HOST=<VM_IP>
VM_USER=deploy
VM_PORT=22
DEPLOY_PATH=/var/www/bagipangan
RUN_MIGRATIONS=true
```

Add the private key as `VM_SSH_KEY`.

To view the private key locally:

```bash
cat ./bagipangan_deploy_key
```

Optional for private repositories:

```text
DEPLOY_REPO_URL=git@github.com:<OWNER>/<REPO>.git
```

For a public repository, the default HTTPS clone URL is enough.

## 11. Run The First Deploy

From GitHub:

```text
Actions > Deploy to Ubuntu VM > Run workflow
```

Or manually from the VM:

```bash
sudo -u deploy bash -lc '
APP_NAME=bagipangan \
DEPLOY_PATH=/var/www/bagipangan \
REPO_URL=https://github.com/<OWNER>/<REPO>.git \
BRANCH=main \
bash /var/www/bagipangan/current/scripts/deploy/vm/deploy.sh
'
```

## 12. Enable SSL

After DNS points to the VM correctly:

```bash
sudo certbot --nginx \
  -d bagipangan.example.com \
  -d www.bagipangan.example.com \
  -d api.bagipangan.example.com
```

Certbot will edit the Nginx config and reload Nginx.

## 13. Verify Deployment

Run:

```bash
/var/www/bagipangan/current/scripts/deploy/vm/check-prereqs.sh

sudo systemctl status bagipangan-frontend.service --no-pager
sudo systemctl status bagipangan-queue.service --no-pager
sudo systemctl status bagipangan-scheduler.timer --no-pager

curl -I https://bagipangan.example.com
curl -I https://api.bagipangan.example.com
```

Useful logs:

```bash
sudo journalctl -u bagipangan-frontend.service -n 100 --no-pager
sudo journalctl -u bagipangan-queue.service -n 100 --no-pager
sudo tail -n 100 /var/log/nginx/bagipangan-frontend.error.log
sudo tail -n 100 /var/log/nginx/bagipangan-backend.error.log
tail -n 100 /var/www/bagipangan/current/be-laravel/storage/logs/laravel.log
```

## 14. Daily Deploy Flow

After setup, deployment is automatic:

```bash
git push origin main
```

GitHub Actions will SSH into the VM, pull `main`, install dependencies, build the frontend, run Laravel migrations, restart services, and reload Nginx.

## Rollback

To roll back to a specific commit:

```bash
cd /var/www/bagipangan/current
git fetch origin main
git reset --hard <commit-sha>
RUN_MIGRATIONS=false bash scripts/deploy/vm/deploy.sh
```

Be careful with database migrations. Code rollback does not automatically reverse schema changes.

## JIRA Branch And Commit Convention

If a JIRA ticket is involved, include the ticket ID in branch and commit names:

```bash
git switch -c codex/BP-123-vm-deploy
git commit -m "BP-123 chore: add VM deployment automation"
```
