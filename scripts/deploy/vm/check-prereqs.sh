#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/var/www/bagipangan}"
PHP_VERSION="${PHP_VERSION:-8.3}"

check_command() {
  if command -v "$1" >/dev/null 2>&1; then
    printf '[ok] %s: %s\n' "$1" "$("$1" --version 2>/dev/null | head -n 1)"
  else
    printf '[missing] %s\n' "$1"
  fi
}

check_file() {
  if [[ -e "$1" ]]; then
    printf '[ok] %s\n' "$1"
  else
    printf '[missing] %s\n' "$1"
  fi
}

check_command git
check_command php
check_command composer
check_command node
check_command npm
check_command nginx
check_command curl

if systemctl list-unit-files | grep -q "php${PHP_VERSION}-fpm.service"; then
  printf '[ok] php%s-fpm service exists\n' "$PHP_VERSION"
else
  printf '[missing] php%s-fpm service\n' "$PHP_VERSION"
fi

check_file "${DEPLOY_PATH}/shared/backend.env"
check_file "${DEPLOY_PATH}/shared/frontend.env"
check_file "/etc/systemd/system/bagipangan-frontend.service"
check_file "/etc/systemd/system/bagipangan-queue.service"
check_file "/etc/nginx/sites-available/bagipangan"
