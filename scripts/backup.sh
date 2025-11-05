#!/bin/bash

# ===============================================
# D&D AI Game - Database Backup Script
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
RETENTION_DAYS=30  # Keep backups for 30 days

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
    if [ ! -f "$ENV_FILE" ]; then
        log_error ".env.production file not found!"
        exit 1
    fi

    if ! docker ps | grep -q dnd-database-prod; then
        log_error "Database container is not running!"
        exit 1
    fi

    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
}

create_backup() {
    log_info "Creating database backup..."

    # Load environment variables
    source "$ENV_FILE"

    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/dnd-backup-${TIMESTAMP}.sql"

    # Create backup using pg_dump
    docker exec dnd-database-prod pg_dump -U "$DB_USER" -d "$DB_NAME" --format=custom > "$BACKUP_FILE"

    if [ $? -eq 0 ]; then
        log_info "Database backup created: $BACKUP_FILE"

        # Compress backup
        gzip "$BACKUP_FILE"
        COMPRESSED_FILE="${BACKUP_FILE}.gz"

        # Get file size
        FILE_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
        log_info "Backup compressed: $COMPRESSED_FILE (Size: $FILE_SIZE)"

        echo "$COMPRESSED_FILE"
        return 0
    else
        log_error "Database backup failed!"
        return 1
    fi
}

restore_backup() {
    local BACKUP_FILE="$1"

    if [ -z "$BACKUP_FILE" ]; then
        log_error "Please specify a backup file to restore."
        list_backups
        exit 1
    fi

    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi

    log_warn "WARNING: This will restore the database from backup!"
    log_warn "Current database will be overwritten."
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
        log_info "Restore cancelled."
        exit 0
    fi

    log_info "Restoring database from: $BACKUP_FILE"

    # Load environment variables
    source "$ENV_FILE"

    # Decompress if needed
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        log_info "Decompressing backup..."
        TEMP_FILE="${BACKUP_FILE%.gz}"
        gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
        RESTORE_FILE="$TEMP_FILE"
    else
        RESTORE_FILE="$BACKUP_FILE"
    fi

    # Stop backend to prevent connections
    log_info "Stopping backend service..."
    docker-compose -f "$PROJECT_DIR/docker-compose.prod.yml" stop backend

    # Restore database
    cat "$RESTORE_FILE" | docker exec -i dnd-database-prod pg_restore -U "$DB_USER" -d "$DB_NAME" --clean --if-exists

    if [ $? -eq 0 ]; then
        log_info "Database restored successfully!"
    else
        log_error "Database restore failed!"
    fi

    # Clean up temp file if created
    if [[ "$BACKUP_FILE" == *.gz ]] && [ -f "$TEMP_FILE" ]; then
        rm "$TEMP_FILE"
    fi

    # Start backend again
    log_info "Starting backend service..."
    docker-compose -f "$PROJECT_DIR/docker-compose.prod.yml" start backend

    log_info "Restore completed."
}

list_backups() {
    log_info "Available backups in $BACKUP_DIR:"
    echo ""

    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
        log_warn "No backups found."
        return
    fi

    ls -lh "$BACKUP_DIR" | grep -E "\.sql(\.gz)?$" | awk '{printf "%-10s %s %s %s  %s\n", $5, $6, $7, $8, $9}'
    echo ""
    log_info "Total backups: $(ls -1 "$BACKUP_DIR" | wc -l)"
}

cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."

    if [ ! -d "$BACKUP_DIR" ]; then
        log_warn "Backup directory does not exist."
        return
    fi

    DELETED_COUNT=$(find "$BACKUP_DIR" -name "dnd-backup-*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)

    if [ "$DELETED_COUNT" -gt 0 ]; then
        log_info "Deleted $DELETED_COUNT old backup(s)."
    else
        log_info "No old backups to delete."
    fi
}

automated_backup() {
    log_info "Running automated backup with cleanup..."

    check_requirements
    create_backup

    if [ $? -eq 0 ]; then
        cleanup_old_backups
        log_info "Automated backup completed successfully."
    else
        log_error "Automated backup failed."
        exit 1
    fi
}

# Main function
main() {
    case "${1:-backup}" in
        backup)
            check_requirements
            create_backup
            ;;
        restore)
            check_requirements
            restore_backup "$2"
            ;;
        list)
            list_backups
            ;;
        cleanup)
            cleanup_old_backups
            ;;
        auto)
            automated_backup
            ;;
        *)
            echo "Usage: $0 {backup|restore|list|cleanup|auto} [backup-file]"
            echo ""
            echo "Commands:"
            echo "  backup           - Create a new database backup"
            echo "  restore [file]   - Restore database from backup file"
            echo "  list             - List all available backups"
            echo "  cleanup          - Remove backups older than $RETENTION_DAYS days"
            echo "  auto             - Create backup and cleanup old ones (for cron)"
            echo ""
            echo "Examples:"
            echo "  $0 backup"
            echo "  $0 restore backups/dnd-backup-20240101-120000.sql.gz"
            echo "  $0 list"
            exit 1
            ;;
    esac
}

main "$@"
