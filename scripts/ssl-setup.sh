#!/bin/bash

# ===============================================
# D&D AI Game - SSL Certificate Setup Script
# ===============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    if [ -z "$DOMAIN" ]; then
        log_error "Please set DOMAIN environment variable."
        echo "Usage: DOMAIN=example.com EMAIL=admin@example.com $0"
        exit 1
    fi

    if [ -z "$EMAIL" ]; then
        log_error "Please set EMAIL environment variable."
        echo "Usage: DOMAIN=example.com EMAIL=admin@example.com $0"
        exit 1
    fi

    log_info "Domain: $DOMAIN"
    log_info "Email: $EMAIL"
}

create_directories() {
    log_info "Creating certificate directories..."

    mkdir -p "$PROJECT_DIR/certbot/conf"
    mkdir -p "$PROJECT_DIR/certbot/www"
    mkdir -p "$PROJECT_DIR/certbot/logs"

    log_info "Directories created."
}

update_nginx_config() {
    log_info "Updating nginx configuration with your domain..."

    local NGINX_CONFIG="$PROJECT_DIR/nginx/conf.d/dnd-game.conf"

    if [ -f "$NGINX_CONFIG" ]; then
        # Create backup
        cp "$NGINX_CONFIG" "${NGINX_CONFIG}.bak"

        # Replace example.com with actual domain
        sed -i "s/example\.com/$DOMAIN/g" "$NGINX_CONFIG"

        log_info "Nginx configuration updated. Backup saved at ${NGINX_CONFIG}.bak"
    else
        log_error "Nginx configuration file not found: $NGINX_CONFIG"
        exit 1
    fi
}

obtain_certificate() {
    log_info "Obtaining SSL certificate from Let's Encrypt..."

    cd "$PROJECT_DIR"

    # Stop nginx if running to free up port 80
    if docker ps | grep -q dnd-nginx-prod; then
        log_info "Stopping nginx container..."
        docker-compose -f docker-compose.prod.yml stop nginx
    fi

    # Run certbot in standalone mode
    docker run -it --rm \
        -v "$PROJECT_DIR/certbot/conf:/etc/letsencrypt" \
        -v "$PROJECT_DIR/certbot/www:/var/www/certbot" \
        -v "$PROJECT_DIR/certbot/logs:/var/log/letsencrypt" \
        -p 80:80 \
        certbot/certbot certonly \
        --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --force-renewal \
        -d "$DOMAIN" \
        -d "www.$DOMAIN"

    if [ $? -eq 0 ]; then
        log_info "SSL certificate obtained successfully!"
    else
        log_error "Failed to obtain SSL certificate."
        exit 1
    fi

    # Start nginx again
    if docker ps -a | grep -q dnd-nginx-prod; then
        log_info "Starting nginx container..."
        docker-compose -f docker-compose.prod.yml start nginx
    fi
}

test_renewal() {
    log_info "Testing certificate renewal..."

    cd "$PROJECT_DIR"

    docker-compose -f docker-compose.prod.yml run --rm certbot renew --dry-run

    if [ $? -eq 0 ]; then
        log_info "Certificate renewal test successful!"
    else
        log_warn "Certificate renewal test failed. Check logs."
    fi
}

setup_cron() {
    log_info "Setting up automatic certificate renewal..."

    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "certbot renew"; then
        log_warn "Cron job already exists. Skipping."
        return
    fi

    # Add cron job to renew certificates twice a day
    (crontab -l 2>/dev/null; echo "0 0,12 * * * cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml run --rm certbot renew --quiet && docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload") | crontab -

    log_info "Cron job added for automatic certificate renewal."
    log_info "Certificates will be renewed automatically twice a day."
}

# Main function
main() {
    log_info "Starting SSL certificate setup..."

    check_requirements
    create_directories
    update_nginx_config
    obtain_certificate
    test_renewal
    setup_cron

    log_info "SSL certificate setup completed successfully!"
    log_info "Your site should now be accessible at: https://$DOMAIN"
}

main "$@"
