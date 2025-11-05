#!/bin/bash

# ===============================================
# D&D AI Game - Production Deployment Script
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
ENV_FILE="$PROJECT_DIR/.env.production"
BACKUP_DIR="$PROJECT_DIR/backups"

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
    log_info "Checking requirements..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    if [ ! -f "$ENV_FILE" ]; then
        log_error ".env.production file not found!"
        log_info "Please copy .env.production.example to .env.production and fill in your values."
        exit 1
    fi

    log_info "All requirements met."
}

backup_database() {
    log_info "Creating database backup before deployment..."

    mkdir -p "$BACKUP_DIR"

    # Check if database container is running
    if docker ps | grep -q dnd-database-prod; then
        BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql"

        # Load environment variables
        source "$ENV_FILE"

        docker exec dnd-database-prod pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

        if [ $? -eq 0 ]; then
            log_info "Database backup created: $BACKUP_FILE"
            gzip "$BACKUP_FILE"
            log_info "Backup compressed: ${BACKUP_FILE}.gz"
        else
            log_warn "Database backup failed, but continuing deployment..."
        fi
    else
        log_warn "Database container not running, skipping backup."
    fi
}

build_images() {
    log_info "Building Docker images..."

    cd "$PROJECT_DIR"

    # Build with no cache for clean build (optional: remove --no-cache for faster builds)
    docker-compose -f docker-compose.prod.yml build --no-cache

    log_info "Docker images built successfully."
}

run_migrations() {
    log_info "Running database migrations..."

    cd "$PROJECT_DIR"

    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    sleep 10

    # Run migrations
    docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

    if [ $? -eq 0 ]; then
        log_info "Database migrations completed successfully."
    else
        log_error "Database migrations failed!"
        exit 1
    fi
}

start_services() {
    log_info "Starting services..."

    cd "$PROJECT_DIR"

    docker-compose -f docker-compose.prod.yml up -d

    log_info "Services started."
}

stop_services() {
    log_info "Stopping services..."

    cd "$PROJECT_DIR"

    docker-compose -f docker-compose.prod.yml down

    log_info "Services stopped."
}

restart_services() {
    log_info "Restarting services..."

    cd "$PROJECT_DIR"

    docker-compose -f docker-compose.prod.yml restart

    log_info "Services restarted."
}

check_health() {
    log_info "Checking service health..."

    cd "$PROJECT_DIR"

    sleep 5

    # Check if all services are healthy
    docker-compose -f docker-compose.prod.yml ps

    log_info "Waiting for services to be healthy (max 60 seconds)..."

    for i in {1..12}; do
        if docker ps | grep -E "dnd-(backend|frontend)-prod" | grep -q "healthy"; then
            log_info "Services are healthy!"
            log_info ""
            log_info "🎲 D&D AI Game is now running!"
            log_info "   Frontend: http://localhost:8080 (proxied via Apache to https://dnd.scorvan.it)"
            log_info "   Backend:  http://localhost:3100 (proxied via Apache to https://dnd.scorvan.it/api)"
            log_info "   Database: localhost:5433 (internal Docker network)"
            log_info ""
            log_info "Public URL: https://dnd.scorvan.it"
            return 0
        fi
        sleep 5
    done

    log_warn "Some services may not be healthy. Check logs with: docker-compose -f docker-compose.prod.yml logs"
}

view_logs() {
    cd "$PROJECT_DIR"
    docker-compose -f docker-compose.prod.yml logs -f --tail=100
}

# Main deployment flow
main() {
    log_info "Starting D&D AI Game deployment..."

    case "${1:-deploy}" in
        deploy)
            check_requirements
            backup_database
            build_images
            stop_services
            start_services
            run_migrations
            check_health
            log_info "Deployment completed successfully!"
            log_info "Your application should be available at your configured domain."
            ;;
        build)
            check_requirements
            build_images
            ;;
        start)
            check_requirements
            start_services
            check_health
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            check_health
            ;;
        logs)
            view_logs
            ;;
        migrate)
            run_migrations
            ;;
        backup)
            backup_database
            ;;
        *)
            echo "Usage: $0 {deploy|build|start|stop|restart|logs|migrate|backup}"
            echo ""
            echo "Commands:"
            echo "  deploy   - Full deployment (build, stop, start, migrate)"
            echo "  build    - Build Docker images only"
            echo "  start    - Start services"
            echo "  stop     - Stop services"
            echo "  restart  - Restart services"
            echo "  logs     - View service logs"
            echo "  migrate  - Run database migrations"
            echo "  backup   - Create database backup"
            exit 1
            ;;
    esac
}

main "$@"
