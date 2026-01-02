# Supabase Setup Guide

This guide provides step-by-step instructions for setting up Supabase for the Excalidraw Organizer application.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Creating a Supabase Project](#creating-a-supabase-project)
- [Database Setup](#database-setup)
- [Storage Setup](#storage-setup)
- [Environment Configuration](#environment-configuration)
- [Running Migrations](#running-migrations)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

## Overview

The Excalidraw Organizer uses Supabase for:
- **PostgreSQL Database** - Managed database for user data, projects, and drawing metadata
- **Supabase Storage** - S3-compatible object storage for drawing data and thumbnails
- **Prisma ORM** - Type-safe database access with auto-generated TypeScript types

## Prerequisites

- Supabase account (sign up at [supabase.com](https://supabase.com))
- Node.js 20+ installed locally
- Basic understanding of PostgreSQL and environment variables

## Creating a Supabase Project

### Step 1: Create New Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: `excalidraw-organizer` (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier works for development

4. Click **"Create new project"**
5. Wait 2-3 minutes for project provisioning

### Step 2: Get Project Credentials

Once your project is ready:

1. Go to **Settings** → **API**
2. Note down the following:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (for client-side)
   - **service_role key**: `eyJhbGc...` (for backend - keep secret!)

3. Go to **Settings** → **Database**
4. Scroll to **Connection string** → **URI**
5. Copy the connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with your database password

## Database Setup

### Understanding Prisma Integration

The application uses Prisma ORM to interact with Supabase PostgreSQL:

- **Prisma Schema**: Defines database structure in `backend/prisma/schema.prisma`
- **Prisma Client**: Auto-generated TypeScript client for type-safe queries
- **Migrations**: Managed through Prisma Migrate

### Database Schema

The application uses three main tables:

1. **users** - User accounts and authentication
2. **projects** - Project containers for organizing drawings
3. **drawings** - Drawing metadata and references to storage

All tables use UUIDs for primary keys and include timestamps for auditing.

## Storage Setup

### Step 1: Create Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click **"New bucket"**
3. Configure bucket:
   - **Name**: `excalidraw-drawings`
   - **Public bucket**: ✅ Enable (for thumbnail access)
   - **File size limit**: 50 MB (recommended)
   - **Allowed MIME types**: Leave empty or specify `application/json, image/png, image/webp`

4. Click **"Create bucket"**

### Step 2: Configure Storage Policies

The bucket needs policies for authenticated users to manage their drawings:

1. Go to **Storage** → **Policies** → `excalidraw-drawings` bucket
2. Click **"New Policy"**

**Policy 1: Allow authenticated users to upload**
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'excalidraw-drawings');
```

**Policy 2: Allow authenticated users to read their files**
```sql
CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'excalidraw-drawings');
```

**Policy 3: Allow authenticated users to delete their files**
```sql
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'excalidraw-drawings');
```

**Policy 4: Allow public read for thumbnails**
```sql
CREATE POLICY "Allow public thumbnail reads"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'excalidraw-drawings' 
  AND (storage.foldername(name))[1] = 'drawings'
);
```

### Storage File Structure

Files are organized as:
```
excalidraw-drawings/
  drawings/
    {drawing-id}/
      data.json       # Drawing JSON data
      thumbnail.png   # Thumbnail image
```

## Environment Configuration

### Backend Environment Variables

Create or update `backend/.env`:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Database Configuration (Prisma)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# Storage Configuration
SUPABASE_STORAGE_BUCKET=excalidraw-drawings

# JWT Configuration
JWT_SECRET=your-strong-jwt-secret-minimum-32-characters
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

### Production Environment Variables

For production (`backend/.env.production`):

```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Database Configuration (Prisma)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true

# Storage Configuration
SUPABASE_STORAGE_BUCKET=excalidraw-drawings

# JWT Configuration (generate with: openssl rand -base64 64)
JWT_SECRET=<strong-random-secret-64-characters>
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=https://app.yourdomain.com
```

### Security Best Practices

⚠️ **Important Security Notes:**

1. **Never commit `.env` files** - They're in `.gitignore` for a reason
2. **Service Role Key** - Keep this secret! It bypasses Row Level Security
3. **Anon Key** - Safe for client-side use, has limited permissions
4. **Database Password** - Use a strong, unique password
5. **JWT Secret** - Generate a cryptographically secure random string
6. **Connection Pooling** - Use `?pgbouncer=true` in production for better performance

## Running Migrations

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

This installs:
- `@supabase/supabase-js` - Supabase client library
- `@prisma/client` - Prisma client for database access
- `prisma` - Prisma CLI (dev dependency)

### Step 2: Generate Prisma Client

```bash
cd backend
npx prisma generate
```

This generates TypeScript types based on your Prisma schema.

### Step 3: Push Schema to Supabase

For development (schema prototyping):
```bash
cd backend
npx prisma db push
```

For production (with migration history):
```bash
cd backend
npx prisma migrate deploy
```

### Step 4: Verify Migration

Check that tables were created:

```bash
# Using Prisma Studio (visual database browser)
npx prisma studio

# Or using Supabase dashboard
# Go to Database → Tables
```

You should see:
- `users` table
- `projects` table
- `drawings` table
- All indexes and foreign keys

## Verification

### 1. Test Database Connection

```bash
cd backend
npm run dev
```

Check logs for:
```
✓ Database connected successfully
✓ Prisma Client initialized
```

### 2. Test Storage Connection

```bash
curl http://localhost:3001/health/storage
```

Expected response:
```json
{
  "status": "ok",
  "storage": "connected",
  "bucket": "excalidraw-drawings"
}
```

### 3. Test API Endpoints

```bash
# Health check
curl http://localhost:3001/health

# Database health
curl http://localhost:3001/health/db
```

### 4. Test Drawing Upload

1. Start the application
2. Sign up for an account
3. Create a new drawing
4. Save the drawing
5. Check Supabase Storage dashboard to verify files were uploaded

## Troubleshooting

### Database Connection Issues

**Problem**: `Error: P1001: Can't reach database server`

**Solutions**:
1. Verify `DATABASE_URL` is correct
2. Check database password (no special characters that need escaping)
3. Ensure your IP is allowed (Supabase allows all by default)
4. Try adding `?connect_timeout=30` to connection string

**Problem**: `Error: P1017: Server has closed the connection`

**Solutions**:
1. Add `?pgbouncer=true` to connection string for connection pooling
2. Reduce `max` connections in Prisma client configuration
3. Check Supabase project isn't paused (free tier pauses after inactivity)

### Storage Connection Issues

**Problem**: `StorageError: Bucket not found`

**Solutions**:
1. Verify bucket name matches `SUPABASE_STORAGE_BUCKET` in `.env`
2. Check bucket exists in Supabase dashboard
3. Ensure service role key has storage permissions

**Problem**: `StorageError: Access denied`

**Solutions**:
1. Verify you're using `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
2. Check storage policies are configured correctly
3. Ensure bucket is set to public if accessing thumbnails publicly

### Prisma Issues

**Problem**: `Error: Prisma schema not found`

**Solutions**:
```bash
cd backend
npx prisma init  # If schema doesn't exist
npx prisma generate  # Regenerate client
```

**Problem**: `Error: Type 'PrismaClient' is not assignable`

**Solutions**:
```bash
cd backend
rm -rf node_modules/@prisma/client
npm install
npx prisma generate
```

### Migration Issues

**Problem**: Migration fails with constraint violations

**Solutions**:
1. Check if tables already exist (drop them if testing)
2. Ensure no conflicting data in database
3. Review migration SQL for errors
4. Use `npx prisma db push --force-reset` for development (⚠️ deletes all data)

### Performance Issues

**Problem**: Slow query performance

**Solutions**:
1. Verify indexes were created (check `prisma/schema.prisma`)
2. Use `EXPLAIN ANALYZE` in Supabase SQL Editor
3. Enable connection pooling with `?pgbouncer=true`
4. Consider upgrading Supabase plan for better performance

## Next Steps

After completing Supabase setup:

1. ✅ **Test the Application** - Run locally and verify all features work
2. ✅ **Review Security** - Ensure all secrets are properly configured
3. ✅ **Set Up Backups** - Enable point-in-time recovery in Supabase
4. ✅ **Monitor Usage** - Check Supabase dashboard for usage metrics
5. ✅ **Deploy to Production** - Follow [DEPLOYMENT.md](DEPLOYMENT.md) guide

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Prisma with Supabase](https://www.prisma.io/docs/guides/database/supabase)

## Support

For issues specific to:
- **Supabase**: [Supabase Support](https://supabase.com/support)
- **Prisma**: [Prisma Community](https://www.prisma.io/community)
- **This Application**: Check GitHub Issues or DEVELOPER_GUIDE.md
