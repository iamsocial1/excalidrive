.PHONY: help dev build start stop restart logs clean migrate backup deploy setup-prod

# Default target
help:
	@echo "Excalidraw Organizer - Deployment Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development environment"
	@echo "  make logs         - View logs from all services"
	@echo "  make stop         - Stop all services"
	@echo "  make restart      - Restart all services"
	@echo "  make clean        - Remove all containers and volumes"
	@echo ""
	@echo "Database:"
	@echo "  make migrate      - Run database migrations"
	@echo "  make backup       - Create database backup"
	@echo ""
	@echo "Production:"
	@echo "  make setup-prod   - Set up production environment"
	@echo "  make build        - Build Docker images"
	@echo "  make deploy       - Deploy to production"
	@echo "  make prod-logs    - View production logs"
	@echo ""

# Development commands
dev:
	@echo "Starting development environment..."
	docker-compose up -d
	@echo "Services started. Access:"
	@echo "  Frontend: http://localhost:5173"
	@echo "  Backend:  http://localhost:3001"
	@echo "  MinIO:    http://localhost:9001"

logs:
	docker-compose logs -f

stop:
	@echo "Stopping all services..."
	docker-compose down

restart:
	@echo "Restarting all services..."
	docker-compose restart

clean:
	@echo "Removing all containers and volumes..."
	docker-compose down -v
	@echo "Cleanup complete"

# Database commands
migrate:
	@echo "Running database migrations (Prisma)..."
	docker-compose exec backend npx prisma migrate deploy

migrate-dev:
	@echo "Running database migrations in dev mode..."
	docker-compose exec backend npx prisma migrate dev

db-push:
	@echo "Pushing Prisma schema to database..."
	docker-compose exec backend npx prisma db push

db-studio:
	@echo "Opening Prisma Studio..."
	docker-compose exec backend npx prisma studio

backup:
	@echo "Creating database backup..."
	@mkdir -p backups
	docker-compose exec -T postgres pg_dump -U postgres excalidraw_organizer > backups/db_backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup created in backups/"

# Production commands
setup-prod:
	@echo "Setting up production environment..."
	@chmod +x scripts/setup-production.sh
	@./scripts/setup-production.sh

build:
	@echo "Building Docker images..."
	docker build -t excalidraw-backend:latest ./backend
	docker build -t excalidraw-frontend:latest ./excalidraw-organizer
	@echo "Build complete"

deploy:
	@echo "Deploying to production..."
	@chmod +x scripts/deploy.sh
	@./scripts/deploy.sh

prod-logs:
	docker-compose -f docker-compose.prod.yml logs -f

# Install dependencies
install:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd excalidraw-organizer && npm install
	@echo "Dependencies installed"

# Run tests
test:
	@echo "Running backend tests..."
	cd backend && npm test
	@echo "Tests complete"

# Lint code
lint:
	@echo "Linting backend..."
	cd backend && npx tsc --noEmit
	@echo "Linting frontend..."
	cd excalidraw-organizer && npm run lint
	@echo "Linting complete"
