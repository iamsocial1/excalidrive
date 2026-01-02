# Data Migration Guide: MinIO to Supabase Storage

This guide provides instructions for migrating existing drawing data from MinIO (or AWS S3) to Supabase Storage.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Migration Strategy](#migration-strategy)
- [Step-by-Step Migration](#step-by-step-migration)
- [Verification](#verification)
- [Rollback Plan](#rollback-plan)
- [Troubleshooting](#troubleshooting)

## Overview

This migration moves:
- Drawing JSON data files from MinIO/S3 to Supabase Storage
- Thumbnail images from MinIO/S3 to Supabase Storage
- Database from self-hosted PostgreSQL to Supabase PostgreSQL (with Prisma)

**Migration Approach:**
- Zero-downtime migration using dual-write strategy
- Gradual cutover with rollback capability
- Data verification at each step

## Prerequisites

### Before Starting

- [ ] Supabase project created and configured
- [ ] Supabase storage bucket created (`excalidraw-drawings`)
- [ ] Storage policies configured
- [ ] Backup of current database
- [ ] Backup of current MinIO/S3 data
- [ ] Test environment for validation

### Required Tools

```bash
# Install AWS CLI (for S3/MinIO access)
pip install awscli

# Install Supabase CLI (optional, for advanced operations)
npm install -g supabase

# Install Node.js dependencies
cd backend
npm install
```

### Environment Setup

Create a migration environment file `backend/.env.migration`:

```bash
# Old MinIO/S3 Configuration
OLD_S3_ENDPOINT=http://localhost:9000
OLD_S3_ACCESS_KEY_ID=minioadmin
OLD_S3_SECRET_ACCESS_KEY=minioadmin
OLD_S3_BUCKET=excalidraw-drawings
OLD_S3_REGION=us-east-1

# New Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=excalidraw-drawings

# Database
OLD_DATABASE_URL=postgresql://postgres:password@localhost:5432/excalidraw_organizer
NEW_DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

## Migration Strategy

### Phase 1: Database Migration

1. Export data from old PostgreSQL
2. Transform schema for Prisma compatibility
3. Import to Supabase PostgreSQL
4. Verify data integrity

### Phase 2: Storage Migration

1. List all files in MinIO/S3
2. Download files in batches
3. Upload to Supabase Storage
4. Verify file integrity

### Phase 3: Application Cutover

1. Update environment variables
2. Deploy new application version
3. Monitor for errors
4. Verify functionality

## Step-by-Step Migration

### Step 1: Backup Current Data

```bash
# Backup database
pg_dump -h localhost -U postgres excalidraw_organizer > backup_$(date +%Y%m%d).sql

# Backup MinIO data (if using Docker)
docker-compose exec minio mc mirror myminio/excalidraw-drawings ./minio-backup/

# Or using AWS CLI
aws s3 sync s3://excalidraw-drawings ./s3-backup/ \
  --endpoint-url http://localhost:9000
```

### Step 2: Migrate Database Schema

```bash
cd backend

# 1. Set up Prisma with new Supabase database
export DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"

# 2. Push Prisma schema to Supabase
npx prisma db push

# 3. Generate Prisma Client
npx prisma generate
```

### Step 3: Migrate Database Data

Create a migration script `backend/scripts/migrate-database.ts`:

```typescript
import { PrismaClient as OldPrismaClient } from '@prisma/client';
import { PrismaClient as NewPrismaClient } from '@prisma/client';

const oldDb = new OldPrismaClient({
  datasources: { db: { url: process.env.OLD_DATABASE_URL } }
});

const newDb = new NewPrismaClient({
  datasources: { db: { url: process.env.NEW_DATABASE_URL } }
});

async function migrateData() {
  console.log('Starting database migration...');

  // Migrate users
  const users = await oldDb.user.findMany();
  console.log(`Migrating ${users.length} users...`);
  
  for (const user of users) {
    await newDb.user.upsert({
      where: { id: user.id },
      update: user,
      create: user
    });
  }

  // Migrate projects
  const projects = await oldDb.project.findMany();
  console.log(`Migrating ${projects.length} projects...`);
  
  for (const project of projects) {
    await newDb.project.upsert({
      where: { id: project.id },
      update: project,
      create: project
    });
  }

  // Migrate drawings
  const drawings = await oldDb.drawing.findMany();
  console.log(`Migrating ${drawings.length} drawings...`);
  
  for (const drawing of drawings) {
    await newDb.drawing.upsert({
      where: { id: drawing.id },
      update: drawing,
      create: drawing
    });
  }

  console.log('Database migration complete!');
  
  await oldDb.$disconnect();
  await newDb.$disconnect();
}

migrateData().catch(console.error);
```

Run the migration:

```bash
cd backend
npx ts-node scripts/migrate-database.ts
```

### Step 4: Migrate Storage Files

Create a storage migration script `backend/scripts/migrate-storage.ts`:

```typescript
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import { Readable } from 'stream';

// Old MinIO/S3 client
const oldS3 = new S3Client({
  endpoint: process.env.OLD_S3_ENDPOINT,
  region: process.env.OLD_S3_REGION,
  credentials: {
    accessKeyId: process.env.OLD_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.OLD_S3_SECRET_ACCESS_KEY!
  },
  forcePathStyle: true
});

// New Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function migrateStorage() {
  console.log('Starting storage migration...');

  // List all objects in old bucket
  const listCommand = new ListObjectsV2Command({
    Bucket: process.env.OLD_S3_BUCKET
  });

  const response = await oldS3.send(listCommand);
  const objects = response.Contents || [];

  console.log(`Found ${objects.length} files to migrate`);

  let migrated = 0;
  let failed = 0;

  for (const object of objects) {
    try {
      const key = object.Key!;
      console.log(`Migrating: ${key}`);

      // Download from old storage
      const getCommand = new GetObjectCommand({
        Bucket: process.env.OLD_S3_BUCKET,
        Key: key
      });

      const { Body, ContentType } = await oldS3.send(getCommand);
      const buffer = await streamToBuffer(Body as Readable);

      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from(process.env.SUPABASE_STORAGE_BUCKET!)
        .upload(key, buffer, {
          contentType: ContentType,
          upsert: true
        });

      if (error) {
        console.error(`Failed to upload ${key}:`, error);
        failed++;
      } else {
        migrated++;
        console.log(`✓ Migrated: ${key}`);
      }

      // Rate limiting to avoid overwhelming Supabase
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`Error migrating ${object.Key}:`, error);
      failed++;
    }
  }

  console.log(`\nMigration complete!`);
  console.log(`Migrated: ${migrated}`);
  console.log(`Failed: ${failed}`);
}

migrateStorage().catch(console.error);
```

Run the storage migration:

```bash
cd backend
npx ts-node scripts/migrate-storage.ts
```

### Step 5: Verify Migration

Create a verification script `backend/scripts/verify-migration.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyMigration() {
  console.log('Verifying migration...\n');

  // Verify database
  const userCount = await prisma.user.count();
  const projectCount = await prisma.project.count();
  const drawingCount = await prisma.drawing.count();

  console.log('Database:');
  console.log(`  Users: ${userCount}`);
  console.log(`  Projects: ${projectCount}`);
  console.log(`  Drawings: ${drawingCount}\n`);

  // Verify storage
  const { data: files, error } = await supabase.storage
    .from(process.env.SUPABASE_STORAGE_BUCKET!)
    .list('drawings', {
      limit: 1000,
      offset: 0
    });

  if (error) {
    console.error('Storage verification failed:', error);
  } else {
    console.log('Storage:');
    console.log(`  Files: ${files?.length || 0}\n`);
  }

  // Sample verification - check random drawings
  const sampleDrawings = await prisma.drawing.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });

  console.log('Sample verification:');
  for (const drawing of sampleDrawings) {
    const dataPath = `drawings/${drawing.id}/data.json`;
    const thumbnailPath = `drawings/${drawing.id}/thumbnail.png`;

    const { data: dataFile } = await supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET!)
      .list(`drawings/${drawing.id}`);

    const hasData = dataFile?.some(f => f.name === 'data.json');
    const hasThumbnail = dataFile?.some(f => f.name === 'thumbnail.png');

    console.log(`  Drawing ${drawing.id}:`);
    console.log(`    Data: ${hasData ? '✓' : '✗'}`);
    console.log(`    Thumbnail: ${hasThumbnail ? '✓' : '✗'}`);
  }

  await prisma.$disconnect();
}

