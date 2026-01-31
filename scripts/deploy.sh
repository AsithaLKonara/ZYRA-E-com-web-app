#!/bin/bash

# ZYRA Fashion Deployment Script
# This script handles the complete deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="zyra-ultra"
APP_DIR="/opt/zyra-ultra"
BACKUP_DIR="/backups/zyra-ultra"
LOG_FILE="/var/log/zyra-ultra/deploy.log"
ENVIRONMENT=${1:-production}

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if required commands exist
    command -v git >/dev/null 2>&1 || error "git is required but not installed"
    command -v node >/dev/null 2>&1 || error "node is required but not installed"
    command -v npm >/dev/null 2>&1 || error "npm is required but not installed"
    command -v docker >/dev/null 2>&1 || error "docker is required but not installed"
    command -v docker-compose >/dev/null 2>&1 || error "docker-compose is required but not installed"
    
    # Check if app directory exists
    if [ ! -d "$APP_DIR" ]; then
        error "App directory $APP_DIR does not exist"
    fi
    
    success "Prerequisites check passed"
}

# Create backup
create_backup() {
    log "Creating backup..."
    
    # Create backup directory
    mkdir -p $BACKUP_DIR
    
    # Backup database
    if [ -f "$APP_DIR/scripts/database-backup.ts" ]; then
        cd $APP_DIR
        npm run db:backup:full
        success "Database backup created"
    else
        warning "Database backup script not found, skipping backup"
    fi
    
    # Backup application files
    BACKUP_FILE="$BACKUP_DIR/app-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    tar -czf $BACKUP_FILE -C $APP_DIR .
    success "Application backup created: $BACKUP_FILE"
}

# Pull latest code
pull_code() {
    log "Pulling latest code..."
    
    cd $APP_DIR
    git fetch origin
    git reset --hard origin/main
    success "Code updated"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    cd $APP_DIR
    npm ci --production
    success "Dependencies installed"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    cd $APP_DIR
    npm run db:migrate:deploy
    success "Database migrations completed"
}

# Build application
build_application() {
    log "Building application..."
    
    cd $APP_DIR
    npm run build
    success "Application built"
}

# Run tests
run_tests() {
    log "Running tests..."
    
    cd $APP_DIR
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        npm test
        success "Tests passed"
    else
        warning "No tests configured, skipping"
    fi
}

# Deploy with Docker
deploy_docker() {
    log "Deploying with Docker..."
    
    cd $APP_DIR
    
    # Stop existing containers
    docker-compose -f config/docker-compose.prod.yml down
    
    # Build and start new containers
    docker-compose -f config/docker-compose.prod.yml up -d --build
    
    # Wait for services to be ready
    sleep 30
    
    # Check if services are running
    if docker-compose -f config/docker-compose.prod.yml ps | grep -q "Up"; then
        success "Docker deployment completed"
    else
        error "Docker deployment failed"
    fi
}

# Deploy with PM2
deploy_pm2() {
    log "Deploying with PM2..."
    
    cd $APP_DIR
    
    # Install PM2 if not installed
    if ! command -v pm2 >/dev/null 2>&1; then
        npm install -g pm2
    fi
    
    # Stop existing process
    pm2 stop $APP_NAME 2>/dev/null || true
    pm2 delete $APP_NAME 2>/dev/null || true
    
    # Start new process
    pm2 start ecosystem.config.js --env $ENVIRONMENT
    
    # Save PM2 configuration
    pm2 save
    pm2 startup
    
    success "PM2 deployment completed"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for application to start
    sleep 10
    
    # Check if application is responding
    if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
        success "Health check passed"
    else
        error "Health check failed"
    fi
}

# Rollback deployment
rollback() {
    log "Rolling back deployment..."
    
    # Find latest backup
    LATEST_BACKUP=$(ls -t $BACKUP_DIR/app-backup-*.tar.gz | head -n1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        error "No backup found for rollback"
    fi
    
    # Stop application
    if command -v pm2 >/dev/null 2>&1; then
        pm2 stop $APP_NAME
    fi
    
    # Restore from backup
    tar -xzf $LATEST_BACKUP -C $APP_DIR
    
    # Restart application
    if command -v pm2 >/dev/null 2>&1; then
        pm2 start $APP_NAME
    fi
    
    success "Rollback completed"
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    
    # Keep only last 10 backups
    ls -t $BACKUP_DIR/app-backup-*.tar.gz | tail -n +11 | xargs -r rm
    ls -t $BACKUP_DIR/full-backup-*.sql.gz | tail -n +11 | xargs -r rm
    
    success "Cleanup completed"
}

# Main deployment function
deploy() {
    log "Starting deployment for $ENVIRONMENT environment..."
    
    check_root
    check_prerequisites
    create_backup
    pull_code
    install_dependencies
    run_migrations
    build_application
    run_tests
    
    # Choose deployment method
    if [ "$ENVIRONMENT" = "production" ] && [ -f "config/docker-compose.prod.yml" ]; then
        deploy_docker
    else
        deploy_pm2
    fi
    
    health_check
    cleanup_backups
    
    success "Deployment completed successfully!"
}

# Main script
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    rollback)
        rollback
        ;;
    health)
        health_check
        ;;
    backup)
        create_backup
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health|backup} [environment]"
        echo "  deploy   - Deploy the application (default)"
        echo "  rollback - Rollback to previous version"
        echo "  health   - Check application health"
        echo "  backup   - Create backup only"
        echo ""
        echo "Environment: production (default), staging, development"
        exit 1
        ;;
esac




