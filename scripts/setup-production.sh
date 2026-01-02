#!/bin/bash

# Production environment setup script
# This script helps set up the production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Generate secure random string
generate_secret() {
    openssl rand -base64 "$1" | tr -d "=+/" | cut -c1-"$1"
}

log_step "Production Environment Setup"
echo ""

# Check if .env.production already exists
if [ -f "backend/.env.production" ]; then
    log_warn "backend/.env.production already exists"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Keeping existing configuration"
        exit 0
    fi
fi

log_step "Generating secure secrets..."

# Generate JWT secret
JWT_SECRET=$(generate_secret 64)
log_info "Generated JWT secret"

# Generate database password
DB_PASSWORD=$(generate_secret 32)
log_info "Generated database password"

# Prompt for configuration
log_step "Please provide the following information:"
echo ""

read -p "Production domain (e.g., app.yourdomain.com): " DOMAIN
read -p "Database host (e.g., your-db.region.rds.amazonaws.com): " DB_HOST
read -p "Database name [excalidraw_organizer_prod]: " DB_NAME
DB_NAME=${DB_NAME:-excalidraw_organizer_prod}
read -p "Database user [excalidraw_prod_user]: " DB_USER
DB_USER=${DB_USER:-excalidraw_prod_user}

read -p "AWS S3 Region [us-east-1]: " S3_REGION
S3_REGION=${S3_REGION:-us-east-1}
read -p "AWS S3 Bucket name: " S3_BUCKET
read -p "AWS Access Key ID: " S3_ACCESS_KEY_ID
read -s -p "AWS Secret Access Key: " S3_SECRET_ACCESS_KEY
echo ""

# Create backend .env.production
log_step "Creating backend/.env.production..."

cat > backend/.env.production << EOF
# Production Environment Variables
# Generated on $(date)

# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DB_HOST=$DB_HOST
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=https://$DOMAIN

# S3 Storage Configuration
S3_ENDPOINT=
S3_REGION=$S3_REGION
S3_ACCESS_KEY_ID=$S3_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY=$S3_SECRET_ACCESS_KEY
S3_BUCKET=$S3_BUCKET
S3_FORCE_PATH_STYLE=false
EOF

log_info "Created backend/.env.production"

# Create frontend .env.production
log_step "Creating excalidraw-organizer/.env.production..."

cat > excalidraw-organizer/.env.production << EOF
# Production Environment Variables
# Generated on $(date)

# API Configuration
VITE_API_BASE_URL=https://api.$DOMAIN/api

# Environment
VITE_ENV=production
EOF

log_info "Created excalidraw-organizer/.env.production"

# Create .env file for docker-compose
log_step "Creating .env for docker-compose..."

cat > .env << EOF
# Docker Registry Configuration
DOCKER_REGISTRY=your-registry.com
BACKEND_IMAGE=excalidraw-backend
FRONTEND_IMAGE=excalidraw-frontend
EOF

log_info "Created .env"

# Display summary
echo ""
log_step "Setup Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Domain: https://$DOMAIN"
echo "API URL: https://api.$DOMAIN"
echo "Database: $DB_NAME on $DB_HOST"
echo "S3 Bucket: $S3_BUCKET in $S3_REGION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

log_warn "IMPORTANT: Keep these credentials secure!"
log_warn "Database Password: $DB_PASSWORD"
echo ""

log_info "Next steps:"
echo "1. Set up your database with the provided credentials"
echo "2. Configure your S3 bucket with appropriate permissions"
echo "3. Set up DNS records for your domain"
echo "4. Configure GitHub Actions secrets for CI/CD"
echo "5. Run: ./scripts/deploy.sh"
echo ""

log_info "Setup completed successfully!"
