# How to Run Excalidraw Organizer

Quick reference guide for running the application.

## Prerequisites

- Docker and Docker Compose installed
- Supabase account (free tier at [supabase.com](https://supabase.com))

## First Time Setup

### 1. Configure Supabase

Follow the [SUPABASE_SETUP.md](SUPABASE_SETUP.md) guide to:
- Create a Supabase project
- Get your credentials
- Update `backend/.env` with your Supabase URL and keys

### 2. Start the Application

```bash
# Start all services
docker-compose up -d

# Rebuild backend (first time only, to install Prisma)
docker-compose build backend
docker-compose up -d

# Initialize database (choose one)
docker-compose exec backend npm run db:push             # Quick (recommended for first time)
# OR
docker-compose exec backend npm run migrate:dev         # With migration history
```

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## Daily Development

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Common Commands

### Using Make (Easiest)

```bash
make dev          # Start everything
make logs         # View logs
make migrate      # Run migrations
make stop         # Stop services
make clean        # Remove everything
```

### Using Docker Compose

```bash
# Start
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop
docker-compose down

# Restart a service
docker-compose restart backend
```

### Database Operations

```bash
# Run migrations
docker-compose exec backend npm run migrate

# Push schema changes (development)
docker-compose exec backend npm run db:push

# Open database GUI
docker-compose exec backend npm run db:studio

# Generate Prisma Client
docker-compose exec backend npm run prisma:generate
```

## Troubleshooting

### "Migration script is deprecated" Warning

✅ **Solution**: Use Prisma commands instead:
```bash
docker-compose exec backend npx prisma db push
```

See [PRISMA_MIGRATION_GUIDE.md](PRISMA_MIGRATION_GUIDE.md) for details.

### "Could not find Prisma Schema" Error

✅ **Solution**: Restart containers to apply volume mount fix:
```bash
docker-compose down
docker-compose build backend
docker-compose up -d
docker-compose exec backend npm run db:push
```

See [DOCKER_FIX_SUMMARY.md](DOCKER_FIX_SUMMARY.md) for details.

### "Need to install prisma@7.0.0" Error

✅ **Solution**: Rebuild container to use Prisma 5.x from package.json:
```bash
docker-compose build backend
docker-compose up -d
docker-compose exec backend npm run db:push
```

See [PRISMA_VERSION_FIX.md](PRISMA_VERSION_FIX.md) for details.

### Port Already in Use

```bash
# Check what's using the port (Windows)
netstat -ano | findstr :5173
netstat -ano | findstr :3001

# Stop and restart
docker-compose down
docker-compose up -d
```

### Database Connection Failed

1. Check `backend/.env` has correct `DATABASE_URL`
2. Verify Supabase project is active
3. Test connection:
```bash
docker-compose exec backend npx prisma db pull
```

### Frontend Can't Connect to Backend

1. Check backend is running: `curl http://localhost:3001/health`
2. Check `FRONTEND_URL` in `backend/.env`
3. Check `VITE_API_BASE_URL` in `excalidraw-organizer/.env`

## What Gets Started

When you run `docker-compose up -d`, these services start:

- **Backend API** (port 3001) - Express server with hot-reload
- **Frontend** (port 5173) - React app with Vite dev server
- **Supabase** (external) - PostgreSQL database and storage

Note: PostgreSQL and MinIO are no longer needed locally - Supabase provides these services.

## Environment Files

Ensure these files exist and are configured:

- `backend/.env` - Backend configuration (Supabase credentials)
- `excalidraw-organizer/.env` - Frontend configuration (API URL)

See `.env.example` files for templates.

## Next Steps

- Read [QUICKSTART.md](QUICKSTART.md) for detailed setup
- Read [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for development workflow
- Read [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for Supabase configuration
- Read [PRISMA_MIGRATION_GUIDE.md](PRISMA_MIGRATION_GUIDE.md) for database migrations

## Quick Reference

| Task | Command |
|------|---------|
| Start everything | `make dev` or `docker-compose up -d` |
| View logs | `make logs` or `docker-compose logs -f` |
| Run migrations | `make migrate` or `docker-compose exec backend npx prisma migrate deploy` |
| Push schema | `docker-compose exec backend npx prisma db push` |
| Stop everything | `make stop` or `docker-compose down` |
| Clean up | `make clean` or `docker-compose down -v` |
| Open database GUI | `docker-compose exec backend npx prisma studio` |

## Getting Help

- Check logs: `docker-compose logs -f`
- Check health: `curl http://localhost:3001/health`
- Review documentation in this repository
- Check [PRISMA_MIGRATION_GUIDE.md](PRISMA_MIGRATION_GUIDE.md) for migration issues
