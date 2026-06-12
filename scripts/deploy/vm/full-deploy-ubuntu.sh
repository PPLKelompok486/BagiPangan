#!/usr/bin/env bash
set -Eeuo pipefail

# Full Ubuntu VM deployment for BagiPangan.
# This script matches the currently deployed VM architecture:
# - Ubuntu 24.04
# - PHP 8.4 + Laravel served internally on 127.0.0.1:8000
# - Next.js served internally on 127.0.0.1:3000
# - Nginx public reverse proxy for a single domain
# - Supabase PostgreSQL via Laravel .env
# - Certbot HTTPS for the public domain

APP_NAME="${APP_NAME:-bagipangan}"
DOMAIN="${DOMAIN:-bagipangan.eastasia.cloudapp.azure.com}"
REPO_URL="${REPO_URL:-https://github.com/PPLKelompok486/BagiPangan.git}"
BRANCH="${BRANCH:-main}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/bagipangan}"
APP_DIR="${DEPLOY_PATH}/current"
SHARED_DIR="${DEPLOY_PATH}/shared"
PHP_VERSION="${PHP_VERSION:-8.4}"
NODE_MAJOR="${NODE_MAJOR:-22}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-true}"
ENABLE_HTTPS="${ENABLE_HTTPS:-true}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@${DOMAIN}}"
SWAP_SIZE="${SWAP_SIZE:-2G}"

if [[ "$(id -u)" -ne 0 ]]; then
  SUDO="sudo"
else
  SUDO=""
fi

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

run_as_deploy() {
  if [[ "$(id -un)" == "$DEPLOY_USER" ]]; then
    "$@"
  else
    sudo -u "$DEPLOY_USER" "$@"
  fi
}

require_file() {
  [[ -f "$1" ]] || {
    echo "Missing required file: $1" >&2
    exit 1
  }
}

install_packages() {
  log "Installing OS packages"
  $SUDO apt-get update
  $SUDO apt-get install -y \
    ca-certificates \
    certbot \
    curl \
    git \
    gnupg \
    nginx \
    python3-certbot-nginx \
    software-properties-common \
    ufw \
    unzip

  if ! apt-cache policy "php${PHP_VERSION}-fpm" | grep -q Candidate; then
    $SUDO add-apt-repository -y ppa:ondrej/php
    $SUDO apt-get update
  fi

  $SUDO apt-get install -y \
    "php${PHP_VERSION}-cli" \
    "php${PHP_VERSION}-curl" \
    "php${PHP_VERSION}-fpm" \
    "php${PHP_VERSION}-mbstring" \
    "php${PHP_VERSION}-pgsql" \
    "php${PHP_VERSION}-xml" \
    "php${PHP_VERSION}-zip" \
    "php${PHP_VERSION}-bcmath" \
    "php${PHP_VERSION}-intl"

  $SUDO update-alternatives --set php "/usr/bin/php${PHP_VERSION}" || true
  $SUDO systemctl enable --now "php${PHP_VERSION}-fpm"

  if ! command -v composer >/dev/null 2>&1; then
    log "Installing Composer"
    curl -fsSL https://getcomposer.org/installer -o /tmp/composer-setup.php
    $SUDO php /tmp/composer-setup.php --install-dir=/usr/local/bin --filename=composer
    rm -f /tmp/composer-setup.php
  fi

  if ! command -v node >/dev/null 2>&1 || ! node --version | grep -q "^v${NODE_MAJOR}\\."; then
    log "Installing Node.js ${NODE_MAJOR}"
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | $SUDO -E bash -
    $SUDO apt-get install -y nodejs
  fi
}

configure_swap() {
  if swapon --show | grep -q '/swapfile'; then
    return
  fi

  log "Creating ${SWAP_SIZE} swapfile"
  $SUDO fallocate -l "$SWAP_SIZE" /swapfile || $SUDO dd if=/dev/zero of=/swapfile bs=1M count=2048
  $SUDO chmod 600 /swapfile
  $SUDO mkswap /swapfile
  $SUDO swapon /swapfile
  if ! grep -q '^/swapfile ' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' | $SUDO tee -a /etc/fstab >/dev/null
  fi
}

prepare_user_and_repo() {
  log "Preparing deploy user and repository"
  if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
    $SUDO adduser --disabled-password --gecos "" "$DEPLOY_USER"
  fi

  $SUDO usermod -aG www-data "$DEPLOY_USER"
  $SUDO mkdir -p "$DEPLOY_PATH" "$SHARED_DIR"
  $SUDO chown -R "$DEPLOY_USER:www-data" "$DEPLOY_PATH"
  $SUDO chmod -R 775 "$DEPLOY_PATH"

  if [[ -d "${APP_DIR}/.git" ]]; then
    run_as_deploy git -C "$APP_DIR" fetch origin "$BRANCH"
    run_as_deploy git -C "$APP_DIR" reset --hard "origin/${BRANCH}"
  else
    $SUDO rm -rf "$APP_DIR"
    run_as_deploy git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$APP_DIR"
  fi
}

link_env_files() {
  log "Linking production env files"
  require_file "${SHARED_DIR}/backend.env"
  require_file "${SHARED_DIR}/frontend.env"
  run_as_deploy ln -sfn "${SHARED_DIR}/backend.env" "${APP_DIR}/be-laravel/.env"
  run_as_deploy ln -sfn "${SHARED_DIR}/frontend.env" "${APP_DIR}/fe-nextjs/.env.production.local"
}

