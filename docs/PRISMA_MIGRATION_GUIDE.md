# Prisma Migration Guide

This guide explains how to use Prisma migrations instead of the deprecated custom migration script.

## Overview

The project has migrated from custom SQL migrations to **Prisma Migrate**, which provides:
- ✅ Type-safe database schema management
- ✅ Automatic migration generation
- ✅ Migration history tracking
- ✅ Rollback capabilities
- ✅ Auto-generated TypeScript types

## Quick Start

### For Development (First Time Setup)

If you're setting up the project for the first time:

```bash
# Option 1: Push schema directly (fastest for development)
docker-compose exec backend npx prisma db push

# Option 2: Create a proper migration (recommended)
docker-compose exec backend npx prisma migrate dev --name init
```

### For Production Deployment

```bash
# Deploy migrations to production database
docker-compose exec backend npx prisma migrate deploy
```

## Available Commands

### Using npm scripts (in backend directory)

```bash
# Deploy migrations (production)
npm run migrate

# Create/apply migrations (development)
npm run migrate:dev

# Create migration without applying
npm run migrate:create

# Push schema without migration files
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio

# Regenerate Prisma Client
npm run prisma:generate
```

### Using Make commands (from project root)

```bash
# Deploy migrations
make migrate

# Development migrations
make migrate-dev

# Push schema to database
make db-push

# Open Prisma Studio
make db-studio
```

### Using Docker Compose directly

```bash
# Deploy migrations
docker-compose exec backend npx prisma migrate deploy

# Development migrations
docker-compose exec backend npx prisma migrate dev

# Push schema
docker-compose exec backend npx prisma db push

# Open Prisma Studio
docker-compose exec backend npx prisma studio

# Generate Prisma Client
docker-compose exec backend npx prisma generate
```

## When to Use Each Command

### `prisma db push`
**Use for**: Rapid prototyping, development
- Pushes schema changes directly to database
- No migration files created
- Fast and simple
- **Don't use in production**

```bash
docker-compose exec backend npx prisma db push
```

### `prisma migrate dev`
**Use for**: Development with migration history
- Creates migration files
- Applies migrations to database
- Generates Prisma Client
- Tracks migration history
- **Recommended for team development**

```bash
docker-compose exec backend npx prisma migrate dev --name add_user_preferences
```

### `prisma migrate deploy`
**Use for**: Production deployments
- Applies pending migrations
- Does not create new migrations
- Safe for production
- **Use in CI/CD pipelines**

```bash
docker-compose exec backend npx prisma migrate deploy
```

### `prisma generate`
**Use for**: Regenerating Prisma Client
- Updates TypeScript types
- Run after schema changes
- Automatically run by migrate commands

```bash
docker-compose exec backend npx prisma generate
```

### `prisma studio`
**Use for**: Visual database browsing
- Opens GUI at http://localhost:5555
- View and edit data
- Great for debugging

```bash
docker-compose exec backend npx prisma studio
```

## Migration Workflow

### Creating a New Migration

1. **Edit the schema** in `backend/prisma/schema.prisma`

```prisma
model User {
  id    String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name  String
  email String @unique
  // Add new field
  avatar String?
}
```

2. **Create and apply migration**

```bash
docker-compose exec backend npx prisma migrate dev --name add_user_avatar
```

3. **Commit migration files**

```bash
git add backend/prisma/migrations/
git commit -m "feat: add user avatar field"
```

### Applying Migrations in Production

```bash
# In your deployment script or CI/CD
docker-compose exec backend npx prisma migrate deploy
```

## Troubleshooting

### "Migration failed" Error

**Problem**: Migration conflicts with existing data

**Solution**:
```bash
# For development (⚠️ resets database)
docker-compose exec backend npx prisma migrate reset

# For production (manual fix required)
# 1. Review the migration SQL
# 2. Manually fix data conflicts
# 3. Mark migration as applied
docker-compose exec backend npx prisma migrate resolve --applied <migration_name>
```

### "Could not find Prisma Schema"

**Problem**: Prisma schema file not accessible in container

**Solution**:
1. Ensure `backend/prisma` directory is mounted in docker-compose.yml
2. Restart containers:
```bash
docker-compose down
docker-compose up -d
```

### "Prisma Client not found"

**Problem**: Prisma Client not generated

**Solution**:
```bash
docker-compose exec backend npx prisma generate
```

### "Database connection failed"

**Problem**: DATABASE_URL incorrect or database not accessible

**Solution**:
1. Check `backend/.env` has correct `DATABASE_URL`
2. Verify Supabase project is active
3. Test connection:
```bash
docker-compose exec backend npx prisma db pull
```

### "Migration already applied"

**Problem**: Trying to apply a migration that's already in the database

**Solution**:
```bash
# Mark as applied without running
docker-compose exec backend npx prisma migrate resolve --applied <migration_name>
```

### Schema Drift Detected

**Problem**: Database schema doesn't match Prisma schema

**Solution**:
```bash
# Pull current database schema
docker-compose exec backend npx prisma db pull

# Or push Prisma schema to database
docker-compose exec backend npx prisma db push --force-reset
```

## Migration Files

Migrations are stored in `backend/prisma/migrations/`:

```
backend/prisma/
├── schema.prisma           # Your schema definition
└── migrations/
    ├── migration_lock.toml # Lock file (commit this)
    └── 20240101000000_init/
        └── migration.sql   # SQL for this migration
```

**Important**: Always commit migration files to version control!

## Best Practices

### Development
1. Use `prisma migrate dev` for schema changes
2. Name migrations descriptively: `--name add_user_avatar`
3. Review generated SQL before committing
4. Test migrations on a copy of production data

### Production
1. Always use `prisma migrate deploy`
2. Never use `db push` in production
3. Test migrations in staging first
4. Have a rollback plan
5. Backup database before major migrations

### Team Collaboration
1. Pull latest migrations before creating new ones
2. Resolve conflicts in schema.prisma, not migration files
3. Communicate breaking changes to team
4. Use feature branches for schema changes

## Comparison: Old vs New

### Old Way (Deprecated)
```bash
# ❌ Don't use this anymore
docker-compose exec backend npm run migrate
# Warning: This migration script is deprecated
```

### New Way (Prisma)
```bash
# ✅ Use this instead
docker-compose exec backend npx prisma migrate deploy
```

## Environment Variables

Ensure these are set in `backend/.env`:

```bash
# Supabase Database Connection (for Prisma)
DATABASE_URL="postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres"
```

For production, use connection pooling:
```bash
DATABASE_URL="postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres?pgbouncer=true"
```

## Additional Resources

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma with Supabase](https://www.prisma.io/docs/guides/database/supabase)
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase configuration guide

## Getting Help

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review Prisma documentation
3. Check `backend/prisma/schema.prisma` for syntax errors
4. Verify DATABASE_URL is correct
5. Check Supabase dashboard for database status

## Summary

**For your current situation**, run:

```bash
# If you just want to get started quickly
docker-compose exec backend npx prisma db push

# Or if you want proper migration tracking
docker-compose exec backend npx prisma migrate dev --name init
```

Both commands will create the database tables from your Prisma schema and eliminate the deprecation warning.
