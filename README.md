# Excalidraw Organizer

A full-stack web application for creating, organizing, and sharing drawings using the Excalidraw library. Built with React, TypeScript, Express, and PostgreSQL.

## Features

- 🎨 **Instant Drawing** - Start creating immediately without registration
- 📁 **Project Organization** - Organize drawings into project folders
- 🔗 **Public Sharing** - Generate shareable links for drawings
- 👤 **User Authentication** - Secure signup/signin with JWT
- 🖼️ **Thumbnail Previews** - Visual browsing with auto-generated thumbnails
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🔒 **Security First** - Built with security best practices
- ⚡ **Performance Optimized** - Fast loading with caching and compression

## Quick Start

Get started in minutes with Docker Compose:

```bash
# Clone the repository
git clone <repository-url>
cd excalidraw-organizer

# Start all services
docker-compose up -d

# Build backend (installs Prisma)
docker-compose build backend
docker-compose up -d

# Initialize database
docker-compose exec backend npm run db:push

# Access the application
open http://localhost:5173
```

**Having issues?** See [QUICK_FIX.md](QUICK_FIX.md) for troubleshooting.

For detailed setup instructions, see [QUICKSTART.md](QUICKSTART.md).

## Documentation

- **[Quick Start Guide](./docs/QUICKSTART.md)** - Get up and running quickly
- **[Supabase Setup Guide](./docs/SUPABASE_SETUP.md)** - Configure Supabase and Prisma
- **[Prisma Migration Guide](./docs/PRISMA_MIGRATION_GUIDE.md)** - Database migration commands
- **[Developer Guide](./docs/DEVELOPER_GUIDE.md)** - Comprehensive development guide
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Production deployment instructions
- **[Backend Documentation](backend/README.md)** - Backend API documentation
- **[Frontend Documentation](excalidraw-organizer/README.md)** - Frontend documentation
- **[Security Guide](backend/SECURITY.md)** - Security best practices
- **[Performance Optimizations](./docs/PERFORMANCE_OPTIMIZATIONS.md)** - Performance tuning

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                           │
│              (Vite + TypeScript + Excalidraw)               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Express Backend                          │
│              (Node.js + TypeScript + Prisma)                │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌──────────────────────┐    ┌──────────────────────┐
│   Supabase           │    │   Supabase           │
│   PostgreSQL         │    │   Storage            │
│   (User Data)        │    │   (Drawings)         │
└──────────────────────┘    └──────────────────────┘
```

## Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool with Rolldown
- **Excalidraw** - Drawing library
- **React Router** - Navigation
- **Axios** - HTTP client

### Backend
- **Node.js 20** - Runtime
- **Express 5** - Web framework
- **TypeScript** - Type safety
- **Supabase PostgreSQL** - Managed database (no self-hosting required)
- **Prisma ORM** - Type-safe database access with auto-generated types
- **JWT** - Authentication
- **Supabase Storage** - S3-compatible object storage with built-in CDN

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Local development
- **GitHub Actions** - CI/CD
- **Nginx** - Frontend serving
- **Supabase** - Managed backend infrastructure

## Project Structure

```
.
├── backend/                 # Backend API
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── db/             # Database & migrations
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   ├── Dockerfile
│   └── package.json
│
├── excalidraw-organizer/   # Frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utilities
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── .github/
│   └── workflows/          # CI/CD pipelines
│       ├── ci.yml          # Build and test
│       └── deploy.yml      # Production deployment
│
├── scripts/                # Deployment scripts
│   ├── deploy.sh           # Production deployment
│   └── setup-production.sh # Environment setup
│
├── docker-compose.yml      # Development environment
├── docker-compose.prod.yml # Production environment
├── Makefile               # Common commands
└── DEPLOYMENT.md          # Deployment guide
```

## Development

### Prerequisites

- Docker and Docker Compose (for local development)
- Node.js 20+
- Supabase account (free tier available at [supabase.com](https://supabase.com))

### Using Make Commands

```bash
# Start development environment
make dev

# Run Prisma migrations (production)
make migrate

# Push Prisma schema (development)
make db-push

# Open Prisma Studio (database GUI)
make db-studio

# View logs
make logs

# Stop services
make stop

# Clean up
make clean
```

### Prisma Commands

```bash
# Generate Prisma Client (after schema changes)
cd backend
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Create migration (production)
npx prisma migrate dev --name migration_name

# Deploy migrations (production)
npx prisma migrate deploy

# Open Prisma Studio (visual database browser)
npx prisma studio

# Pull schema from existing database
npx prisma db pull
```

### Manual Setup

See [QUICKSTART.md](docs/QUICKSTART.md) for detailed instructions.

## Deployment

### Production Setup

```bash
# Set up production environment
./scripts/setup-production.sh

# Build Docker images
docker build -t excalidraw-backend:latest ./backend
docker build -t excalidraw-frontend:latest ./excalidraw-organizer

# Deploy
./scripts/deploy.sh
```

### CI/CD Pipeline

The project includes GitHub Actions workflows for:

- **Continuous Integration** - Build and test on pull requests
- **Continuous Deployment** - Deploy to production on merge to main

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions.

## Environment Variables

### Backend

```env
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

# JWT
JWT_SECRET=your-jwt-secret
FRONTEND_URL=https://app.yourdomain.com
```

### Frontend

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_ENV=production
```

**Important Notes:**
- Get Supabase credentials from: https://app.supabase.com/project/_/settings/api
- Never commit `.env` files to version control
- Use `?pgbouncer=true` for production connection pooling
- See [SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) for detailed configuration instructions

## API Documentation

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out

### Drawings
- `POST /api/drawings` - Create drawing
- `GET /api/drawings/:id` - Get drawing
- `PUT /api/drawings/:id` - Update drawing
- `DELETE /api/drawings/:id` - Delete drawing
- `GET /api/drawings/recent` - Get recent drawings

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Public
- `GET /api/public/:shareId` - View shared drawing

## Security

The application implements multiple security measures:

- JWT authentication with secure tokens
- Password hashing with bcrypt
- HTTPS enforcement in production
- CORS protection
- Rate limiting
- Input sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Security headers (Helmet)

See [backend/SECURITY.md](backend/SECURITY.md) for detailed security documentation.

## Performance

Performance optimizations include:

- Virtual scrolling for large lists
- Thumbnail caching
- Database query optimization
- Compression (gzip)
- CDN-ready static assets
- Lazy loading
- Connection pooling

See [PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md) for details.

## Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd excalidraw-organizer
npm test

# Run linting
make lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

[Your License Here]

## Support

- **Documentation**: Check the docs in this repository
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Ask questions in GitHub Discussions

## Acknowledgments

- [Excalidraw](https://excalidraw.com/) - Amazing drawing library
- [React](https://react.dev/) - UI framework
- [Express](https://expressjs.com/) - Backend framework
- [PostgreSQL](https://www.postgresql.org/) - Database
