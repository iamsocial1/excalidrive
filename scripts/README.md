# Deployment Scripts

This directory contains scripts for deploying and managing the Excalidraw Organizer application.

## Scripts

### setup-production.sh

Interactive script to set up production environment configuration.

**Usage:**
```bash
chmod +x scripts/setup-production.sh
./scripts/setup-production.sh
```

**What it does:**
- Generates secure JWT secrets and database passwords
- Prompts for production configuration values
- Creates `.env.production` files for backend and frontend
- Provides setup summary and next steps

**When to use:**
- First-time production deployment
- Rotating secrets
- Setting up new environment

### deploy.sh

Automated deployment script for production environment.

**Usage:**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**What it does:**
1. Checks Docker and Docker Compose installation
2. Creates database backup
3. Pulls latest Docker images
4. Runs database migrations
5. Deploys services with zero-downtime
6. Performs health checks
7. Cleans up old Docker images

**When to use:**
- Deploying updates to production
- After merging changes to main branch
- Manual deployment outside CI/CD

**Prerequisites:**
- Docker and Docker Compose installed
- Production environment configured
- Docker images built and pushed to registry

### backup-db.sh (Create this for automated backups)

**Example:**
```bash
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

docker-compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U $DB_USER $DB_NAME > "$BACKUP_DIR/db_backup_$DATE.sql"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "db_backup_*.sql" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/db_backup_$DATE.sql"
```

**Schedule with cron:**
```bash
# Run daily at 2 AM
0 2 * * * /opt/excalidraw-organizer/scripts/backup-db.sh
```

## Making Scripts Executable

On Linux/Mac:
```bash
chmod +x scripts/*.sh
```

On Windows (Git Bash):
```bash
git update-index --chmod=+x scripts/*.sh
```

## Environment Variables

Scripts expect the following environment variables to be set in `.env` files:

**Backend (.env.production):**
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (production)
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - JWT expiration time
- `FRONTEND_URL` - Frontend URL for CORS
- `S3_*` - S3 storage configuration

**Frontend (.env.production):**
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_ENV` - Environment (production)

**Docker Compose (.env):**
- `DOCKER_REGISTRY` - Container registry URL
- `BACKEND_IMAGE` - Backend image name
- `FRONTEND_IMAGE` - Frontend image name

## Troubleshooting

### Permission Denied

If you get "Permission denied" when running scripts:
```bash
chmod +x scripts/script-name.sh
```

### Docker Not Found

Install Docker:
- **Ubuntu/Debian:** `sudo apt-get install docker.io docker-compose`
- **Mac:** Install Docker Desktop
- **Windows:** Install Docker Desktop

### Database Connection Failed

Check:
1. Database host and credentials in `.env.production`
2. Database is running and accessible
3. Firewall rules allow connection
4. Security groups (if using cloud provider)

### Health Check Failed

Check:
1. Services are running: `docker-compose ps`
2. View logs: `docker-compose logs backend`
3. Test endpoints manually: `curl http://localhost:3001/health`

## Best Practices

1. **Always backup before deployment**
   - Script automatically creates backup
   - Keep backups for at least 7 days
   - Test restore process regularly

2. **Test in staging first**
   - Deploy to staging environment
   - Run smoke tests
   - Then deploy to production

3. **Monitor after deployment**
   - Check health endpoints
   - Monitor logs for errors
   - Verify key functionality

4. **Rollback plan**
   - Keep previous Docker images
   - Have database backup ready
   - Document rollback procedure

5. **Security**
   - Never commit `.env.production` files
   - Use strong secrets (64+ characters)
   - Rotate secrets regularly
   - Limit access to production servers

## Support

For issues with deployment scripts:
1. Check script output for error messages
2. Review logs: `docker-compose logs`
3. Consult DEPLOYMENT.md for detailed guide
4. Check GitHub issues for known problems
