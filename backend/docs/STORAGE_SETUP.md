# Storage Setup Guide

This guide will help you set up S3-compatible storage for the Excalidraw Organizer backend.

## Quick Start (MinIO - Recommended for Development)

### 1. Start MinIO with Docker Compose

```bash
docker-compose -f docker-compose.minio.yml up -d
```

This will:
- Start MinIO on ports 9000 (API) and 9001 (Console)
- Automatically create the `excalidraw-drawings` bucket
- Set up default credentials (minioadmin/minioadmin)

### 2. Verify MinIO is Running

Open the MinIO Console: http://localhost:9001

Login credentials:
- Username: `minioadmin`
- Password: `minioadmin`

### 3. Verify Storage Configuration

Your `.env` file should have:

```env
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=excalidraw-drawings
S3_FORCE_PATH_STYLE=true
```

### 4. Test the Storage Service

Start your backend server:

```bash
npm run dev
```

Test the storage health check:

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

## Manual MinIO Setup (Without Docker Compose)

### 1. Start MinIO

```bash
docker run -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"
```

### 2. Create Bucket

1. Open http://localhost:9001
2. Login with minioadmin/minioadmin
3. Click "Buckets" → "Create Bucket"
4. Name: `excalidraw-drawings`
5. Click "Create Bucket"

### 3. Set Bucket Policy (Optional - for public thumbnails)

1. Select the bucket
2. Go to "Access" → "Access Policy"
3. Set to "Public" or create a custom policy

## AWS S3 Setup (Production)

### 1. Create S3 Bucket

```bash
aws s3 mb s3://your-excalidraw-bucket --region us-east-1
```

Or use the AWS Console:
1. Go to S3 service
2. Click "Create bucket"
3. Enter bucket name
4. Select region
5. Configure settings as needed
6. Click "Create bucket"

### 2. Create IAM User

1. Go to IAM service
2. Click "Users" → "Add user"
3. Enter username (e.g., `excalidraw-storage`)
4. Select "Programmatic access"
5. Attach policy (see below)
6. Save Access Key ID and Secret Access Key

### 3. IAM Policy

Create a policy with these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:HeadObject"
      ],
      "Resource": "arn:aws:s3:::your-excalidraw-bucket/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::your-excalidraw-bucket"
    }
  ]
}
```

### 4. Update Environment Variables

```env
S3_ENDPOINT=                              # Leave empty for AWS S3
S3_REGION=us-east-1                       # Your AWS region
S3_ACCESS_KEY_ID=AKIA...                  # IAM access key
S3_SECRET_ACCESS_KEY=...                  # IAM secret key
S3_BUCKET=your-excalidraw-bucket
S3_FORCE_PATH_STYLE=false                 # Use virtual-hosted style for AWS
```

## Troubleshooting

### Error: "Storage service not initialized"

Make sure your `.env` file has all required S3 configuration variables.

### Error: "Connection refused" or "ECONNREFUSED"

- Check if MinIO is running: `docker ps`
- Verify the endpoint URL in `.env`
- Make sure port 9000 is not blocked by firewall

### Error: "Access Denied" or "403 Forbidden"

- Verify access key and secret key are correct
- Check bucket permissions/policy
- For MinIO, ensure the bucket exists

### Error: "Bucket does not exist"

- Create the bucket manually in MinIO Console
- Or run the setup container: `docker-compose -f docker-compose.minio.yml up minio-setup`

### Health check returns "disconnected"

1. Check MinIO is running:
   ```bash
   curl http://localhost:9000/minio/health/live
   ```

2. Check credentials in `.env` match MinIO

3. Check bucket exists in MinIO Console

## Storage Service Usage

See [src/services/README.md](src/services/README.md) for detailed API documentation.

### Example: Upload a Drawing

```typescript
import { getStorageService } from './services/storage.service';

const storageService = getStorageService();

const drawingData = {
  elements: [...],
  appState: {...}
};

await storageService.uploadDrawing('drawing-123', drawingData);
await storageService.uploadThumbnail('drawing-123', thumbnailBase64);
```

### Example: Download a Drawing

```typescript
const drawing = await storageService.downloadDrawing('drawing-123');
const thumbnail = await storageService.downloadThumbnail('drawing-123');
```

### Example: Delete a Drawing

```typescript
await storageService.deleteDrawing('drawing-123');
```

## Stopping MinIO

```bash
docker-compose -f docker-compose.minio.yml down
```

To also remove the data volume:

```bash
docker-compose -f docker-compose.minio.yml down -v
```
