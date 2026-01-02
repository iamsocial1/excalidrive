# Quick Start Guide

Get the Excalidraw Organizer up and running in minutes.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for local development without Docker)
- Git

## Option 1: Docker Compose (Recommended)

### Start Everything

```bash
# Clone the repository
git clone <repository-url>
cd excalidraw-organizer

# Start all services
docker-compose up -d

# Run database migrations (Prisma)
docker-compose exec backend npx prisma migrate deploy
# Or for development: docker-compose exec backend npx prisma db push
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **MinIO Console**: http://localhost:9001 (credentials: minioadmin/minioadmin)

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### Stop Services

```bash
docker-compose down
```

## Option 2: Using Makefile

```bash
# Start development environment
make dev

# Run migrations
make migrate

# View logs
make logs

# Stop services
make stop
```

## Option 3: Local Development (Without Docker)

### Backend Setup

```bash
# Install PostgreSQL and create database
createdb excalidraw_organizer

# Start MinIO for storage
docker-compose -f backend/docker-compose.minio.yml up -d

# Install dependencies
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run migrations
npm run migrate

# Start backend
npm run dev
```

Backend will run on http://localhost:3001

### Frontend Setup

```bash
# Install dependencies
cd excalidraw-organizer
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start frontend
npm run dev
```

Frontend will run on http://localhost:5173

## First Steps

1. **Open the application** at http://localhost:5173
2. **Create a drawing** - Start drawing immediately as a guest
3. **Sign up** - Click the menu (☰) and select "Sign Up"
4. **Save your drawing** - After signing up, save your drawing to a project
5. **Browse files** - Click "Browse Files" from the menu to see your saved drawings

## Common Commands

### Development

```bash
# Start services
docker-compose up -d

# Restart a service
docker-compose restart backend

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Database

```bash
# Run migrations
docker-compose exec backend npm run migrate

# Access PostgreSQL
docker-compose exec postgres psql -U postgres excalidraw_organizer

# Create backup
docker-compose exec postgres pg_dump -U postgres excalidraw_organizer > backup.sql
```

### Cleanup

```bash
# Remove containers and volumes
docker-compose down -v

# Remove all Docker images
docker system prune -a
```

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

```bash
# Check what's using the port
# Linux/Mac
lsof -i :5173
lsof -i :3001

# Windows
netstat -ano | findstr :5173
netstat -ano | findstr :3001

# Change ports in docker-compose.yml or .env files
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### MinIO Connection Failed

```bash
# Check if MinIO is running
docker-compose ps minio

# View MinIO logs
docker-compose logs minio

# Access MinIO console
# Open http://localhost:9001
# Login: minioadmin / minioadmin
```

### Frontend Can't Connect to Backend

1. Check backend is running: `curl http://localhost:3001/health`
2. Check CORS settings in `backend/.env`
3. Check `VITE_API_BASE_URL` in `excalidraw-organizer/.env`

### Docker Build Fails

```bash
# Clear Docker cache
docker builder prune -a

# Rebuild without cache
docker-compose build --no-cache
```

## Next Steps

- Read [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Check [backend/README.md](backend/README.md) for backend documentation
- Check [excalidraw-organizer/README.md](excalidraw-organizer/README.md) for frontend documentation
- Review security settings in [backend/SECURITY.md](backend/SECURITY.md)

## Getting Help

- Check logs: `docker-compose logs -f`
- Check health endpoints:
  - Backend: http://localhost:3001/health
  - Database: http://localhost:3001/health/db
  - Storage: http://localhost:3001/health/storage
- Review documentation in the repository
- Check GitHub issues for known problems

## Development Workflow

1. **Make changes** to source code
2. **Services auto-reload** (backend uses nodemon, frontend uses Vite HMR)
3. **Test changes** in browser
4. **View logs** if something breaks
5. **Commit changes** when ready

## Production Deployment

For production deployment, see [DEPLOYMENT.md](DEPLOYMENT.md).

Quick production setup:

```bash
# Set up production environment
make setup-prod

# Build images
make build

# Deploy
make deploy
```
