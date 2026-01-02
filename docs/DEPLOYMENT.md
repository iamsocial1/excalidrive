# Deployment Guide

This guide covers deploying the Excalidraw Organizer application to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Production Deployment](#production-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Database Migrations](#database-migrations)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 20+ (for local development)

### Required Accounts/Services

- **Supabase Account** - For managed PostgreSQL and storage (free tier available at [supabase.com](https://supabase.com))
  - No self-hosted database or storage servers needed
  - Automatic backups and scaling
  - Built-in CDN for storage
- **Container Registry** - Docker Hub, AWS ECR, or GitHub Container Registry
- **Domain Name** - With DNS access
- **SSL Certificate** - Let's Encrypt recommended

### Why Supabase?

- **Zero Infrastructure Management** - No PostgreSQL or S3 servers to maintain
- **Automatic Scaling** - Handles traffic spikes automatically
- **Built-in Features** - Authentication, storage, real-time, all in one platform
- **Cost Effective** - Free tier includes 500MB database, 1GB storage
- **Developer Experience** - Excellent dashboard, APIs, and documentation

## Local Development Setup

### Prerequisites

1. **Create Supabase Project:**
   - Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed instructions
   - Get your project URL, anon key, and service role key
   - Create storage bucket named `excalidraw-drawings`

2. **Configure Environment:**

Create `backend/.env`:
```bash
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (Prisma)
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres

# Storage
SUPABASE_STORAGE_BUCKET=excalidraw-drawings

# JWT
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:5173
```

### Using Docker Compose

1. **Start services:**

```bash
docker-compose up -d
```

This will start:
- Backend API on port 3001
- Frontend on port 5173

2. **Run Prisma migrations:**

```bash
docker-compose exec backend npx prisma db push
docker-compose exec backend npx prisma generate
```

3. **View logs:**

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

4. **Stop services:**

```bash
docker-compose down
```

### Without Docker

1. **Backend setup:**

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with Supabase configuration
npx prisma db push
npx prisma generate
npm run dev
```

2. **Frontend setup:**

```bash
cd excalidraw-organizer
npm install
cp .env.example .env
# Edit .env with API URL
npm run dev
```

## Production Deployment

### Option 1: Automated Setup Script

Run the production setup script to generate secure configuration:

```bash
chmod +x scripts/setup-production.sh
./scripts/setup-production.sh
```

This will:
- Generate secure JWT secrets and database passwords
- Create production environment files
- Prompt for necessary configuration values

### Option 2: Manual Configuration

1. **Configure Backend Environment:**

Create `backend/.env.production`:

```bash
PORT=3001
NODE_ENV=production

# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (Prisma) - Use connection pooling for production
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true

# Storage
SUPABASE_STORAGE_BUCKET=excalidraw-drawings

# JWT (generate with: openssl rand -base64 64)
JWT_SECRET=YOUR_STRONG_JWT_SECRET_HERE
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=https://app.yourdomain.com
```

2. **Configure Frontend Environment:**

Create `excalidraw-organizer/.env.production`:

```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_ENV=production
```

3. **Set up Supabase:**

Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md) to:
- Create production Supabase project
- Create storage bucket
- Configure storage policies
- Get production credentials

4. **Run Prisma Migrations:**

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

5. **Build and Deploy:**

```bash
# Build Docker images
docker build -t excalidraw-backend:latest ./backend
docker build -t excalidraw-frontend:latest ./excalidraw-organizer

# Push to registry
docker tag excalidraw-backend:latest your-registry.com/excalidraw-backend:latest
docker push your-registry.com/excalidraw-backend:latest

docker tag excalidraw-frontend:latest your-registry.com/excalidraw-frontend:latest
docker push your-registry.com/excalidraw-frontend:latest

# Deploy using docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### Option 3: Automated Deployment Script

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

This script will:
- Check requirements
- Backup database
- Pull latest images
- Run migrations
- Deploy services with zero-downtime
- Perform health checks
- Clean up old images

## CI/CD Pipeline

### GitHub Actions Setup

1. **Configure Repository Secrets:**

Go to your GitHub repository → Settings → Secrets and add:

```
DOCKER_REGISTRY=your-registry.com
DOCKER_USERNAME=your-username
DOCKER_PASSWORD=your-password
VITE_API_BASE_URL=https://api.yourdomain.com/api
DEPLOY_HOST=your-server-ip
DEPLOY_USER=deploy
DEPLOY_SSH_KEY=your-ssh-private-key
```

2. **Workflow Triggers:**

The pipeline runs on:
- Push to `main` branch
- Manual trigger via GitHub Actions UI

3. **Pipeline Stages:**

- **Test Backend**: Install dependencies, build, run tests
- **Test Frontend**: Install dependencies, lint, build
- **Build Backend**: Build and push Docker image
- **Build Frontend**: Build and push Docker image
- **Deploy**: SSH to server, pull images, run migrations, deploy
- **Notify**: Send deployment status notification

### Manual Deployment

To manually trigger deployment:

1. Go to GitHub Actions
2. Select "Deploy to Production" workflow
3. Click "Run workflow"
4. Select branch and confirm

## Database Migrations with Prisma

### Understanding Prisma Migrations

Prisma provides two approaches for schema management:

1. **`prisma db push`** - For development/prototyping
   - Directly syncs schema to database
   - No migration history
   - Fast iteration

2. **`prisma migrate`** - For production
   - Creates migration files
   - Tracks migration history
   - Enables rollback
   - Team collaboration

### Running Migrations

**Development (Prototyping):**
```bash
cd backend
npx prisma db push  # Quick schema sync
npx prisma generate  # Update Prisma Client
```

**Development (With History):**
```bash
cd backend
npx prisma migrate dev --name add_new_feature
# Automatically runs migration and generates client
```

**Production:**
```bash
cd backend
npx prisma migrate deploy  # Deploy pending migrations
npx prisma generate  # Ensure client is up to date
```

**Production (Docker):**
```bash
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma generate
```

### Creating New Migrations

1. **Update Prisma Schema:**
   Edit `backend/prisma/schema.prisma`

2. **Create Migration:**
   ```bash
   cd backend
   npx prisma migrate dev --name add_new_feature
   ```
   This will:
   - Generate SQL migration file
   - Apply migration to database
   - Regenerate Prisma Client

3. **Review Migration:**
   Check `backend/prisma/migrations/` for generated SQL

4. **Test Locally:**
   Verify changes work as expected

5. **Commit Migration:**
   ```bash
   git add prisma/migrations/
   git commit -m "feat: add new feature migration"
   ```

6. **Deploy to Production:**
   ```bash
   npx prisma migrate deploy
   ```

### Prisma Commands Reference

```bash
# Schema Management
npx prisma db push              # Push schema changes (dev)
npx prisma db pull              # Pull schema from database
npx prisma migrate dev          # Create and apply migration (dev)
npx prisma migrate deploy       # Deploy migrations (prod)
npx prisma migrate reset        # Reset database (dev only)

# Client Generation
npx prisma generate             # Generate Prisma Client

# Database Inspection
npx prisma studio               # Open visual database browser
npx prisma validate             # Validate schema file
npx prisma format               # Format schema file

# Migration Management
npx prisma migrate status       # Check migration status
npx prisma migrate resolve      # Resolve migration issues
```

### Rollback Strategy

**Supabase Backups:**

1. **Enable Point-in-Time Recovery** (Pro plan):
   - Go to Supabase Dashboard → Database → Backups
   - Enable PITR
   - Can restore to any point in time (up to 7 days)

2. **Manual Backup Before Migration:**
   ```bash
   # Backup before deploying migration
   pg_dump "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres" > backup_pre_migration_$(date +%Y%m%d).sql
   ```

3. **Restore from Backup:**
   ```bash
   psql "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres" < backup_pre_migration_YYYYMMDD.sql
   ```

4. **Prisma Migration Rollback:**
   ```bash
   # Mark migration as rolled back
   npx prisma migrate resolve --rolled-back migration_name
   
   # Then manually revert database changes or restore from backup
   ```

### Troubleshooting Migrations

**Problem**: Migration fails with "relation already exists"

**Solution**:
```bash
# Check migration status
npx prisma migrate status

# Mark as applied if already exists
npx prisma migrate resolve --applied migration_name
```

**Problem**: Prisma Client out of sync

**Solution**:
```bash
# Regenerate client
npx prisma generate

# If still issues, clear and regenerate
rm -rf node_modules/@prisma/client
npm install
npx prisma generate
```

**Problem**: Migration conflicts in team

**Solution**:
```bash
# Pull latest migrations
git pull

# Check status
npx prisma migrate status

# Deploy any pending migrations
npx prisma migrate deploy
```

## Monitoring and Maintenance

### Health Checks

**Backend:**
```bash
curl http://localhost:3001/health
```

**Frontend:**
```bash
curl http://localhost:80/health
```

### Logs

**View logs:**
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

**Backend logs only:**
```bash
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Database Backups

**Automated backup script:**

Create `scripts/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U $DB_USER $DB_NAME > "$BACKUP_DIR/db_backup_$DATE.sql"
```

**Schedule with cron:**
```bash
0 2 * * * /opt/excalidraw-organizer/scripts/backup-db.sh
```

### Updating Application

1. **Pull latest code:**
```bash
git pull origin main
```

2. **Run deployment script:**
```bash
./scripts/deploy.sh
```

### Scaling

**Scale backend instances:**
```bash
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

**Add load balancer** (nginx example):

```nginx
upstream backend {
    server backend1:3001;
    server backend2:3001;
    server backend3:3001;
}

server {
    location /api {
        proxy_pass http://backend;
    }
}
```

## Troubleshooting

### Backend Won't Start

1. **Check logs:**
```bash
docker-compose logs backend
```

2. **Common issues:**
- Database connection failed: Check DB_HOST, DB_PASSWORD
- Port already in use: Change PORT in .env
- Missing environment variables: Verify .env.production

### Frontend Won't Load

1. **Check nginx logs:**
```bash
docker-compose logs frontend
```

2. **Common issues:**
- API URL incorrect: Check VITE_API_BASE_URL
- CORS errors: Verify FRONTEND_URL in backend .env
- Build failed: Check build logs

### Database Migration Failed

1. **Check migration logs:**
```bash
docker-compose run --rm backend npm run migrate
```

2. **Manual fix:**
```bash
# Connect to database
psql -h your-db-host -U your-db-user your-db-name

# Check tables
\dt

# Run SQL manually if needed
```

### Supabase Storage Errors

1. **Check credentials:**
```bash
# Verify environment variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
echo $SUPABASE_STORAGE_BUCKET
```

2. **Verify bucket exists:**
- Go to Supabase Dashboard → Storage
- Check bucket name matches environment variable

3. **Test storage connection:**
```bash
curl http://localhost:3001/health/storage
```

4. **Check storage policies:**
- Go to Supabase Dashboard → Storage → Policies
- Verify policies allow authenticated uploads/reads

### Prisma Connection Errors

1. **Check DATABASE_URL:**
```bash
# Verify connection string format
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres

# For production, use connection pooling
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true
```

2. **Test connection:**
```bash
cd backend
npx prisma db pull  # Should succeed if connection works
```

3. **Enable connection pooling (Production):**
```bash
# Add pgbouncer to connection string for better performance
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true

# Note: Some Prisma features don't work with pgbouncer
# Use direct connection for migrations:
DIRECT_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

4. **Check Supabase project status:**
- Go to Supabase Dashboard
- Ensure project is not paused (free tier pauses after 7 days of inactivity)
- Check if you've exceeded free tier limits

5. **Verify credentials:**
```bash
# Test with psql
psql "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres" -c "SELECT 1"
```

### Prisma Client Issues

**Problem**: "Cannot find module '@prisma/client'"

**Solution**:
```bash
cd backend
npm install @prisma/client
npx prisma generate
```

**Problem**: "Type errors after schema changes"

**Solution**:
```bash
cd backend
npx prisma generate  # Regenerate types
npm run build  # Rebuild TypeScript
```

**Problem**: "Prisma Client is not configured"

**Solution**:
```bash
# Ensure DATABASE_URL is set
echo $DATABASE_URL

# Generate client
cd backend
npx prisma generate
```

### Performance Issues

1. **Check resource usage:**
```bash
docker stats
```

2. **Optimize database:**
```sql
-- Analyze tables
ANALYZE drawings;
ANALYZE projects;
ANALYZE users;

-- Check slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

3. **Enable caching:**
- Add Redis for session storage
- Enable CDN for static assets
- Implement application-level caching

## Security Checklist

- [ ] Strong JWT secret (64+ characters)
- [ ] Strong database password (32+ characters)
- [ ] HTTPS enabled with valid SSL certificate
- [ ] CORS configured for production domain only
- [ ] Rate limiting enabled
- [ ] Database backups automated
- [ ] Secrets not committed to version control
- [ ] Security headers configured (helmet)
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (input sanitization)
- [ ] CSRF protection enabled
- [ ] Regular security updates

## Support

For issues or questions:
- Check logs first
- Review this documentation
- Check GitHub issues
- Contact support team