deploy_laravel() {
  log "Deploying Laravel"
  cd "${APP_DIR}/be-laravel"
  run_as_deploy composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader
  run_as_deploy php artisan config:clear
  run_as_deploy php artisan route:clear
  run_as_deploy php artisan view:clear
  run_as_deploy php artisan cache:clear

  if [[ "$RUN_MIGRATIONS" == "true" ]]; then
    run_as_deploy php artisan migrate --force
  fi

  run_as_deploy php artisan storage:link || true
  run_as_deploy php artisan config:cache
  run_as_deploy php artisan route:cache
  run_as_deploy php artisan view:cache
  $SUDO chown -R "$DEPLOY_USER:www-data" storage bootstrap/cache
  $SUDO chmod -R ug+rwX storage bootstrap/cache
}

deploy_nextjs() {
  log "Deploying Next.js"
  cd "${APP_DIR}/fe-nextjs"
  run_as_deploy npm ci --no-audit --no-fund
  run_as_deploy npm run build
}

write_systemd_units() {
  log "Writing systemd units"
  $SUDO tee "/etc/systemd/system/${APP_NAME}-backend.service" >/dev/null <<EOF
[Unit]
Description=BagiPangan Laravel API server
After=network.target

[Service]
Type=simple
User=${DEPLOY_USER}
Group=www-data
WorkingDirectory=${APP_DIR}/be-laravel
ExecStart=/usr/bin/php artisan serve --host=127.0.0.1 --port=8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

  $SUDO tee "/etc/systemd/system/${APP_NAME}-frontend.service" >/dev/null <<EOF
[Unit]
Description=BagiPangan Next.js frontend
After=network.target

[Service]
Type=simple
User=${DEPLOY_USER}
Group=www-data
WorkingDirectory=${APP_DIR}/fe-nextjs
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

  $SUDO tee "/etc/systemd/system/${APP_NAME}-queue.service" >/dev/null <<EOF
[Unit]
Description=BagiPangan Laravel queue worker
After=network.target

[Service]
Type=simple
User=${DEPLOY_USER}
Group=www-data
WorkingDirectory=${APP_DIR}/be-laravel
ExecStart=/usr/bin/php artisan queue:work --sleep=3 --tries=3 --timeout=90
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

  $SUDO tee "/etc/systemd/system/${APP_NAME}-scheduler.service" >/dev/null <<EOF
[Unit]
Description=BagiPangan Laravel scheduler
After=network.target

[Service]
Type=oneshot
User=${DEPLOY_USER}
Group=www-data
WorkingDirectory=${APP_DIR}/be-laravel
ExecStart=/usr/bin/php artisan schedule:run
EOF

  $SUDO tee "/etc/systemd/system/${APP_NAME}-scheduler.timer" >/dev/null <<EOF
[Unit]
Description=Run BagiPangan Laravel scheduler every minute

[Timer]
OnCalendar=*-*-* *:*:00
Persistent=true
Unit=${APP_NAME}-scheduler.service

[Install]
WantedBy=timers.target
EOF
}

write_nginx_config() {
  log "Writing Nginx config"
  $SUDO tee /etc/nginx/sites-available/bagipangan >/dev/null <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ${DOMAIN};
    client_max_body_size 20m;

    location /storage/ {
        alias ${APP_DIR}/be-laravel/public/storage/;
        try_files \$uri \$uri/ =404;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
    }
}
EOF

  $SUDO rm -f /etc/nginx/sites-enabled/default
  $SUDO ln -sfn /etc/nginx/sites-available/bagipangan /etc/nginx/sites-enabled/bagipangan
  $SUDO nginx -t
}

start_services() {
  log "Starting services"
  $SUDO systemctl daemon-reload
  $SUDO systemctl enable --now \
    "php${PHP_VERSION}-fpm" \
    nginx \
    "${APP_NAME}-backend.service" \
    "${APP_NAME}-frontend.service" \
    "${APP_NAME}-queue.service" \
    "${APP_NAME}-scheduler.timer"

  $SUDO systemctl restart \
    "php${PHP_VERSION}-fpm" \
    "${APP_NAME}-backend.service" \
    "${APP_NAME}-frontend.service" \
    "${APP_NAME}-queue.service"

  $SUDO systemctl reload nginx
  $SUDO ufw allow OpenSSH >/dev/null || true
  $SUDO ufw allow 'Nginx Full' >/dev/null || true
  $SUDO ufw --force enable >/dev/null || true
}

enable_https() {
  if [[ "$ENABLE_HTTPS" != "true" ]]; then
    return
  fi

  log "Issuing or renewing HTTPS certificate"
  $SUDO certbot --nginx \
    --cert-name "$DOMAIN" \
    -d "$DOMAIN" \
    --non-interactive \
    --agree-tos \
    -m "$CERTBOT_EMAIL" \
    --redirect \
    --key-type rsa

  $SUDO nginx -t
  $SUDO systemctl reload nginx
}

health_check() {
  log "Running health checks"
  curl -fsS --max-time 10 "http://127.0.0.1:8000/api/donations/categories" >/dev/null
  curl -fsS --max-time 10 "http://127.0.0.1:3000" >/dev/null
  curl -fsS --max-time 10 "http://127.0.0.1/api/categories" >/dev/null
  if [[ "$ENABLE_HTTPS" == "true" ]]; then
    curl -fsS --max-time 20 "https://${DOMAIN}/bagipangan" >/dev/null || true
  fi
}

main() {
  install_packages
  configure_swap
  prepare_user_and_repo
  link_env_files
  deploy_laravel
  deploy_nextjs
  write_systemd_units
  write_nginx_config
  start_services
  enable_https
  health_check
  log "Deployment complete: https://${DOMAIN}/bagipangan"
}

main "$@"
