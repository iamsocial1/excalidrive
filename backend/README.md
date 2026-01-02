# Excalidraw Organizer Backend API

Backend API for the Excalidraw Drawing Organizer application built with Express, TypeScript, and PostgreSQL.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- S3-compatible storage (AWS S3 or MinIO)
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the database credentials and JWT secret

3. Create PostgreSQL database:
```bash
createdb excalidraw_organizer
```

4. Run database migrations:
```bash
npm run migrate
```

5. Set up storage (choose one):

   **Option A: Local development with MinIO (recommended)**
   ```bash
   # Start MinIO using Docker Compose
   docker-compose -f docker-compose.minio.yml up -d
   
   # MinIO Console will be available at http://localhost:9001
   # Login: minioadmin / minioadmin
   # The bucket 'excalidraw-drawings' will be created automatically
   ```

   **Option B: AWS S3**
   - Create an S3 bucket in AWS Console
   - Create IAM user with S3 permissions
   - Update `.env` with AWS credentials

## Development

Start the development server with hot reload:
```bash
npm run dev
```

The server will start on `http://localhost:3001`

## Production

Build the TypeScript code:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## API Endpoints

### Health Checks
- `GET /health` - Server health check
- `GET /health/db` - Database connection check
- `GET /health/storage` - Storage service connection check
- `GET /api` - API information

### Authentication (To be implemented)
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Authenticate user
- `POST /api/auth/signout` - Invalidate session
- `POST /api/auth/forgot-password` - Send password reset email
- `POST /api/auth/reset-password` - Reset password with token
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Change password

### Drawings (To be implemented)
- `POST /api/drawings` - Create new drawing
- `GET /api/drawings/:id` - Get drawing by ID
- `PUT /api/drawings/:id` - Update drawing
- `DELETE /api/drawings/:id` - Delete drawing
- `GET /api/drawings/recent` - Get recent drawings
- `GET /api/drawings/project/:projectId` - Get drawings by project
- `PUT /api/drawings/:id/move` - Move drawing to different project
- `POST /api/drawings/:id/share` - Generate public share link

### Projects (To be implemented)
- `POST /api/projects` - Create new project
- `GET /api/projects` - Get all user projects
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Public (To be implemented)
- `GET /api/public/:shareId` - Get public drawing (no auth required)

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `name` (VARCHAR)
- `email` (VARCHAR, Unique)
- `password_hash` (VARCHAR)
- `preferences` (JSONB)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Projects Table
- `id` (UUID, Primary Key)
- `name` (VARCHAR)
- `user_id` (UUID, Foreign Key)
- `drawing_count` (INTEGER)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Drawings Table
- `id` (UUID, Primary Key)
- `name` (VARCHAR)
- `user_id` (UUID, Foreign Key)
- `project_id` (UUID, Foreign Key)
- `excalidraw_data` (JSONB)
- `thumbnail` (TEXT)
- `is_public` (BOOLEAN)
- `public_share_id` (VARCHAR, Unique)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `last_accessed_at` (TIMESTAMP)

## Storage Service

The application uses S3-compatible storage for drawings and thumbnails. See [src/services/README.md](src/services/README.md) for detailed documentation.

### Quick Start with MinIO

```bash
# Start MinIO
docker-compose -f docker-compose.minio.yml up -d

# Verify storage is working
curl http://localhost:3001/health/storage
```

### File Structure

```
drawings/
  {drawingId}/
    data.json      # Drawing JSON data
    thumbnail.png  # Thumbnail image
```

## Environment Variables

See `.env.example` for all available configuration options.

### Storage Configuration

```env
S3_ENDPOINT=http://localhost:9000        # MinIO or S3 endpoint
S3_REGION=us-east-1                      # AWS region
S3_ACCESS_KEY_ID=minioadmin              # Access key
S3_SECRET_ACCESS_KEY=minioadmin          # Secret key
S3_BUCKET=excalidraw-drawings            # Bucket name
S3_FORCE_PATH_STYLE=true                 # Required for MinIO
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
