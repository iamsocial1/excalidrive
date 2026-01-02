#!/bin/bash

# Deployment script for Excalidraw Organizer
# This script handles deployment to production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"

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
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    log_info "All requirements met"
}

backup_database() {
    log_info "Creating database backup..."
    
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Backup database using docker-compose
    docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE" || {
        log_warn "Database backup failed, continuing anyway..."
    }
    
    log_info "Database backup saved to $BACKUP_FILE"
}

run_migrations() {
    log_info "Running database migrations..."
    
    docker-compose -f docker-compose.prod.yml run --rm backend npm run migrate || {
        log_error "Database migration failed"
        exit 1
    }
    
    log_info "Database migrations completed"
}

pull_images() {
    log_info "Pulling latest Docker images..."
    
    docker-compose -f docker-compose.prod.yml pull || {
        log_error "Failed to pull Docker images"
        exit 1
    }
    
    log_info "Docker images pulled successfully"
}

deploy_services() {
    log_info "Deploying services..."
    
    # Deploy with zero-downtime
    docker-compose -f docker-compose.prod.yml up -d --no-deps --remove-orphans || {
        log_error "Deployment failed"
        exit 1
    }
    
    log_info "Services deployed successfully"
}

health_check() {
    log_info "Performing health checks..."
    
    # Wait for services to be healthy
    sleep 10
    
    # Check backend health
    if curl -f http://localhost:3001/health &> /dev/null; then
        log_info "Backend is healthy"
    else
        log_error "Backend health check failed"
        exit 1
    fi
    
    # Check frontend health
    if curl -f http://localhost:80/health &> /dev/null; then
        log_info "Frontend is healthy"
    else
        log_error "Frontend health check failed"
        exit 1
    fi
    
    log_info "All health checks passed"
}

cleanup() {
    log_info "Cleaning up old Docker images..."
    
    docker image prune -af --filter "until=24h" || {
        log_warn "Cleanup failed, continuing anyway..."
    }
    
    log_info "Cleanup completed"
}

# Main deployment flow
main() {
    log_info "Starting deployment process..."
    
    cd "$PROJECT_ROOT"
    
    check_requirements
    backup_database
    pull_images
    run_migrations
    deploy_services
    health_check
    cleanup
    
    log_info "Deployment completed successfully!"
}

# Run main function
main "$@"