verifyMigration().catch(console.error);
```

Run verification:

```bash
cd backend
npx ts-node scripts/verify-migration.ts
```

### Step 6: Update Application Configuration

1. **Update environment variables:**

```bash
# backend/.env.production
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true
SUPABASE_STORAGE_BUCKET=excalidraw-drawings
```

2. **Deploy new application version:**

```bash
# Build Docker images
docker build -t excalidraw-backend:latest ./backend
docker build -t excalidraw-frontend:latest ./excalidraw-organizer

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

3. **Monitor logs:**

```bash
docker-compose -f docker-compose.prod.yml logs -f backend
```

## Verification

### Post-Migration Checklist

- [ ] All users can sign in
- [ ] All projects are visible
- [ ] All drawings load correctly
- [ ] Thumbnails display properly
- [ ] New drawings can be created
- [ ] Drawings can be updated
- [ ] Drawings can be deleted
- [ ] Public sharing works
- [ ] No errors in application logs
- [ ] Database queries perform well
- [ ] Storage uploads/downloads work

### Performance Testing

```bash
# Test API endpoints
curl http://localhost:3001/health
curl http://localhost:3001/health/db
curl http://localhost:3001/health/storage

# Load test (using Apache Bench)
ab -n 100 -c 10 http://localhost:3001/api/drawings/recent
```

