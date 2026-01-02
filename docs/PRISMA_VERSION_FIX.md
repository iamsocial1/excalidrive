# Prisma Version Fix Guide

## The Problem

When running `docker-compose exec backend npx prisma db push`, you're getting:

```
Need to install the following packages:
prisma@7.0.0
```

This happens because:
1. The Docker container doesn't have Prisma installed in `node_modules`
2. `npx` tries to download the latest version (7.0.0)
3. Prisma 7.0.0 has breaking changes incompatible with your schema

## The Solution

You need to rebuild the Docker container so it has Prisma 5.x installed from `package.json`.

### Quick Fix (Recommended)

```bash
# Stop containers
docker-compose down

# Rebuild backend container
docker-compose build backend

# Start containers
docker-compose up -d

# Now run Prisma commands (will use installed Prisma 5.x)
docker-compose exec backend npx prisma db push
```

### Alternative: Use npm run instead of npx

Since the scripts in `package.json` use the installed Prisma:

```bash
# This uses the Prisma installed in node_modules
docker-compose exec backend npm run db:push
```

## Step-by-Step Instructions

### Step 1: Stop Containers
```bash
docker-compose down
```

### Step 2: Rebuild Backend
```bash
# Rebuild without cache to ensure fresh install
docker-compose build --no-cache backend
```

This will:
- Install all dependencies from `package.json`
- Install Prisma 5.x (not 7.x)
- Install @prisma/client 5.x

### Step 3: Start Containers
```bash
docker-compose up -d
```

### Step 4: Verify Prisma Version
```bash
# Check installed Prisma version
docker-compose exec backend npx prisma --version
```

Should show:
```
prisma                  : 5.x.x
@prisma/client          : 5.x.x
```

### Step 5: Run Migration
```bash
# Now this will work with Prisma 5.x
docker-compose exec backend npx prisma db push
```

## Why This Happened

### Docker Build Stages

The Dockerfile has multiple stages:
- `builder` - Builds TypeScript
- `development` - For local development (has all dependencies)
- `production` - Final stage (production dependencies only)

### The Issue

The base `docker-compose.yml` doesn't specify a target, so it uses the production stage. However, the `docker-compose.override.yml` should override this to use the `development` target.

### Verification

Check which stage is being used:
```bash
docker-compose config | grep target
```

Should show:
```yaml
target: development
```

## Alternative Solutions

### Option 1: Use npm scripts (No rebuild needed)

```bash
# These use the installed Prisma from node_modules
docker-compose exec backend npm run db:push
docker-compose exec backend npm run migrate
docker-compose exec backend npm run db:studio
```

### Option 2: Install dependencies in running container

```bash
# Install dependencies in the running container
docker-compose exec backend npm install

# Then run Prisma
docker-compose exec backend npx prisma db push
```

### Option 3: Pin Prisma version in package.json

Update `backend/package.json` to use exact versions:

```json
{
  "dependencies": {
    "@prisma/client": "5.22.0"
  },
  "devDependencies": {
    "prisma": "5.22.0"
  }
}
```

Then rebuild:
```bash
docker-compose build --no-cache backend
docker-compose up -d
```

## Recommended Workflow

### For Development

Always use the npm scripts which use the installed Prisma:

```bash
# Push schema to database
docker-compose exec backend npm run db:push

# Create migration
docker-compose exec backend npm run migrate:dev

# Deploy migrations
docker-compose exec backend npm run migrate

# Open Prisma Studio
docker-compose exec backend npm run db:studio

# Generate Prisma Client
docker-compose exec backend npm run prisma:generate
```

### For Production

Ensure the Docker image is built with all dependencies:

```bash
docker build -t excalidraw-backend:latest ./backend
docker run excalidraw-backend:latest npm run migrate
```

## Verification Checklist

After rebuilding:

- [ ] Container rebuilt: `docker-compose build backend`
- [ ] Containers started: `docker-compose up -d`
- [ ] Prisma version correct: `docker-compose exec backend npx prisma --version` shows 5.x.x
- [ ] Schema validation works: `docker-compose exec backend npx prisma validate`
- [ ] Database push works: `docker-compose exec backend npm run db:push`
- [ ] Application starts: Check http://localhost:3001/health

## Understanding npx vs npm run

### `npx prisma`
- Looks for Prisma in `node_modules/.bin/`
- If not found, downloads latest version from npm
- Can cause version mismatches

### `npm run db:push`
- Uses the script defined in `package.json`
- Always uses the installed version from `node_modules`
- Recommended for consistency

## Troubleshooting

### Still getting Prisma 7.0.0?

```bash
# Check if node_modules exists in container
docker-compose exec backend ls -la node_modules/.bin/prisma

# If not found, rebuild
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

### "Cannot find module '@prisma/client'"

```bash
# Generate Prisma Client
docker-compose exec backend npm run prisma:generate
```

### Build fails

```bash
# Clean everything and rebuild
docker-compose down -v
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

## Summary

**The fastest fix:**

```bash
docker-compose down
docker-compose build backend
docker-compose up -d
docker-compose exec backend npm run db:push
```

**Or use npm scripts directly (no rebuild):**

```bash
docker-compose exec backend npm run db:push
```

Both approaches will use Prisma 5.x from your `package.json` instead of trying to download Prisma 7.x.
