#!/usr/bin/env bash
set -Eeuo pipefail

# One-time Ubuntu VM bootstrap for BagiPangan.
# Run as a sudo-capable user on the VM.

APP_NAME="${APP_NAME:-bagipangan}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/bagipangan}"
NODE_MAJOR="${NODE_MAJOR:-22}"
PHP_VERSION="${PHP_VERSION:-8.4}"
SWAP_SIZE="${SWAP_SIZE:-2G}"

if [[ "$(id -u)" -ne 0 ]]; then
  SUDO="sudo"
else
  SUDO=""
fi

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

require_ubuntu() {
  if [[ ! -f /etc/os-release ]]; then
    echo "Cannot detect OS. This script expects Ubuntu." >&2
    exit 1
  fi

  # shellcheck disable=SC1091
  source /etc/os-release
  if [[ "${ID:-}" != "ubuntu" ]]; then
    echo "This script expects Ubuntu. Detected: ${PRETTY_NAME:-unknown}" >&2
    exit 1
  fi
}

install_base_packages() {
  log "Installing base packages"
  $SUDO apt-get update
  $SUDO apt-get install -y \
    ca-certificates \
    curl \
    git \
    gnupg \
    lsb-release \
    nginx \
    unzip \
    ufw \
    software-properties-common \
    certbot \
    python3-certbot-nginx
}

install_php() {
  log "Installing PHP ${PHP_VERSION} and extensions"
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

  $SUDO systemctl enable --now "php${PHP_VERSION}-fpm"
  $SUDO update-alternatives --set php "/usr/bin/php${PHP_VERSION}" || true
}

install_composer() {
  if command -v composer >/dev/null 2>&1; then
    log "Composer already installed"
    return
  fi

  log "Installing Composer"
  curl -fsSL https://getcomposer.org/installer -o /tmp/composer-setup.php
  $SUDO php /tmp/composer-setup.php --install-dir=/usr/local/bin --filename=composer
  rm -f /tmp/composer-setup.php
}

install_node() {
  if command -v node >/dev/null 2>&1 && node --version | grep -q "^v${NODE_MAJOR}\\."; then
    log "Node ${NODE_MAJOR} already installed"
    return
  fi

  log "Installing Node.js ${NODE_MAJOR}"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | $SUDO -E bash -
  $SUDO apt-get install -y nodejs
}

configure_swap() {
  if swapon --show | grep -q '/swapfile'; then
    log "Swapfile already configured"
    return
  fi

  log "Creating ${SWAP_SIZE} swapfile for small VMs"
  $SUDO fallocate -l "$SWAP_SIZE" /swapfile || $SUDO dd if=/dev/zero of=/swapfile bs=1M count=2048
  $SUDO chmod 600 /swapfile
  $SUDO mkswap /swapfile
  $SUDO swapon /swapfile
  if ! grep -q '^/swapfile ' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' | $SUDO tee -a /etc/fstab >/dev/null
  fi
}

create_deploy_user() {
  if id "$DEPLOY_USER" >/dev/null 2>&1; then
    log "User ${DEPLOY_USER} already exists"
  else
    log "Creating user ${DEPLOY_USER}"
    $SUDO adduser --disabled-password --gecos "" "$DEPLOY_USER"
  fi

  $SUDO usermod -aG www-data "$DEPLOY_USER"
  $SUDO mkdir -p "$DEPLOY_PATH"/{current,shared,shared/storage,shared/logs}
  $SUDO chown -R "$DEPLOY_USER:www-data" "$DEPLOY_PATH"
  $SUDO chmod -R 775 "$DEPLOY_PATH"
}

configure_firewall() {
  log "Configuring firewall"
  $SUDO ufw allow OpenSSH
  $SUDO ufw allow 'Nginx Full'
  $SUDO ufw --force enable
}

main() {
  require_ubuntu
  install_base_packages
  install_php
  install_composer
  install_node
  configure_swap
  create_deploy_user
  configure_firewall

  log "Bootstrap complete"
  cat <<EOF

Next steps:
1. Add your GitHub deploy SSH public key to /home/${DEPLOY_USER}/.ssh/authorized_keys.
2. Clone the repository into ${DEPLOY_PATH}/current or let the deploy script do it.
3. Create ${DEPLOY_PATH}/shared/backend.env and ${DEPLOY_PATH}/shared/frontend.env.
4. Install Nginx and systemd templates from this repository.

EOF
}

main "$@"
