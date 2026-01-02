# Storage Service

The Storage Service provides S3-compatible storage for Excalidraw drawings and thumbnails.

## Features

- Upload drawing JSON data
- Upload thumbnail images (PNG format)
- Download drawings and thumbnails
- Delete drawings with automatic cleanup of associated files
- Automatic retry logic with exponential backoff
- Support for AWS S3 and MinIO

## Configuration

Set the following environment variables:

```env
S3_ENDPOINT=http://localhost:9000        # MinIO or S3 endpoint
S3_REGION=us-east-1                      # AWS region
S3_ACCESS_KEY_ID=minioadmin              # Access key
S3_SECRET_ACCESS_KEY=minioadmin          # Secret key
S3_BUCKET=excalidraw-drawings            # Bucket name
S3_FORCE_PATH_STYLE=true                 # Required for MinIO
```

## Usage

### Initialize the service

The service is automatically initialized in `src/index.ts`:

```typescript
import { initializeStorageService } from './services/storage.service';
import { storageConfig } from './config/storage';

initializeStorageService(storageConfig);
```

### Use the service

```typescript
import { getStorageService } from './services/storage.service';

const storageService = getStorageService();

// Upload a drawing
const drawingData = { elements: [...], appState: {...} };
const result = await storageService.uploadDrawing('drawing-id-123', drawingData);
console.log('Uploaded to:', result.url);

// Upload a thumbnail (base64 or Buffer)
const thumbnailBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANS...';
await storageService.uploadThumbnail('drawing-id-123', thumbnailBase64);

// Download a drawing
const drawing = await storageService.downloadDrawing('drawing-id-123');

// Download a thumbnail
const thumbnailBuffer = await storageService.downloadThumbnail('drawing-id-123');

// Check if drawing exists
const exists = await storageService.drawingExists('drawing-id-123');

// Delete a drawing (removes both data and thumbnail)
await storageService.deleteDrawing('drawing-id-123');
```

## File Structure

Files are stored with the following structure:

```
drawings/
  {drawingId}/
    data.json      # Drawing JSON data
    thumbnail.png  # Thumbnail image
```

## Error Handling

All operations include automatic retry logic:
- Maximum 3 retry attempts
- Exponential backoff (1s, 2s, 4s)
- Detailed error messages

## Local Development with MinIO

1. Install MinIO:
```bash
# Using Docker
docker run -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"
```

2. Create bucket:
   - Open http://localhost:9001
   - Login with minioadmin/minioadmin
   - Create bucket named "excalidraw-drawings"
   - Set bucket policy to allow read/write

3. Update `.env`:
```env
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=excalidraw-drawings
S3_FORCE_PATH_STYLE=true
```

## Production Deployment with AWS S3

1. Create S3 bucket in AWS Console

2. Create IAM user with S3 permissions:
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
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

3. Update production environment variables:
```env
S3_ENDPOINT=                              # Leave empty for AWS S3
S3_REGION=us-east-1                       # Your AWS region
S3_ACCESS_KEY_ID=AKIA...                  # IAM access key
S3_SECRET_ACCESS_KEY=...                  # IAM secret key
S3_BUCKET=your-bucket-name
S3_FORCE_PATH_STYLE=false                 # Use virtual-hosted style for AWS
```

## Testing

Test the storage service using the health check endpoint:

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
