#!/usr/bin/env bash
set -Eeuo pipefail

# Deploy BagiPangan on an Ubuntu VM.
# Intended to be called by GitHub Actions over SSH, or manually on the VM.

APP_NAME="${APP_NAME:-bagipangan}"
REPO_URL="${REPO_URL:-git@github.com:CHANGE_ME/BagiPangan.git}"
BRANCH="${BRANCH:-main}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/bagipangan}"
APP_DIR="${APP_DIR:-${DEPLOY_PATH}/current}"
SHARED_DIR="${SHARED_DIR:-${DEPLOY_PATH}/shared}"
BACKEND_DIR="${APP_DIR}/be-laravel"
FRONTEND_DIR="${APP_DIR}/fe-nextjs"
PHP_BIN="${PHP_BIN:-php}"
COMPOSER_BIN="${COMPOSER_BIN:-composer}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-true}"
RUN_BACKEND_TESTS="${RUN_BACKEND_TESTS:-false}"
RUN_FRONTEND_BUILD="${RUN_FRONTEND_BUILD:-true}"
LOCK_FILE="${DEPLOY_PATH}/deploy.lock"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

require_file() {
  [[ -f "$1" ]] || fail "Missing required file: $1"
}

prepare_directories() {
  mkdir -p "$DEPLOY_PATH" "$SHARED_DIR" "${SHARED_DIR}/storage" "${SHARED_DIR}/logs"
}

sync_repository() {
  if [[ -d "${APP_DIR}/.git" ]]; then
    log "Updating repository ${BRANCH}"
    git -C "$APP_DIR" fetch origin "$BRANCH"
    git -C "$APP_DIR" reset --hard "origin/${BRANCH}"
  else
    log "Cloning repository ${BRANCH}"
    rm -rf "$APP_DIR"
    git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$APP_DIR"
  fi
}

link_environment_files() {
  require_file "${SHARED_DIR}/backend.env"
  require_file "${SHARED_DIR}/frontend.env"

  ln -sfn "${SHARED_DIR}/backend.env" "${BACKEND_DIR}/.env"
  ln -sfn "${SHARED_DIR}/frontend.env" "${FRONTEND_DIR}/.env.production.local"
}

deploy_backend() {
  log "Installing Laravel dependencies"
  cd "$BACKEND_DIR"
  "$COMPOSER_BIN" install \
    --no-dev \
    --prefer-dist \
    --no-interaction \
    --optimize-autoloader

  log "Preparing Laravel storage and cache"
  mkdir -p storage bootstrap/cache
  if [[ ! -L storage/app/public ]]; then
    "$PHP_BIN" artisan storage:link || true
  fi

  "$PHP_BIN" artisan config:clear
  "$PHP_BIN" artisan route:clear
  "$PHP_BIN" artisan view:clear

  if [[ "$RUN_BACKEND_TESTS" == "true" ]]; then
    log "Running backend tests"
    "$PHP_BIN" artisan test
  fi

  if [[ "$RUN_MIGRATIONS" == "true" ]]; then
    log "Running database migrations"
    "$PHP_BIN" artisan migrate --force
  fi

  "$PHP_BIN" artisan config:cache
  "$PHP_BIN" artisan route:cache
  "$PHP_BIN" artisan view:cache

  chgrp -R www-data storage bootstrap/cache || true
  chmod -R ug+rwX storage bootstrap/cache || true
}

deploy_frontend() {
  log "Installing Next.js dependencies"
  cd "$FRONTEND_DIR"
  npm ci

  if [[ "$RUN_FRONTEND_BUILD" == "true" ]]; then
    log "Building Next.js"
    npm run build
  fi
}

restart_services() {
  log "Restarting services"
  if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl restart "${APP_NAME}-frontend.service"
    sudo systemctl restart "${APP_NAME}-queue.service" || true
    sudo systemctl reload nginx
  else
    fail "systemctl is required on the VM"
  fi
}

health_check() {
  log "Running local health checks"
  for attempt in {1..12}; do
    if curl -fsS --max-time 10 "http://127.0.0.1:3000" >/dev/null; then
      break
    fi

    if [[ "$attempt" == "12" ]]; then
      fail "Frontend did not respond on http://127.0.0.1:3000"
    fi

    sleep 5
  done

  curl -fsS --max-time 10 "http://127.0.0.1/api/health" >/dev/null || true
}

main() {
  prepare_directories
  exec 9>"$LOCK_FILE"
  flock -n 9 || fail "Another deployment is already running"

  sync_repository
  link_environment_files
  deploy_backend
  deploy_frontend
  restart_services
  health_check

  log "Deployment finished"
}

main "$@"
