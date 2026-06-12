# Ubuntu VM Deployment Guide

This guide sets up automated deployment from GitHub `main` to an Ubuntu VM.

## Target Architecture

- Frontend: Next.js from `fe-nextjs`, served by `bagipangan-frontend.service` on `127.0.0.1:3000`.
- Backend: Laravel from `be-laravel`, served by Nginx + PHP-FPM at `api.bagipangan.example.com`.
- Queue: Laravel `queue:work` via `bagipangan-queue.service`.
- Scheduler: Laravel scheduler via systemd timer.
- Deploy trigger: GitHub Actions workflow `.github/workflows/deploy-vm.yml`.
- Server path: `/var/www/bagipangan/current`.
- Production secrets: `/var/www/bagipangan/shared/backend.env` and `/var/www/bagipangan/shared/frontend.env`.

## 1. Prepare DNS

Create DNS records that point to your VM public IP:

```text
bagipangan.example.com      A      <VM_PUBLIC_IP>
www.bagipangan.example.com  A      <VM_PUBLIC_IP>
api.bagipangan.example.com  A      <VM_PUBLIC_IP>
```

Replace these domains in every command and config below.

## 2. Bootstrap the VM

SSH into the VM with a sudo-capable user:

```bash
ssh <ubuntu-user>@<vm-ip>
```

Install Git first if needed:

```bash
sudo apt-get update
sudo apt-get install -y git
```

Clone the repo once:

```bash
sudo mkdir -p /var/www/bagipangan/current
sudo chown -R "$USER:$USER" /var/www/bagipangan
git clone --branch main https://github.com/<owner>/<repo>.git /var/www/bagipangan/current
cd /var/www/bagipangan/current
```

Run the bootstrap script:

```bash
chmod +x scripts/deploy/vm/*.sh
APP_NAME=bagipangan DEPLOY_USER=deploy DEPLOY_PATH=/var/www/bagipangan sudo -E bash scripts/deploy/vm/bootstrap-ubuntu.sh
```

## 3. Configure SSH for GitHub Actions

Create an SSH key on your local machine or the VM:

```bash
ssh-keygen -t ed25519 -C "github-actions-bagipangan" -f ./bagipangan_deploy_key
```

Add the public key to the VM:

```bash
sudo mkdir -p /home/deploy/.ssh
sudo tee -a /home/deploy/.ssh/authorized_keys < ./bagipangan_deploy_key.pub
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

Allow the deploy user to restart only the required services without a password:

```bash
sudo tee /etc/sudoers.d/bagipangan-deploy >/dev/null <<'EOF'
deploy ALL=(root) NOPASSWD: /bin/systemctl restart bagipangan-frontend.service, /bin/systemctl restart bagipangan-queue.service, /bin/systemctl reload nginx, /bin/systemctl daemon-reload
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart bagipangan-frontend.service, /usr/bin/systemctl restart bagipangan-queue.service, /usr/bin/systemctl reload nginx, /usr/bin/systemctl daemon-reload
EOF
sudo chmod 440 /etc/sudoers.d/bagipangan-deploy
sudo visudo -cf /etc/sudoers.d/bagipangan-deploy
```

If your repo is private, also add a GitHub deploy key for the VM or set `DEPLOY_REPO_URL` to an accessible repository URL in GitHub secrets.

## 4. Create Production Env Files on the VM

Create backend env:

```bash
sudo cp /var/www/bagipangan/current/deploy/backend.env.example /var/www/bagipangan/shared/backend.env
sudo nano /var/www/bagipangan/shared/backend.env
```

Generate `APP_KEY`:

```bash
cd /var/www/bagipangan/current/be-laravel
cp /var/www/bagipangan/shared/backend.env .env
php artisan key:generate --show
```

Paste the generated value into `/var/www/bagipangan/shared/backend.env`.

Create frontend env:

```bash
sudo cp /var/www/bagipangan/current/deploy/frontend.env.production.local.example /var/www/bagipangan/shared/frontend.env
sudo nano /var/www/bagipangan/shared/frontend.env
```

Set ownership and permissions:

```bash
sudo chown deploy:www-data /var/www/bagipangan/shared/backend.env /var/www/bagipangan/shared/frontend.env
sudo chmod 640 /var/www/bagipangan/shared/backend.env /var/www/bagipangan/shared/frontend.env
```

## 5. Install systemd Services

```bash
sudo cp /var/www/bagipangan/current/deploy/systemd/bagipangan-frontend.service /etc/systemd/system/
sudo cp /var/www/bagipangan/current/deploy/systemd/bagipangan-queue.service /etc/systemd/system/
sudo cp /var/www/bagipangan/current/deploy/systemd/bagipangan-scheduler.service /etc/systemd/system/
sudo cp /var/www/bagipangan/current/deploy/systemd/bagipangan-scheduler.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable bagipangan-frontend.service bagipangan-queue.service bagipangan-scheduler.timer
```

Do not start the services yet if the app has not been built. The first deploy will start them.

## 6. Install Nginx Config

Copy the template:

```bash
sudo cp /var/www/bagipangan/current/deploy/nginx/bagipangan.conf /etc/nginx/sites-available/bagipangan
sudo nano /etc/nginx/sites-available/bagipangan
```

Replace:

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

Issue SSL certificates:

```bash
sudo certbot --nginx -d bagipangan.example.com -d www.bagipangan.example.com -d api.bagipangan.example.com
```

## 7. Add GitHub Secrets

In GitHub, open repository settings:

```text
Settings > Secrets and variables > Actions > New repository secret
```

Add:

```text
VM_HOST=<vm-public-ip-or-domain>
VM_USER=deploy
VM_SSH_KEY=<contents of bagipangan_deploy_key private key>
VM_PORT=22
DEPLOY_PATH=/var/www/bagipangan
RUN_MIGRATIONS=true
```

Optional:

```text
DEPLOY_REPO_URL=git@github.com:<owner>/<repo>.git
```

Use `DEPLOY_REPO_URL` if the repo is private and the VM has an SSH key that can clone it.

## 8. Run First Deploy

From GitHub:

```text
Actions > Deploy to Ubuntu VM > Run workflow
```

Or manually on the VM:

```bash
sudo -u deploy bash -lc 'APP_NAME=bagipangan DEPLOY_PATH=/var/www/bagipangan REPO_URL=https://github.com/<owner>/<repo>.git BRANCH=main bash /var/www/bagipangan/current/scripts/deploy/vm/deploy.sh'
```

## 9. Verify

On the VM:

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

## 10. Daily Deploy Flow

After setup, deploy is automatic:

```bash
git push origin main
```

GitHub Actions will SSH into the VM and run:

```bash
bash scripts/deploy/vm/deploy.sh
```

## Rollback

To roll back to a specific commit:

```bash
cd /var/www/bagipangan/current
git fetch origin main
git reset --hard <commit-sha>
RUN_MIGRATIONS=false bash scripts/deploy/vm/deploy.sh
```

Be careful with database migrations. Code rollback does not automatically reverse schema changes.

## JIRA Branch and Commit Convention

If a JIRA ticket is involved, include the ticket ID in branch and commit names, for example:

```bash
git switch -c codex/BP-123-vm-deploy
git commit -m "BP-123 chore: add VM deployment automation"
```