## Rollback Plan

If issues occur during migration:

### Rollback Database

```bash
# Restore from backup
psql "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres" < backup_YYYYMMDD.sql
```

### Rollback Application

```bash
# Revert environment variables to old configuration
# Redeploy previous application version
docker-compose -f docker-compose.prod.yml down
# Update .env to use old MinIO/PostgreSQL
docker-compose -f docker-compose.prod.yml up -d
```

### Rollback Storage

If needed, files remain in old MinIO/S3 bucket and can be used by reverting application configuration.

## Troubleshooting

### Migration Script Fails

**Problem**: Database migration script fails with connection error

**Solution**:
```bash
# Verify connection strings
echo $OLD_DATABASE_URL
echo $NEW_DATABASE_URL

# Test connections
psql "$OLD_DATABASE_URL" -c "SELECT 1"
psql "$NEW_DATABASE_URL" -c "SELECT 1"
```

### Storage Upload Fails

**Problem**: Files fail to upload to Supabase Storage

**Solution**:
```bash
# Check storage policies
# Go to Supabase Dashboard → Storage → Policies

# Verify service role key has permissions
# Ensure bucket exists and is accessible

# Check file size limits (default 50MB)
# Increase if needed in Supabase Dashboard
```

### Slow Migration

**Problem**: Migration takes too long

**Solution**:
```typescript
// Increase batch size in migration script
const BATCH_SIZE = 100;

for (let i = 0; i < drawings.length; i += BATCH_SIZE) {
  const batch = drawings.slice(i, i + BATCH_SIZE);
  await Promise.all(batch.map(drawing => 
    newDb.drawing.upsert({
      where: { id: drawing.id },
      update: drawing,
      create: drawing
    })
  ));
  console.log(`Processed ${i + batch.length}/${drawings.length}`);
}
```

### Data Integrity Issues

**Problem**: Some data missing after migration

**Solution**:
```bash
# Run verification script
npx ts-node scripts/verify-migration.ts

# Compare counts
# Old database:
psql "$OLD_DATABASE_URL" -c "SELECT COUNT(*) FROM drawings"

# New database:
psql "$NEW_DATABASE_URL" -c "SELECT COUNT(*) FROM drawings"

# Re-run migration for missing data
```

## Post-Migration Tasks

After successful migration:

1. **Monitor Performance:**
   - Check Supabase Dashboard for usage metrics
   - Monitor API response times
   - Watch for errors in logs

2. **Optimize:**
   - Enable connection pooling (`?pgbouncer=true`)
   - Configure Prisma connection pool size
   - Set up caching if needed

3. **Clean Up:**
   - Keep old MinIO/S3 data for 30 days as backup
   - Archive old database backup
   - Remove migration scripts from production

4. **Documentation:**
   - Update deployment documentation
   - Document new Supabase configuration
   - Update team on new infrastructure

## Support

For migration issues:
- Check [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- Review [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
- Consult [Supabase Documentation](https://supabase.com/docs)
- Contact Supabase Support for platform issues
