# Excalidraw Organizer - Comprehensive Developer Guide

> A complete guide for developers working on the Excalidraw Organizer project

## Table of Contents

1. [Project Overview](#project-overview)
2. [Getting Started](#getting-started)
3. [Architecture](#architecture)
4. [Development Workflow](#development-workflow)
5. [Backend Development](#backend-development)
6. [Frontend Development](#frontend-development)
7. [Database Management](#database-management)
8. [Storage System](#storage-system)
9. [Security](#security)
10. [Performance](#performance)
11. [Testing](#testing)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)
14. [Contributing](#contributing)

---

## Project Overview

Excalidraw Organizer is a full-stack web application for creating, organizing, and sharing drawings using the Excalidraw library. It provides a complete solution for managing drawings with project organization, user authentication, and public sharing capabilities.

### Current Implementation Status

The application is fully functional with the following implemented features:

**Frontend (React + TypeScript + Vite):**
- ✅ Canvas page with Excalidraw integration
- ✅ File browser with recent drawings and project views
- ✅ Authentication modal (signup/signin/password reset)
- ✅ Drawing header showing current drawing and project names
- ✅ Custom Excalidraw menu with authentication links
- ✅ Save/Save-as functionality with keyboard shortcuts
- ✅ Drawing card component with hover actions
- ✅ Virtual scrolling for performance
- ✅ Thumbnail caching
- ✅ Public drawing view for shared links
- ✅ Settings section for user preferences
- ✅ Move drawing modal
- ✅ Project detail view
- ✅ Responsive design

**Backend (Node.js + Express + TypeScript + Prisma):**
- ✅ RESTful API with Express 5
- ✅ JWT authentication with bcrypt password hashing
- ✅ CSRF protection for state-changing operations
- ✅ Rate limiting on all endpoints
- ✅ Input validation and sanitization
- ✅ Supabase PostgreSQL with Prisma ORM
- ✅ Type-safe database access with auto-generated types
- ✅ Supabase Storage for drawings and thumbnails
- ✅ Public sharing with cryptographically secure IDs
- ✅ Pagination for all list endpoints
- ✅ Comprehensive error handling
- ✅ Health check endpoints
- ✅ Transaction support for data consistency
- ✅ Password strength validation
- ✅ Logging system

**DevOps:**
- ✅ Docker Compose setup for development
- ✅ Production Docker Compose configuration
- ✅ Prisma migrations system
- ✅ Supabase integration
- ✅ Hot-reload for backend development
- ✅ Nginx configuration for frontend serving
- ✅ Environment variable management
- ✅ Makefile for common operations

### Recent Implementation Changes

**Drawing Header Feature:**
- Added DrawingHeader component to display drawing and project names on canvas
- Positioned at top left, adjacent to Excalidraw sandwich menu
- Shows "Untitled" for new unsaved drawings
- Updates reactively when drawing is renamed
- Integrated with DrawingContext for state management

**Public Sharing:**
- Implemented public drawing view page
- Added share button with copy-to-clipboard functionality
- Cryptographically secure share IDs (32 hex characters)
- Public endpoint with no authentication required
- Share URLs include frontend URL from environment

**Storage System:**
- Migrated to Supabase Storage (S3-compatible)
- No self-hosted storage servers required
- Built-in CDN for fast global access
- Automatic retry logic with exponential backoff
- Health check endpoint for storage connectivity
- Drawing data and thumbnails stored separately

**Security Enhancements:**
- CSRF token generation and validation
- Rate limiting with different limits per endpoint type
- Password strength validation with detailed feedback
- Input sanitization middleware
- Helmet security headers
- HTTPS enforcement in production

**Performance Optimizations:**
- Database indexes for common query patterns
- Pagination on all list endpoints
- Virtual scrolling for large lists
- Thumbnail caching with LRU strategy
- Connection pooling for database
- Compression for large JSON data

### Key Features

- 🎨 **Instant Drawing** - Start creating immediately without registration
- 📁 **Project Organization** - Organize drawings into project folders
- 🔗 **Public Sharing** - Generate shareable links for drawings with cryptographically secure IDs
- 👤 **User Authentication** - Secure signup/signin with JWT and bcrypt password hashing
- 🖼️ **Thumbnail Previews** - Visual browsing with auto-generated thumbnails stored in S3
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🔒 **Security First** - CSRF protection, rate limiting, input validation, XSS prevention
- ⚡ **Performance Optimized** - Virtual scrolling, thumbnail caching, database indexing
- 💾 **Auto-save** - Keyboard shortcut (Ctrl+S) for quick save
- 🏷️ **Drawing Header** - Display drawing and project names on canvas
- 🔄 **Move Drawings** - Move drawings between projects
- 📊 **Pagination** - Efficient loading of large drawing lists
- 🗄️ **Supabase Storage** - Managed S3-compatible storage with built-in CDN
- 🐳 **Docker Ready** - Full Docker Compose setup for development and production
- 🎯 **Prisma ORM** - Type-safe database access with auto-generated types

### Technology Stack

**Frontend:**
- React 19 with TypeScript
- Vite (build tool with Rolldown)
- Excalidraw library
- React Router for navigation
- Axios for HTTP requests

**Backend:**
- Node.js 20 with TypeScript
- Express 5 web framework
- Supabase PostgreSQL (managed database)
- Prisma ORM for type-safe database access
- JWT authentication
- Supabase Storage (S3-compatible)

**DevOps:**
- Docker & Docker Compose
- GitHub Actions CI/CD
- Nginx for frontend serving


---

## Getting Started

### Prerequisites

- **Docker & Docker Compose** - For containerized development (recommended)
- **Node.js 20+** - For local development without Docker
- **Supabase Account** - Free tier available at [supabase.com](https://supabase.com)
- **Git** - Version control
- **Code Editor** - VS Code recommended

### Supabase and Prisma Setup

The application uses Supabase for managed PostgreSQL and storage, with Prisma ORM for type-safe database access.

**Quick Setup:**

1. **Create Supabase Project** - Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
2. **Configure Environment** - Add Supabase credentials to `.env`
3. **Run Prisma Migrations** - `npx prisma db push` or `npx prisma migrate deploy`
4. **Generate Prisma Client** - `npx prisma generate`

**Key Benefits:**

- **Type Safety**: Auto-generated TypeScript types for all database models
- **Developer Experience**: Intuitive API, great IDE support
- **Managed Infrastructure**: No database or storage servers to maintain
- **Scalability**: Supabase handles scaling automatically
- **Built-in Features**: Authentication, real-time, storage all in one platform

### Quick Start with Docker (Recommended - 5 Minutes)

Docker Compose handles the Backend API and Frontend. The application uses Supabase for managed PostgreSQL and storage.

```bash
# 1. Clone the repository
git clone <repository-url>
cd excalidraw-organizer

# 2. Configure Supabase credentials in backend/.env
# See SUPABASE_SETUP.md for details

# 3. Start all services with Docker Compose
docker-compose up -d

# 4. Build backend container (installs Prisma with OpenSSL)
docker-compose build backend
docker-compose up -d

# 5. Initialize database with Prisma
docker-compose exec backend npm run db:push

# 6. Access the application
# Frontend: http://localhost:5173 (Vite dev server)
# Backend:  http://localhost:3001
```

**What Docker Compose Sets Up:**
- Backend API on port 3001 with hot-reload (nodemon)
- Frontend on port 5173 (Vite dev server with HMR)
- Automatic dependency installation (including Prisma 5.x with OpenSSL)
- Volume mounts for live code reloading
- Network connectivity between services

**External Services (Supabase):**
- PostgreSQL database (managed by Supabase)
- S3-compatible storage (Supabase Storage)
- No local database or storage containers needed

### Using Make Commands

The project includes a Makefile for common operations:

```bash
make dev          # Start development environment
make logs         # View logs from all services
make migrate      # Deploy Prisma migrations (production)
make migrate-dev  # Create and apply migrations (development)
make db-push      # Push Prisma schema to database
make db-studio    # Open Prisma Studio (database GUI)
make stop         # Stop all services
make clean        # Remove containers and volumes
make restart      # Restart all services
```

**Note**: Database operations now use Prisma instead of custom SQL migrations.

### Docker Development Workflow

#### Starting Development

```bash
# Start all services in detached mode
docker-compose up -d

# View logs from all services
docker-compose logs -f

# View logs from specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

#### Making Code Changes

**Backend Changes:**
- Edit files in `backend/src/`
- Changes are automatically detected by nodemon
- Backend restarts automatically
- No need to rebuild Docker image

**Frontend Changes:**
- Edit files in `excalidraw-organizer/src/`
- For development with hot-reload, run frontend locally:
  ```bash
  cd excalidraw-organizer
  npm install
  npm run dev
  # Access at http://localhost:5173 (Vite dev server)
  ```
- For production build testing, rebuild frontend container:
  ```bash
  docker-compose build frontend
  docker-compose up -d frontend
  ```

#### Database Operations (Prisma)

```bash
# Push schema changes to database (development)
docker-compose exec backend npm run db:push

# Create and apply migration (with history)
docker-compose exec backend npm run migrate:dev

# Deploy migrations (production)
docker-compose exec backend npm run migrate

# Open Prisma Studio (visual database browser)
docker-compose exec backend npm run db:studio

# Generate Prisma Client (after schema changes)
docker-compose exec backend npm run prisma:generate

# Validate Prisma schema
docker-compose exec backend npx prisma validate
```

**Note**: Database is hosted on Supabase. Access via:
- Supabase Dashboard: https://app.supabase.com
- Direct connection: Use DATABASE_URL from `.env`

#### Storage Operations (Supabase Storage)

```bash
# Storage is managed by Supabase
# Access via Supabase Dashboard: https://app.supabase.com
# Navigate to: Storage → excalidraw-drawings bucket

# Check storage health
curl http://localhost:3001/health/storage
```

#### Stopping and Cleaning Up

```bash
# Stop all services (preserves data)
docker-compose stop

# Stop and remove containers (preserves volumes)
docker-compose down

# Remove everything including volumes (CAUTION: deletes all data)
docker-compose down -v

# Remove specific service
docker-compose stop backend
docker-compose rm backend
```

#### Rebuilding Containers

```bash
# Rebuild all containers
docker-compose build

# Rebuild specific service
docker-compose build backend

# Rebuild without cache
docker-compose build --no-cache

# Rebuild and restart
docker-compose up -d --build
```

#### Troubleshooting Docker Setup

```bash
# Check service status
docker-compose ps

# Check service health
docker-compose exec backend curl http://localhost:3001/health
docker-compose exec backend curl http://localhost:3001/health/db
docker-compose exec backend curl http://localhost:3001/health/storage

# Restart specific service
docker-compose restart backend

# View resource usage
docker stats

# Clean up unused Docker resources
docker system prune -a
```

### Local Development Setup (Without Docker)

For development without Docker, you'll need to set up each service manually.

#### Backend Setup

```bash
# 1. Create Supabase Project
# Follow SUPABASE_SETUP.md for detailed instructions
# Get your project URL, anon key, and service role key

# 2. Install dependencies
cd backend
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your Supabase settings:
# SUPABASE_URL=https://xxxxx.supabase.co
# SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
# SUPABASE_STORAGE_BUCKET=excalidraw-drawings

# 4. Run Prisma migrations
npx prisma db push
npx prisma generate

# 5. Start backend with hot-reload
npm run dev
```

#### Frontend Setup

```bash
# 1. Install dependencies
cd excalidraw-organizer
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings:
# VITE_API_BASE_URL=http://localhost:3001/api

# 3. Start frontend with hot-reload
npm run dev

# Access at http://localhost:5173
```

### Environment Variables

#### Backend (.env)

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database Configuration (Prisma)
DATABASE_URL=postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres

# Storage Configuration
SUPABASE_STORAGE_BUCKET=excalidraw-drawings

# Authentication
JWT_SECRET=dev_jwt_secret_change_in_production
JWT_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

**Important Notes:**
- Get Supabase credentials from: https://app.supabase.com/project/_/settings/api
- DATABASE_URL format: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres`
- Never commit `.env` files to version control
- See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed configuration

#### Frontend (.env)

```bash
VITE_API_BASE_URL=http://localhost:3001/api
VITE_ENV=development
```


---

## Architecture

### System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
    end
    
    subgraph "Frontend - React Application"
        UI[UI Components<br/>Canvas, FileBrowser, Auth]
        Context[React Contexts<br/>Auth, Drawing]
        Services[Service Layer<br/>Auth, Drawing, Project]
        APIClient[API Client<br/>Axios + Interceptors]
    end
    
    subgraph "Backend - Express API"
        Routes[API Routes<br/>Auth, Drawings, Projects, Public]
        Middleware[Middleware<br/>Auth, CSRF, Rate Limit, Validation]
        Storage[Storage Service<br/>S3 Operations]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL<br/>Users, Projects,<br/>Drawing Metadata)]
        S3[(MinIO/S3<br/>Drawing Data,<br/>Thumbnails)]
    end
    
    Browser --> UI
    UI --> Context
    Context --> Services
    Services --> APIClient
    APIClient -->|HTTP/REST| Routes
    Routes --> Middleware
    Middleware --> Storage
    Middleware --> DB
    Storage --> S3
    
    style Browser fill:#e1f5ff
    style UI fill:#fff3e0
    style Context fill:#fff3e0
    style Services fill:#fff3e0
    style Routes fill:#e8f5e9
    style Middleware fill:#e8f5e9
    style Storage fill:#e8f5e9
    style DB fill:#f3e5f5
    style S3 fill:#f3e5f5
```

### Component Architecture

```mermaid
graph LR
    subgraph "Pages"
        Canvas[CanvasPage<br/>Excalidraw Integration]
        Browser[FileBrowser<br/>File Management]
        Public[PublicDrawingView<br/>Shared Drawings]
    end
    
    subgraph "Core Components"
        Header[DrawingHeader<br/>Name Display]
        LeftPanel[LeftPanel<br/>Navigation]
        Recent[RecentSection<br/>Recent Drawings]
        Projects[ProjectsSection<br/>Project List]
        Detail[ProjectDetailView<br/>Project Drawings]
        Settings[SettingsSection<br/>User Settings]
    end
    
    subgraph "Shared Components"
        Card[DrawingCard<br/>Drawing Display]
        Modal[Modals<br/>Auth, Save, Move]
        Virtual[VirtualList<br/>Performance]
    end
    
    Canvas --> Header
    Browser --> LeftPanel
    LeftPanel --> Recent
    LeftPanel --> Projects
    LeftPanel --> Settings
    Projects --> Detail
    Recent --> Card
    Detail --> Card
    Canvas --> Modal
    Recent --> Virtual
    Detail --> Virtual
    
    style Canvas fill:#bbdefb
    style Browser fill:#bbdefb
    style Public fill:#bbdefb
    style Header fill:#c8e6c9
    style Card fill:#fff9c4
    style Modal fill:#fff9c4
```

### Docker Architecture

```mermaid
graph TB
    subgraph "Docker Compose Network"
        subgraph "Frontend Container"
            Nginx[Nginx<br/>Port 5174]
            StaticFiles[Static Files<br/>React Build]
        end
        
        subgraph "Backend Container"
            Express[Express API<br/>Port 3001]
            Nodemon[Nodemon<br/>Hot Reload]
            Prisma[Prisma Client<br/>Type-safe ORM]
        end
    end
    
    subgraph "Supabase (Managed)"
        SupabaseDB[PostgreSQL<br/>Managed Database]
        SupabaseStorage[Storage<br/>S3-compatible + CDN]
    end
    
    Host[Host Machine<br/>localhost] --> Nginx
    Host --> Express
    
    Nginx --> StaticFiles
    Express --> Nodemon
    Express --> Prisma
    Prisma --> SupabaseDB
    Express --> SupabaseStorage
    
    style Nginx fill:#e3f2fd
    style Express fill:#e8f5e9
    style Prisma fill:#c8e6c9
    style SupabaseDB fill:#f3e5f5
    style SupabaseStorage fill:#fff3e0
    style Host fill:#ffebee
```

### Project Structure

```
excalidraw-organizer/
├── backend/                    # Backend API
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   │   ├── cookies.ts     # Cookie settings
│   │   │   ├── database.ts    # Database connection
│   │   │   └── storage.ts     # S3 storage config
│   │   ├── db/                # Database
│   │   │   ├── migrations/    # SQL migration files
│   │   │   ├── migrate.ts     # Migration runner
│   │   │   └── schema.sql     # Database schema
│   │   ├── middleware/        # Express middleware
│   │   │   ├── auth.ts        # JWT authentication
│   │   │   ├── csrf.ts        # CSRF protection
│   │   │   ├── errorHandler.ts # Error handling
│   │   │   ├── rateLimiter.ts # Rate limiting
│   │   │   ├── sanitize.ts    # Input sanitization
│   │   │   └── validation.ts  # Input validation
│   │   ├── routes/            # API routes
│   │   │   ├── auth.ts        # Authentication endpoints
│   │   │   ├── drawings.ts    # Drawing endpoints
│   │   │   └── projects.ts    # Project endpoints
│   │   ├── services/          # Business logic
│   │   │   └── storage.service.ts # S3 storage service
│   │   ├── utils/             # Utility functions
│   │   │   ├── asyncHandler.ts # Async error wrapper
│   │   │   ├── auth.ts        # Auth utilities
│   │   │   ├── compression.ts # Data compression
│   │   │   ├── database.ts    # DB transactions
│   │   │   ├── errors.ts      # Custom error classes
│   │   │   ├── logger.ts      # Logging system
│   │   │   └── sanitize.ts    # Sanitization utils
│   │   └── index.ts           # Application entry point
│   ├── Dockerfile             # Backend container
│   └── package.json           # Backend dependencies
│
├── excalidraw-organizer/      # Frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── AuthModal.tsx  # Login/signup modal
│   │   │   ├── DrawingCard.tsx # Drawing preview card
│   │   │   ├── LeftPanel.tsx  # Navigation panel
│   │   │   ├── ProjectsSection.tsx # Projects view
│   │   │   ├── VirtualList.tsx # Virtual scrolling
│   │   │   └── ...
│   │   ├── contexts/          # React contexts
│   │   │   ├── AuthContext.tsx # Auth state
│   │   │   └── DrawingContext.tsx # Drawing state
│   │   ├── pages/             # Page components
│   │   │   ├── CanvasPage.tsx # Drawing canvas
│   │   │   ├── FileBrowser.tsx # File browser
│   │   │   └── PublicDrawingView.tsx # Public view
│   │   ├── services/          # API services
│   │   │   ├── auth.service.ts # Auth API
│   │   │   ├── drawing.service.ts # Drawing API
│   │   │   └── project.service.ts # Project API
│   │   ├── types/             # TypeScript types
│   │   │   ├── auth.types.ts
│   │   │   ├── drawing.types.ts
│   │   │   └── project.types.ts
│   │   ├── utils/             # Utility functions
│   │   │   ├── api.client.ts  # Axios client
│   │   │   ├── cache.utils.ts # Thumbnail cache
│   │   │   ├── debounce.utils.ts # Debouncing
│   │   │   └── storage.utils.ts # Local storage
│   │   └── main.tsx           # Application entry
│   ├── Dockerfile             # Frontend container
│   ├── nginx.conf             # Nginx configuration
│   └── package.json           # Frontend dependencies
│
├── .github/
│   └── workflows/             # CI/CD pipelines
│       ├── ci.yml             # Build and test
│       └── deploy.yml         # Production deployment
│
├── scripts/                   # Deployment scripts
│   ├── deploy.sh              # Production deployment
│   └── setup-production.sh    # Environment setup
│
├── docker-compose.yml         # Development environment
├── docker-compose.prod.yml    # Production environment
├── Makefile                   # Common commands
└── [Documentation files]
```


---

## Development Workflow

### Daily Development Cycle

1. **Start Services**
   ```bash
   make dev
   # or
   docker-compose up -d
   ```

2. **Make Changes**
   - Backend: Edit files in `backend/src/` (auto-reload with nodemon)
   - Frontend: Edit files in `excalidraw-organizer/src/` (HMR with Vite)

3. **View Logs**
   ```bash
   make logs
   # or
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

4. **Test Changes**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Health check: http://localhost:3001/health

5. **Run Migrations** (if database changes)
   ```bash
   make migrate
   ```

6. **Commit Changes**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
```

### Commit Message Convention

Follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add project sharing functionality
fix: resolve thumbnail loading issue
docs: update API documentation
refactor: improve error handling in auth routes
```

### Code Style

**TypeScript:**
- Use TypeScript strict mode
- Define interfaces for all data structures
- Use meaningful variable names
- Add JSDoc comments for complex functions

**React:**
- Use functional components with hooks
- Keep components small and focused
- Use TypeScript for props
- Extract reusable logic into custom hooks

**Backend:**
- Use async/await for asynchronous operations
- Wrap async route handlers with `asyncHandler`
- Use custom error classes for error handling
- Add logging for important operations


---

## Backend Development

### API Structure

All API endpoints follow RESTful conventions:

```
/api/auth/*        - Authentication endpoints
/api/drawings/*    - Drawing management
/api/projects/*    - Project management
/api/public/*      - Public access (no auth)
/health/*          - Health checks
```

### Complete API Reference

#### Authentication Endpoints

**POST /api/auth/signup**
- Create new user account
- Body: `{ name, email, password }`
- Returns: `{ user, token }`
- Rate limit: 5 requests per 15 minutes

**POST /api/auth/signin**
- Authenticate user
- Body: `{ email, password }`
- Returns: `{ user, token }`
- Rate limit: 5 requests per 15 minutes

**POST /api/auth/signout**
- Invalidate session (client-side)
- Requires: Authentication
- Returns: `{ message }`

**POST /api/auth/forgot-password**
- Request password reset
- Body: `{ email }`
- Returns: `{ message, resetToken? }` (token only in dev)
- Rate limit: 3 requests per hour

**POST /api/auth/reset-password**
- Reset password with token
- Body: `{ token, newPassword }`
- Returns: `{ message }`
- Rate limit: 3 requests per hour

**PUT /api/auth/profile**
- Update user profile
- Requires: Authentication
- Body: `{ name?, email?, preferences? }`
- Returns: `{ user }`

**PUT /api/auth/password**
- Change password
- Requires: Authentication
- Body: `{ currentPassword, newPassword }`
- Returns: `{ message }`

**GET /api/auth/csrf-token**
- Get CSRF token
- Requires: Authentication
- Returns: `{ csrfToken }`

#### Drawing Endpoints

**POST /api/drawings**
- Create new drawing
- Requires: Authentication, CSRF token
- Body: `{ name, projectId, excalidrawData, thumbnail? }`
- Returns: `{ drawing }`

**GET /api/drawings/recent**
- Get recent drawings with pagination
- Requires: Authentication
- Query: `?limit=50&offset=0`
- Returns: `{ drawings[], count, totalCount, hasMore }`

**GET /api/drawings/project/:projectId**
- Get drawings by project
- Requires: Authentication
- Query: `?limit=50&offset=0`
- Returns: `{ drawings[], count, totalCount, hasMore }`

**GET /api/drawings/:id**
- Get drawing by ID
- Requires: Authentication
- Returns: `{ drawing }` (includes excalidrawData)

**PUT /api/drawings/:id**
- Update drawing
- Requires: Authentication, CSRF token
- Body: `{ name?, excalidrawData?, thumbnail? }`
- Returns: `{ drawing }`

**DELETE /api/drawings/:id**
- Delete drawing
- Requires: Authentication, CSRF token
- Returns: `{ message, id }`

**PUT /api/drawings/:id/move**
- Move drawing to different project
- Requires: Authentication, CSRF token
- Body: `{ targetProjectId }`
- Returns: `{ drawing }`

**POST /api/drawings/:id/share**
- Generate public share link
- Requires: Authentication, CSRF token
- Returns: `{ shareId, shareUrl }`

#### Project Endpoints

**POST /api/projects**
- Create new project
- Requires: Authentication, CSRF token
- Body: `{ name }`
- Returns: `{ project }`

**GET /api/projects**
- Get all user projects
- Requires: Authentication
- Query: `?limit=100&offset=0`
- Returns: `{ projects[], count, totalCount, hasMore }`

**GET /api/projects/:id**
- Get project by ID
- Requires: Authentication
- Returns: `{ project }`

**PUT /api/projects/:id**
- Update project name
- Requires: Authentication, CSRF token
- Body: `{ name }`
- Returns: `{ project }`

**DELETE /api/projects/:id**
- Delete project (must be empty)
- Requires: Authentication, CSRF token
- Returns: `{ message, id }`

#### Public Endpoints

**GET /api/public/:shareId**
- Get public drawing (no auth required)
- Returns: `{ drawing }` (includes excalidrawData)

#### Health Check Endpoints

**GET /health**
- Basic health check
- Returns: `{ status, timestamp, environment }`

**GET /health/db**
- Database health check
- Returns: `{ status, database, timestamp }`

**GET /health/storage**
- Storage health check
- Returns: `{ status, storage, bucket }`

### Creating a New API Endpoint

1. **Define the route** in `backend/src/routes/`:

```typescript
import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body } from 'express-validator';

const router = Router();

// Validation rules
const createItemValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').optional().trim(),
];

// Route handler
router.post(
  '/items',
  authenticate,
  createItemValidation,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const userId = req.user!.id;

    // Business logic here
    const item = await createItem(userId, name, description);

    res.status(201).json(item);
  })
);

export default router;
```

2. **Register the route** in `backend/src/index.ts`:

```typescript
import itemRoutes from './routes/items';
app.use('/api/items', itemRoutes);
```

### Error Handling

Use custom error classes from `utils/errors.ts`:

```typescript
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors';

// Not found
if (!drawing) {
  throw new NotFoundError('Drawing not found');
}

// Validation error
if (!isValidEmail(email)) {
  throw new ValidationError('Invalid email format');
}

// Authorization error
if (drawing.userId !== req.user!.id) {
  throw new AuthorizationError('You do not have permission to access this drawing');
}
```

### Database Operations

Use transactions for multi-step operations:

```typescript
import { withTransaction } from '../utils/database';

await withTransaction(async (client) => {
  // Step 1: Insert into table A
  await client.query(
    'INSERT INTO table_a (id, name) VALUES ($1, $2)',
    [id, name]
  );

  // Step 2: Insert into table B
  await client.query(
    'INSERT INTO table_b (id, ref_id) VALUES ($1, $2)',
    [id2, id]
  );

  // Both operations commit together or rollback on error
});
```

### Logging

Use the logger utility for consistent logging:

```typescript
import { logger } from '../utils/logger';

// Info logging
logger.info('User created successfully', { userId, email });

// Error logging
logger.error('Failed to create user', { error: error.message, email });

// Warning
logger.warn('Rate limit approaching', { userId, requestCount });

// Debug (development only)
logger.debug('Processing request', { body: req.body });
```

### Input Validation

Use express-validator for input validation:

```typescript
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation';

const validation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  param('id').isUUID(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

router.post('/endpoint', validation, validateRequest, asyncHandler(async (req, res) => {
  // Validated data is safe to use
}));
```

### Rate Limiting

Apply rate limiters to protect endpoints:

```typescript
import { authLimiter, apiLimiter } from '../middleware/rateLimiter';

// Strict rate limiting for auth
router.post('/auth/signin', authLimiter, ...);

// General API rate limiting
router.use('/api', apiLimiter);
```

### Environment Variables

Access environment variables through config files:

```typescript
// backend/src/config/database.ts
export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'excalidraw_organizer',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
};
```


---

## Frontend Development

### Component Structure

Follow this pattern for React components:

```typescript
// DrawingCard.tsx
import React from 'react';
import { Drawing } from '@/types';
import './DrawingCard.css';

interface DrawingCardProps {
  drawing: Drawing;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const DrawingCard: React.FC<DrawingCardProps> = ({
  drawing,
  onSelect,
  onDelete,
}) => {
  const handleClick = () => {
    onSelect(drawing.id);
  };

  return (
    <div className="drawing-card" onClick={handleClick}>
      <img src={drawing.thumbnail} alt={drawing.name} />
      <h3>{drawing.name}</h3>
      {onDelete && (
        <button onClick={(e) => {
          e.stopPropagation();
          onDelete(drawing.id);
        }}>
          Delete
        </button>
      )}
    </div>
  );
};
```

### Using Contexts

Access global state through contexts:

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { useDrawing } from '@/contexts/DrawingContext';

function MyComponent() {
  const { user, signin, signout } = useAuth();
  const { drawings, createDrawing, updateDrawing } = useDrawing();

  // Use context values and methods
}
```

### API Service Calls

Use service classes for API calls:

```typescript
// services/drawing.service.ts
import { apiClient } from '@/utils/api.client';
import { Drawing, CreateDrawingRequest } from '@/types';

export class DrawingService {
  static async getDrawings(): Promise<Drawing[]> {
    const response = await apiClient.get('/drawings/recent');
    return response.data.drawings;
  }

  static async createDrawing(data: CreateDrawingRequest): Promise<Drawing> {
    const response = await apiClient.post('/drawings', data);
    return response.data;
  }

  static async updateDrawing(id: string, data: Partial<Drawing>): Promise<Drawing> {
    const response = await apiClient.put(`/drawings/${id}`, data);
    return response.data;
  }
}
```

### Path Aliases

Use TypeScript path aliases for cleaner imports:

```typescript
// ✅ Good - Using path aliases
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { DrawingService } from '@/services/drawing.service';

// ❌ Avoid - Relative paths
import { Button } from '../../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
```

### State Management

Use React hooks for local state:

```typescript
import { useState, useEffect } from 'react';

function MyComponent() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Data[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await DataService.getData();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;
  return <DataList data={data} />;
}
```

### Styling

Use CSS modules or scoped CSS:

```css
/* DrawingCard.css */
.drawing-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: transform 0.2s;
}

.drawing-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.drawing-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
}
```

### Environment Variables

Access Vite environment variables:

```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
const environment = import.meta.env.VITE_ENV;
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;
```

### Performance Optimization

Use React.memo for expensive components:

```typescript
import React, { memo } from 'react';

export const ExpensiveComponent = memo<Props>(({ data }) => {
  // Component logic
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.data.id === nextProps.data.id;
});
```

Use lazy loading for code splitting:

```typescript
import { lazy, Suspense } from 'react';

const CanvasPage = lazy(() => import('@/pages/CanvasPage'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CanvasPage />
    </Suspense>
  );
}
```


---

## Database Management

### Prisma ORM

The application uses Prisma ORM for type-safe database access with Supabase PostgreSQL.

**Key Features:**
- Auto-generated TypeScript types
- Type-safe queries
- Migration management
- Visual database browser (Prisma Studio)
- Excellent IDE support

### Prisma Schema

The database schema is defined in `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name         String    @db.VarChar(255)
  email        String    @unique @db.VarChar(255)
  passwordHash String    @map("password_hash") @db.VarChar(255)
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt    DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  preferences  Json      @default("{}")
  
  projects     Project[]
  drawings     Drawing[]
  
  @@index([email])
  @@map("users")
}

model Project {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name         String    @db.VarChar(255)
  userId       String    @map("user_id") @db.Uuid
  drawingCount Int       @default(0) @map("drawing_count")
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt    DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  drawings     Drawing[]
  
  @@unique([userId, name])
  @@index([userId])
  @@map("projects")
}

model Drawing {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            String    @db.VarChar(255)
  userId          String    @map("user_id") @db.Uuid
  projectId       String    @map("project_id") @db.Uuid
  excalidrawData  Json      @map("excalidraw_data")
  thumbnail       String?   @db.Text
  isPublic        Boolean   @default(false) @map("is_public")
  publicShareId   String?   @unique @map("public_share_id") @db.VarChar(255)
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime  @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  lastAccessedAt  DateTime  @default(now()) @map("last_accessed_at") @db.Timestamptz(6)
  
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  project         Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([projectId])
  @@index([lastAccessedAt(sort: Desc)])
  @@index([publicShareId])
  @@map("drawings")
}
```

### Prisma Commands

**Generate Prisma Client** (after schema changes):
```bash
cd backend
npx prisma generate
```

**Push Schema to Database** (development):
```bash
cd backend
npx prisma db push
```

**Create Migration** (production):
```bash
cd backend
npx prisma migrate dev --name add_new_feature
```

**Deploy Migrations** (production):
```bash
cd backend
npx prisma migrate deploy
```

**Open Prisma Studio** (visual database browser):
```bash
cd backend
npx prisma studio
```

**Pull Schema from Database** (sync schema with existing database):
```bash
cd backend
npx prisma db pull
```

### Database Queries with Prisma

Prisma provides type-safe queries that prevent SQL injection:

```typescript
import { prisma } from '../config/database';

// ✅ Find user by email
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' }
});

// ✅ Get drawings with pagination
const drawings = await prisma.drawing.findMany({
  where: { userId },
  include: {
    project: true,
    user: { select: { name: true, email: true } }
  },
  orderBy: { lastAccessedAt: 'desc' },
  take: 50,
  skip: 0
});

// ✅ Create new drawing
const drawing = await prisma.drawing.create({
  data: {
    name: 'My Drawing',
    userId,
    projectId,
    excalidrawData: drawingData,
    thumbnail: thumbnailData
  }
});

// ✅ Update drawing
const updated = await prisma.drawing.update({
  where: { id: drawingId },
  data: { name: 'Updated Name' }
});

// ✅ Delete drawing
await prisma.drawing.delete({
  where: { id: drawingId }
});

// ✅ Transaction
await prisma.$transaction(async (tx) => {
  await tx.drawing.delete({ where: { id: drawingId } });
  await tx.project.update({
    where: { id: projectId },
    data: { drawingCount: { decrement: 1 } }
  });
});
```

### Prisma Client Configuration

The Prisma client is configured in `backend/src/config/database.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

**Connection Pooling:**

For production with Supabase, use connection pooling:

```bash
# In .env.production
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true
```

### Database Backup

**Supabase Backups:**

Supabase provides automatic daily backups on paid plans. For free tier:

```bash
# Manual backup using pg_dump
pg_dump "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres" > backup.sql

# Restore from backup
psql "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres" < backup.sql
```

**Enable Point-in-Time Recovery:**

1. Go to Supabase Dashboard → Database → Backups
2. Enable PITR (available on Pro plan)
3. Configure retention period

### Database Indexes

Performance indexes are defined in migrations:

```sql
-- Composite indexes for common queries
CREATE INDEX idx_drawings_user_last_accessed 
  ON drawings(user_id, last_accessed_at DESC);

CREATE INDEX idx_drawings_project_updated 
  ON drawings(project_id, updated_at DESC);

-- Partial index for public drawings
CREATE INDEX idx_drawings_public_active 
  ON drawings(public_share_id) 
  WHERE is_public = TRUE;
```

### Accessing the Database

**Using Prisma Studio** (recommended):
```bash
cd backend
npx prisma studio
# Opens visual database browser at http://localhost:5555
```

**Using Supabase Dashboard:**
1. Go to Supabase Dashboard → Database → Table Editor
2. Browse and edit data visually

**Using psql:**
```bash
psql "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"

# Common queries
\dt              # List tables
\d users         # Describe users table
\di              # List indexes
SELECT * FROM users LIMIT 10;
```


---

## Storage System

### Supabase Storage

The application uses Supabase Storage (S3-compatible) for drawings and thumbnails.

**Key Features:**
- S3-compatible API
- Built-in CDN
- Image transformations
- Access control with policies
- Automatic backups

### File Structure

```
s3://excalidraw-drawings/
  drawings/
    {drawingId}/
      data.json      # Drawing JSON data
      thumbnail.png  # Thumbnail image (300x200 WebP/PNG)
```

### Storage Service Usage

```typescript
import { getStorageService } from './services/storage.service';

const storageService = getStorageService();

// Upload drawing
const drawingData = {
  elements: [...],
  appState: {...},
  files: {...}
};
await storageService.uploadDrawing(drawingId, drawingData);

// Upload thumbnail (base64 or Buffer)
const thumbnailBase64 = 'data:image/png;base64,iVBORw0KGgo...';
await storageService.uploadThumbnail(drawingId, thumbnailBase64);

// Download drawing
const drawing = await storageService.downloadDrawing(drawingId);

// Download thumbnail
const thumbnailBuffer = await storageService.downloadThumbnail(drawingId);

// Check existence
const exists = await storageService.drawingExists(drawingId);

// Delete (removes both data and thumbnail)
await storageService.deleteDrawing(drawingId);
```

### Supabase Storage Setup

Follow the [SUPABASE_SETUP.md](SUPABASE_SETUP.md) guide to:

1. Create storage bucket named `excalidraw-drawings`
2. Configure storage policies for access control
3. Set up environment variables

**Environment Configuration:**
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=excalidraw-drawings
```

**Storage Policies:**

The bucket uses Row Level Security (RLS) policies:
- Authenticated users can upload/read/delete their files
- Public read access for thumbnails
- Service role key bypasses RLS for backend operations

### Storage Health Check

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

### Error Handling

The storage service includes automatic retry logic:
- Maximum 3 retry attempts
- Exponential backoff (1s, 2s, 4s)
- Detailed error messages

```typescript
try {
  await storageService.uploadDrawing(id, data);
} catch (error) {
  if (error instanceof StorageError) {
    logger.error('Storage operation failed', { error: error.message });
  }
}
```


---

## Security

### Security Features

The application implements comprehensive security measures:

1. **HTTPS Enforcement** - Automatic redirect in production
2. **Security Headers** - Helmet middleware
3. **CSRF Protection** - Token-based validation
4. **Rate Limiting** - Multiple limiters for different endpoints
5. **Password Security** - Bcrypt hashing with strength validation
6. **SQL Injection Prevention** - Parameterized queries
7. **XSS Prevention** - Input sanitization
8. **JWT Authentication** - Secure token-based auth
9. **Secure Cookies** - httpOnly, secure, sameSite flags

### Authentication Flow

```typescript
// 1. User signs up
POST /api/auth/signup
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}

// 2. Server returns JWT token
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "...", "name": "John Doe", "email": "..." }
}

// 3. Client includes token in subsequent requests
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

// 4. Server validates token and processes request
```

### CSRF Protection

For state-changing operations (POST, PUT, DELETE):

```typescript
// 1. Get CSRF token
GET /api/auth/csrf-token
Authorization: Bearer <jwt-token>

// Response
{ "csrfToken": "abc123..." }

// 2. Include token in requests
POST /api/drawings
Authorization: Bearer <jwt-token>
X-CSRF-Token: abc123...
```

### Password Requirements

- Minimum 8 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- No common patterns (password, 123456, etc.)

### Rate Limits

| Endpoint | Window | Max Requests |
|----------|--------|--------------|
| General API | 15 min | 100 |
| Authentication | 15 min | 5 |
| Password Reset | 1 hour | 3 |
| Public Drawings | 15 min | 50 |
| Drawing Operations | 1 min | 30 |

### Security Best Practices

**For Developers:**

1. **Never commit secrets**
   ```bash
   # Use .env files (gitignored)
   # Rotate secrets regularly
   ```

2. **Always validate input**
   ```typescript
   const validation = [
     body('email').isEmail(),
     body('password').isLength({ min: 8 }),
   ];
   ```

3. **Use parameterized queries**
   ```typescript
   // ✅ Safe
   await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
   
   // ❌ Unsafe
   await pool.query(`SELECT * FROM users WHERE id = '${userId}'`);
   ```

4. **Sanitize user input**
   ```typescript
   import { sanitizeString } from '../utils/sanitize';
   const safeName = sanitizeString(req.body.name);
   ```

5. **Use custom error classes**
   ```typescript
   throw new AuthorizationError('Access denied');
   // Don't expose sensitive information in errors
   ```

### Environment Variables Security

```bash
# Development (.env)
JWT_SECRET=dev-secret-change-in-production
NODE_ENV=development

# Production (.env.production)
JWT_SECRET=<strong-random-secret-minimum-32-characters>
NODE_ENV=production
DB_PASSWORD=<strong-database-password>
S3_SECRET_ACCESS_KEY=<strong-secret-key>
```

### Security Checklist

- [x] HTTPS enforcement in production
- [x] Helmet middleware for security headers
- [x] CSRF protection for state-changing operations
- [x] Rate limiting on all endpoints
- [x] Password strength validation
- [x] SQL injection prevention
- [x] XSS prevention
- [x] Secure session management
- [x] JWT token authentication
- [x] Bcrypt password hashing
- [x] Input validation on all endpoints
- [x] Error handling without information leakage
- [x] CORS configuration
- [x] Request size limits

For complete security documentation, see [backend/SECURITY.md](backend/SECURITY.md).


---

## Performance

### Backend Optimizations

1. **Database Indexing**
   - Composite indexes for common queries
   - Partial indexes for filtered queries
   - Optimized count queries

2. **Pagination**
   ```typescript
   GET /api/drawings/recent?limit=50&offset=0
   
   // Response includes pagination metadata
   {
     "drawings": [...],
     "count": 50,
     "totalCount": 250,
     "hasMore": true
   }
   ```

3. **Connection Pooling**
   - PostgreSQL connection pool (max 20 connections)
   - Automatic connection management

4. **Data Compression**
   ```typescript
   import { compress, decompress } from '../utils/compression';
   
   // Compress large JSON data
   const compressed = await compress(largeData);
   ```

### Frontend Optimizations

1. **Thumbnail Caching**
   ```typescript
   import { thumbnailCache } from '@/utils/cache.utils';
   
   // Cache thumbnail (LRU cache, 5MB max)
   thumbnailCache.set(drawingId, thumbnailDataUrl);
   
   // Retrieve from cache
   const cached = thumbnailCache.get(drawingId);
   ```

2. **Virtual Scrolling**
   ```typescript
   import { VirtualList } from '@/components/VirtualList';
   
   <VirtualList
     items={drawings}
     itemHeight={80}
     containerHeight={600}
     renderItem={(drawing) => <DrawingCard drawing={drawing} />}
     overscan={3}
   />
   ```

3. **Lazy Loading**
   ```typescript
   const CanvasPage = lazy(() => import('@/pages/CanvasPage'));
   ```

4. **Auto-save Debouncing**
   ```typescript
   // Auto-save with 2-second debounce
   const debouncedSave = debounce(saveDrawing, 2000);
   ```

5. **WebP Thumbnails**
   - 80% quality for optimal size/quality
   - Automatic fallback to PNG

### Performance Metrics

Expected improvements:
- **Initial Load Time**: 30-40% faster with lazy loading
- **Memory Usage**: 50-60% reduction with virtual scrolling
- **Network Traffic**: 40-50% reduction with caching
- **Database Query Time**: 60-70% faster with indexes
- **Storage Efficiency**: 30-40% reduction with WebP

### Monitoring

Track these metrics:
- API response times (p50, p95, p99)
- Database query execution times
- Cache hit/miss ratios
- Bundle sizes and load times
- Memory usage patterns
- Network payload sizes

For complete performance documentation, see [PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md).


---

## Testing

### Backend Testing

#### Unit Tests

```typescript
// Example: auth.test.ts
import { validatePassword } from '../utils/passwordValidation';

describe('Password Validation', () => {
  it('should accept strong passwords', () => {
    const result = validatePassword('SecurePass123');
    expect(result.isValid).toBe(true);
  });

  it('should reject weak passwords', () => {
    const result = validatePassword('weak');
    expect(result.isValid).toBe(false);
  });
});
```

#### Integration Tests

```typescript
// Example: auth.integration.test.ts
import request from 'supertest';
import app from '../index';

describe('POST /api/auth/signup', () => {
  it('should create a new user', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
  });
});
```

#### Running Tests

```bash
cd backend
npm test

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Frontend Testing

#### Component Tests

```typescript
// Example: DrawingCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DrawingCard } from './DrawingCard';

describe('DrawingCard', () => {
  const mockDrawing = {
    id: '123',
    name: 'Test Drawing',
    thumbnail: 'data:image/png;base64,...'
  };

  it('should render drawing name', () => {
    render(<DrawingCard drawing={mockDrawing} onSelect={() => {}} />);
    expect(screen.getByText('Test Drawing')).toBeInTheDocument();
  });

  it('should call onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(<DrawingCard drawing={mockDrawing} onSelect={onSelect} />);
    
    fireEvent.click(screen.getByText('Test Drawing'));
    expect(onSelect).toHaveBeenCalledWith('123');
  });
});
```

#### Running Tests

```bash
cd excalidraw-organizer
npm test

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Manual Testing

#### API Testing with curl

```bash
# Health check
curl http://localhost:3001/health

# Sign up
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"SecurePass123"}'

# Sign in
curl -X POST http://localhost:3001/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123"}'

# Get drawings (with auth)
curl http://localhost:3001/api/drawings/recent \
  -H "Authorization: Bearer <token>"
```

#### API Testing with Postman

1. Import the API collection (if available)
2. Set environment variables:
   - `baseUrl`: http://localhost:3001
   - `token`: (obtained from signin)
3. Test endpoints

### Test Coverage Goals

- **Backend**: Aim for 80%+ coverage
- **Frontend**: Aim for 70%+ coverage
- **Critical paths**: 100% coverage (auth, payments, data loss prevention)

### Testing Checklist

- [ ] Unit tests for utility functions
- [ ] Integration tests for API endpoints
- [ ] Component tests for React components
- [ ] E2E tests for critical user flows
- [ ] Security testing (SQL injection, XSS)
- [ ] Performance testing (load testing)
- [ ] Browser compatibility testing
- [ ] Mobile responsiveness testing


---

## Deployment

### Production Deployment

#### Prerequisites

- Docker and Docker Compose installed on server
- Domain name configured
- SSL certificate (Let's Encrypt recommended)
- PostgreSQL database (managed or self-hosted)
- S3 storage (AWS S3 or compatible)

#### Quick Deployment

```bash
# 1. Set up production environment
./scripts/setup-production.sh

# 2. Build Docker images
docker build -t excalidraw-backend:latest ./backend
docker build -t excalidraw-frontend:latest ./excalidraw-organizer

# 3. Deploy
./scripts/deploy.sh
```

#### Manual Deployment Steps

1. **Configure Environment Variables**

   Create `.env.production` files:

   ```bash
   # backend/.env.production
   NODE_ENV=production
   PORT=3001
   DB_HOST=your-db-host
   DB_NAME=excalidraw_organizer
   DB_USER=your-db-user
   DB_PASSWORD=your-strong-password
   JWT_SECRET=your-strong-jwt-secret-minimum-32-chars
   FRONTEND_URL=https://app.yourdomain.com
   S3_BUCKET=your-bucket-name
   S3_REGION=us-east-1
   S3_ACCESS_KEY_ID=your-access-key
   S3_SECRET_ACCESS_KEY=your-secret-key
   ```

   ```bash
   # excalidraw-organizer/.env.production
   VITE_API_BASE_URL=https://api.yourdomain.com/api
   VITE_ENV=production
   ```

2. **Build Docker Images**

   ```bash
   docker build -t excalidraw-backend:latest ./backend
   docker build -t excalidraw-frontend:latest ./excalidraw-organizer
   ```

3. **Run Database Migrations**

   ```bash
   docker run --rm \
     --env-file backend/.env.production \
     excalidraw-backend:latest \
     npm run migrate
   ```

4. **Start Services**

   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

5. **Configure Nginx (Reverse Proxy)**

   ```nginx
   # /etc/nginx/sites-available/excalidraw
   server {
       listen 80;
       server_name app.yourdomain.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name app.yourdomain.com;

       ssl_certificate /etc/letsencrypt/live/app.yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/app.yourdomain.com/privkey.pem;

       location / {
           proxy_pass http://localhost:5173;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }

   server {
       listen 443 ssl http2;
       server_name api.yourdomain.com;

       ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

       location / {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

6. **Enable and Restart Nginx**

   ```bash
   sudo ln -s /etc/nginx/sites-available/excalidraw /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### CI/CD Pipeline

The project includes GitHub Actions workflows:

#### Continuous Integration (.github/workflows/ci.yml)

Runs on pull requests:
- Lint code
- Run tests
- Build Docker images
- Check for security vulnerabilities

#### Continuous Deployment (.github/workflows/deploy.yml)

Runs on merge to main:
- Build production images
- Push to container registry
- Deploy to production server
- Run database migrations
- Health check verification

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Database created and migrated
- [ ] S3 bucket created and configured
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Nginx configured and running
- [ ] Docker images built
- [ ] Services started
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backups configured
- [ ] Logs aggregation configured

### Monitoring and Logging

#### Health Checks

```bash
# Server health
curl https://api.yourdomain.com/health

# Database health
curl https://api.yourdomain.com/health/db

# Storage health
curl https://api.yourdomain.com/health/storage
```

#### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100 backend
```

#### Log Aggregation

Consider using:
- **CloudWatch Logs** (AWS)
- **Datadog**
- **Loggly**
- **Papertrail**

### Backup Strategy

#### Database Backups

```bash
# Automated daily backup (cron job)
0 2 * * * docker-compose -f /path/to/docker-compose.prod.yml exec -T postgres pg_dump -U postgres excalidraw_organizer | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz

# Restore from backup
gunzip < backup.sql.gz | docker-compose exec -T postgres psql -U postgres excalidraw_organizer
```

#### S3 Backups

Enable versioning on your S3 bucket for automatic backup of drawings.

### Scaling

#### Horizontal Scaling

1. **Load Balancer**: Use Nginx or AWS ALB
2. **Multiple Backend Instances**: Scale backend containers
3. **Database Read Replicas**: For read-heavy workloads
4. **Redis Cache**: Add caching layer
5. **CDN**: Serve static assets from CDN

#### Vertical Scaling

- Increase container resources (CPU, memory)
- Upgrade database instance
- Optimize database queries

For complete deployment documentation, see [DEPLOYMENT.md](DEPLOYMENT.md).


---

## Troubleshooting

### Recent Fixes (November 2024)

The following issues have been resolved in the current codebase:

✅ **Prisma Schema Not Found** - Added `backend/prisma` volume mount to docker-compose files
✅ **OpenSSL Missing** - Added `openssl` installation to Dockerfile for Prisma engines
✅ **Prisma Version Mismatch** - Container now installs Prisma 5.x from package.json
✅ **TypeScript Strict Mode Errors** - Added explicit type annotations for Prisma event handlers
✅ **Read-Only Volume Mounts** - Removed `:ro` flags from source directories for hot-reload
✅ **Obsolete Docker Compose Version** - Removed deprecated `version` attribute

**If you encounter these issues**, ensure you have the latest code and rebuild:
```bash
git pull
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
docker-compose exec backend npm run db:push
```

**For detailed fix documentation**, see:
- [FINAL_SETUP_COMPLETE.md](FINAL_SETUP_COMPLETE.md) - Complete setup summary
- [PRISMA_MIGRATION_GUIDE.md](PRISMA_MIGRATION_GUIDE.md) - Prisma migration guide
- [PRISMA_VERSION_FIX.md](PRISMA_VERSION_FIX.md) - Version issue details
- [DOCKER_FIX_SUMMARY.md](DOCKER_FIX_SUMMARY.md) - Docker configuration fixes

### Common Issues

#### Port Already in Use

**Problem**: Error "port already in use" when starting services

**Solution**:
```bash
# Find process using the port (Linux/Mac)
lsof -i :5173
lsof -i :3001

# Find process using the port (Windows)
netstat -ano | findstr :5173

# Kill the process or change port in docker-compose.yml
```

#### Database Connection Failed

**Problem**: Backend can't connect to PostgreSQL

**Solution**:
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres

# Verify connection settings in .env
DB_HOST=postgres  # Use service name in Docker
DB_PORT=5432
```

#### Supabase Connection Failed

**Problem**: Cannot connect to Supabase database

**Solution**:
```bash
# 1. Verify DATABASE_URL in .env
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres

# 2. Check Supabase project is active (not paused)
# Go to Supabase Dashboard → Project Settings

# 3. Test connection
cd backend
npx prisma db pull

# 4. For connection pooling issues, add pgbouncer
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true
```

#### Supabase Storage Connection Failed

**Problem**: Storage health check fails

**Solution**:
```bash
# 1. Verify Supabase credentials in .env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=excalidraw-drawings

# 2. Check bucket exists in Supabase Dashboard → Storage

# 3. Verify storage policies are configured
# Go to Storage → Policies

# 4. Test storage connection
curl http://localhost:3001/health/storage
```

#### Prisma Issues

**Problem**: "Could not find Prisma Schema" error

**Solution**:
```bash
# The prisma directory needs to be mounted in the container
# This is already fixed in docker-compose.yml and docker-compose.override.yml

# Restart containers to apply volume mounts
docker-compose down
docker-compose up -d

# Verify prisma directory is accessible
docker-compose exec backend ls -la /app/prisma
# Should show: schema.prisma
```

**Problem**: "Need to install prisma@7.0.0" or Prisma version mismatch

**Solution**:
```bash
# The container needs to be rebuilt to install Prisma 5.x from package.json
docker-compose down
docker-compose build backend
docker-compose up -d

# Verify correct version is installed
docker-compose exec backend npx prisma --version
# Should show: prisma: 5.22.0

# Always use npm run commands (not npx) to use installed version
docker-compose exec backend npm run db:push
```

**Problem**: "Error loading shared library libssl.so.1.1" or OpenSSL errors

**Solution**:
```bash
# OpenSSL is required for Prisma engines on Alpine Linux
# This is already fixed in the Dockerfile with: RUN apk add --no-cache openssl

# Rebuild container to install OpenSSL
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d

# Verify Prisma engines work
docker-compose exec backend npx prisma --version
# Should show: Computed binaryTarget: linux-musl-openssl-3.0.x
```

**Problem**: "sh: prisma: not found" when running npm scripts

**Solution**:
```bash
# Dependencies need to be installed in the container
docker-compose exec backend npm install

# Or rebuild the container
docker-compose build backend
docker-compose up -d
```

**Problem**: Prisma Client not found or outdated

**Solution**:
```bash
# Regenerate Prisma Client
docker-compose exec backend npm run prisma:generate

# Or from host
cd backend
rm -rf node_modules/@prisma/client
npm install
npx prisma generate
```

**Problem**: Migration fails

**Solution**:
```bash
# For development, reset database
docker-compose exec backend npx prisma migrate reset

# For production, check migration status
docker-compose exec backend npx prisma migrate status

# Deploy pending migrations
docker-compose exec backend npm run migrate
```

**Problem**: TypeScript errors with Prisma event handlers

**Solution**:
```bash
# Event parameters need explicit type annotations
# Example fix in backend/src/config/database.ts:
prisma.$on('query', (e: any) => {
  logger.debug(`Query: ${e.query}`);
});

# This is already fixed in the codebase
```

#### Frontend Can't Connect to Backend

**Problem**: API requests fail with CORS or connection errors

**Solution**:
```bash
# 1. Check backend is running
curl http://localhost:3001/health

# 2. Verify CORS settings in backend/.env
FRONTEND_URL=http://localhost:5173

# 3. Check frontend API URL in excalidraw-organizer/.env
VITE_API_BASE_URL=http://localhost:3001/api

# 4. Check browser console for specific errors
```

#### Docker Build Fails

**Problem**: Docker build fails with errors

**Solution**:
```bash
# Clear Docker cache
docker builder prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check Dockerfile syntax
# Verify all files referenced in Dockerfile exist
```

#### Docker Volume Mount Issues

**Problem**: Changes to source files not detected by nodemon

**Solution**:
```bash
# Volume mounts should not be read-only for source directories
# Check docker-compose.override.yml:
volumes:
  - ./backend/src:/app/src          # NOT :ro
  - ./backend/prisma:/app/prisma    # NOT :ro

# Restart containers after fixing
docker-compose down
docker-compose up -d
```

**Problem**: "version is obsolete" warning from Docker Compose

**Solution**:
```bash
# Remove the version attribute from docker-compose files
# Docker Compose v2+ doesn't require it

# This is already fixed in:
# - docker-compose.yml
# - docker-compose.override.yml  
# - docker-compose.prod.yml
```

#### JWT Token Invalid

**Problem**: Authentication fails with "Invalid token"

**Solution**:
```bash
# 1. Verify JWT_SECRET is set in backend/.env
JWT_SECRET=your-secret-key

# 2. Clear browser cookies/localStorage
# 3. Sign in again to get new token
# 4. Check token expiration (default 7 days)
```

#### Database Migration Fails

**Problem**: Migration script fails to run

**Solution**:
```bash
# 1. Check database connection
docker-compose exec backend npm run migrate

# 2. View migration logs
docker-compose logs backend

# 3. Manually run migrations
docker-compose exec postgres psql -U postgres excalidraw_organizer
# Then run SQL from migration files

# 4. Check migration file syntax
```

#### High Memory Usage

**Problem**: Application consuming too much memory

**Solution**:
```bash
# 1. Check Docker stats
docker stats

# 2. Limit container memory in docker-compose.yml
services:
  backend:
    mem_limit: 512m
  frontend:
    mem_limit: 256m

# 3. Check for memory leaks in code
# 4. Enable virtual scrolling for large lists
# 5. Clear thumbnail cache
```

#### Slow API Responses

**Problem**: API requests are slow

**Solution**:
```bash
# 1. Check database query performance
# Add EXPLAIN ANALYZE to slow queries

# 2. Verify indexes exist
\di  # In PostgreSQL

# 3. Enable pagination for large datasets
# 4. Check database connection pool size
# 5. Monitor database CPU/memory usage
# 6. Consider adding Redis cache
```

### Debug Mode

Enable debug logging:

```bash
# Backend
NODE_ENV=development  # In .env

# Frontend
VITE_DEBUG=true  # In .env

# View detailed logs
docker-compose logs -f backend
```

### Getting Help

1. **Check Documentation**
   - README.md
   - QUICKSTART.md
   - DEPLOYMENT.md
   - Backend/Frontend specific docs

2. **Check Logs**
   ```bash
   docker-compose logs -f
   ```

3. **Health Checks**
   ```bash
   curl http://localhost:3001/health
   curl http://localhost:3001/health/db
   curl http://localhost:3001/health/storage
   ```

4. **GitHub Issues**
   - Search existing issues
   - Create new issue with:
     - Description of problem
     - Steps to reproduce
     - Expected vs actual behavior
     - Logs and error messages
     - Environment details

5. **Community**
   - GitHub Discussions
   - Stack Overflow (tag: excalidraw)


---

## Contributing

### How to Contribute

We welcome contributions! Here's how to get started:

1. **Fork the Repository**
   ```bash
   # Click "Fork" on GitHub
   git clone https://github.com/your-username/excalidraw-organizer.git
   cd excalidraw-organizer
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

3. **Make Changes**
   - Write clean, documented code
   - Follow existing code style
   - Add tests for new features
   - Update documentation

4. **Test Your Changes**
   ```bash
   # Backend tests
   cd backend && npm test
   
   # Frontend tests
   cd excalidraw-organizer && npm test
   
   # Lint code
   make lint
   
   # Manual testing
   make dev
   ```

5. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

6. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create Pull Request on GitHub
   ```

### Code Style Guidelines

#### TypeScript

```typescript
// Use meaningful names
const getUserDrawings = async (userId: string): Promise<Drawing[]> => {
  // Implementation
};

// Add JSDoc for complex functions
/**
 * Validates and sanitizes user input
 * @param input - Raw user input
 * @returns Sanitized string
 */
const sanitizeInput = (input: string): string => {
  // Implementation
};

// Use interfaces for data structures
interface Drawing {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
}
```

#### React Components

```typescript
// Use functional components with TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  disabled = false 
}) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
};
```

#### CSS

```css
/* Use BEM naming convention */
.drawing-card {
  /* Block */
}

.drawing-card__title {
  /* Element */
}

.drawing-card--featured {
  /* Modifier */
}

/* Use meaningful class names */
.is-loading { }
.has-error { }
```

### Pull Request Guidelines

**PR Title Format:**
```
feat: add user profile page
fix: resolve thumbnail loading issue
docs: update API documentation
refactor: improve error handling
test: add tests for auth service
```

**PR Description Should Include:**
- What changes were made
- Why the changes were necessary
- How to test the changes
- Screenshots (for UI changes)
- Related issues (Fixes #123)

**Before Submitting:**
- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No console.log or debug code
- [ ] Commits are clean and descriptive
- [ ] Branch is up to date with main

### Code Review Process

1. **Automated Checks**
   - CI pipeline runs tests
   - Linting checks pass
   - Build succeeds

2. **Manual Review**
   - Code quality review
   - Security review
   - Performance considerations
   - Documentation review

3. **Feedback**
   - Address review comments
   - Update PR as needed
   - Request re-review

4. **Merge**
   - Approved by maintainer
   - All checks passing
   - Squash and merge

### Areas for Contribution

**Good First Issues:**
- Documentation improvements
- UI/UX enhancements
- Bug fixes
- Test coverage improvements

**Feature Requests:**
- Real-time collaboration
- Drawing templates
- Export to PDF/PNG
- Drawing versioning
- Team workspaces
- Advanced search

**Performance:**
- Query optimization
- Caching improvements
- Bundle size reduction
- Load time optimization

**Security:**
- Security audits
- Penetration testing
- Dependency updates
- Security documentation

### Development Resources

**Documentation:**
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Excalidraw Documentation](https://docs.excalidraw.com/)

**Tools:**
- [VS Code](https://code.visualstudio.com/)
- [Postman](https://www.postman.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [pgAdmin](https://www.pgadmin.org/)

### License

This project is licensed under [Your License]. By contributing, you agree that your contributions will be licensed under the same license.

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow
- Follow project guidelines

---

## Additional Resources

### Documentation Files

- **[README.md](README.md)** - Project overview
- **[QUICKSTART.md](QUICKSTART.md)** - Quick start guide
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment instructions
- **[SECURITY.md](backend/SECURITY.md)** - Security documentation
- **[PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md)** - Performance guide
- **[STORAGE_SETUP.md](backend/STORAGE_SETUP.md)** - Storage configuration
- **[ERROR_HANDLING.md](backend/src/ERROR_HANDLING.md)** - Error handling guide

### API Documentation

See individual route files for detailed API documentation:
- `backend/src/routes/auth.ts` - Authentication endpoints
- `backend/src/routes/drawings.ts` - Drawing endpoints
- `backend/src/routes/projects.ts` - Project endpoints

### Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email**: support@yourdomain.com

---

---

## Document Updates

**Last Updated: November 2025**

### Recent Changes to This Guide

This developer guide has been comprehensively updated to reflect the current implementation:

**New Sections Added:**
- Detailed Docker development workflow with step-by-step instructions
- Complete API reference with all endpoints, parameters, and responses
- Docker architecture diagram showing container relationships
- Current implementation status with feature checklist
- Recent implementation changes documentation
- Comprehensive troubleshooting for Docker setup

**Enhanced Sections:**
- Getting Started now includes both Docker and local development paths
- Architecture section includes Mermaid diagrams for better visualization
- Component architecture diagram showing relationships
- Environment variables documentation for both Docker and local setups
- Docker-specific commands and operations

**Key Improvements:**
- Clear distinction between Docker and local development workflows
- Step-by-step Docker operations (start, stop, rebuild, logs, etc.)
- Complete endpoint documentation with authentication requirements
- Visual architecture diagrams using Mermaid
- Implementation status tracking
- Better organization and navigation

---

**Happy Coding! 🚀**


---

## Prisma Commands Reference

### Essential Commands

**Generate Prisma Client** (after schema changes):
```bash
npx prisma generate
```

**Push Schema to Database** (development - no migration files):
```bash
npx prisma db push
```

**Create Migration** (production - with migration history):
```bash
npx prisma migrate dev --name descriptive_name
```

**Deploy Migrations** (production):
```bash
npx prisma migrate deploy
```

**Reset Database** (⚠️ deletes all data):
```bash
npx prisma migrate reset
```

### Database Introspection

**Pull Schema from Database** (sync Prisma schema with existing database):
```bash
npx prisma db pull
```

**Validate Schema**:
```bash
npx prisma validate
```

### Database Management

**Open Prisma Studio** (visual database browser):
```bash
npx prisma studio
```

**Check Migration Status**:
```bash
npx prisma migrate status
```

**Resolve Migration Issues**:
```bash
npx prisma migrate resolve --applied "migration_name"
npx prisma migrate resolve --rolled-back "migration_name"
```

### Seeding

**Run Seed Script**:
```bash
npx prisma db seed
```

Create seed script in `backend/prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create seed data
  const user = await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: 'hashed_password'
    }
  });

  console.log('Seed data created:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

### Debugging

**Enable Query Logging**:
```typescript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

**Format Prisma Schema**:
```bash
npx prisma format
```

### Common Workflows

**Adding a New Model**:
```bash
# 1. Edit prisma/schema.prisma
# 2. Generate client
npx prisma generate
# 3. Create migration
npx prisma migrate dev --name add_new_model
```

**Modifying Existing Model**:
```bash
# 1. Edit prisma/schema.prisma
# 2. Generate client
npx prisma generate
# 3. Create migration
npx prisma migrate dev --name modify_model
```

**Deploying to Production**:
```bash
# 1. Ensure all migrations are committed
git add prisma/migrations
git commit -m "Add database migrations"

# 2. On production server
npx prisma migrate deploy
npx prisma generate
```

---

## Supabase and Prisma Troubleshooting

### Common Issues

#### Prisma Client Out of Sync

**Problem**: Type errors after schema changes

**Solution**:
```bash
cd backend
rm -rf node_modules/@prisma/client
npm install
npx prisma generate
```

#### Connection Pool Exhausted

**Problem**: `Error: Can't reach database server`

**Solution**:
```bash
# Add connection pooling to DATABASE_URL
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true

# Or configure Prisma connection pool
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

#### Migration Conflicts

**Problem**: Migration fails due to conflicts

**Solution**:
```bash
# Check migration status
npx prisma migrate status

# Resolve applied migration
npx prisma migrate resolve --applied "migration_name"

# Or reset (⚠️ development only)
npx prisma migrate reset
```

#### Supabase Project Paused

**Problem**: Connection fails after inactivity

**Solution**:
1. Go to Supabase Dashboard
2. Click "Restore" on paused project
3. Wait for project to resume
4. Retry connection

#### Slow Queries

**Problem**: Database queries are slow

**Solution**:
```bash
# 1. Check indexes in schema
# Ensure indexes exist for common queries

# 2. Use Prisma query logging
const prisma = new PrismaClient({
  log: ['query'],
});

# 3. Analyze queries in Supabase Dashboard
# Go to Database → Query Performance

# 4. Add indexes if needed
model Drawing {
  @@index([userId, lastAccessedAt(sort: Desc)])
}
```

#### Storage Upload Fails

**Problem**: Files fail to upload to Supabase Storage

**Solution**:
```bash
# 1. Verify credentials
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# 2. Check bucket exists
# Go to Supabase Dashboard → Storage

# 3. Verify storage policies
# Ensure service role key has permissions

# 4. Check file size limits
# Default is 50MB, increase if needed
```

### Best Practices

**Connection Management**:
```typescript
// Create single Prisma instance
export const prisma = new PrismaClient();

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

**Error Handling**:
```typescript
try {
  const user = await prisma.user.findUnique({
    where: { email }
  });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      throw new Error('Unique constraint violation');
    }
  }
  throw error;
}
```

**Transactions**:
```typescript
// Use $transaction for atomic operations
await prisma.$transaction(async (tx) => {
  await tx.drawing.delete({ where: { id: drawingId } });
  await tx.project.update({
    where: { id: projectId },
    data: { drawingCount: { decrement: 1 } }
  });
});
```

**Performance**:
```typescript
// Use select to fetch only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true
  }
});

// Use include for relations
const drawings = await prisma.drawing.findMany({
  include: {
    project: true,
    user: { select: { name: true } }
  }
});
```

---

## Additional Resources

### Supabase Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Supabase Community](https://github.com/supabase/supabase/discussions)

### Prisma Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma with Supabase](https://www.prisma.io/docs/guides/database/supabase)
- [Prisma Community](https://www.prisma.io/community)

### Migration Resources

- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Complete Supabase and Prisma setup guide
- [DATA_MIGRATION_GUIDE.md](DATA_MIGRATION_GUIDE.md) - Migrating from self-hosted to Supabase
- [Prisma Documentation](https://www.prisma.io/docs) - Official Prisma docs
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate) - Migration system
- [Supabase Documentation](https://supabase.com/docs) - Official Supabase docs
- [Prisma with Supabase](https://www.prisma.io/docs/guides/database/supabase) - Integration guide

### Project Documentation

- [README.md](README.md) - Project overview
- [QUICKSTART.md](QUICKSTART.md) - Quick start guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment instructions
- [SECURITY.md](backend/SECURITY.md) - Security best practices
- [PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md) - Performance tuning
