import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { prisma, disconnectPrisma } from './config/database';
import { storageConfig, validateStorageConfig } from './config/storage';
import { initializeStorageService } from './services/storage.service';
import authRoutes from './routes/auth';
import drawingRoutes from './routes/drawings';
import projectRoutes from './routes/projects';
import publicRoutes from './routes/public';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { sanitizeInput } from './middleware/sanitize';
import { apiLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';
import { httpsRedirect, hsts } from './middleware/httpsRedirect';
import { csrfProtection } from './middleware/csrf';

// Load environment variables
dotenv.config();

// Initialize storage service
try {
  validateStorageConfig();
  initializeStorageService(storageConfig);
  logger.info('Storage service initialized successfully');
} catch (error) {
  logger.error('Failed to initialize storage service', error as Error);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    logger.warn('Continuing in development mode without storage service');
  }
}

const app: Application = express();
const PORT = process.env.PORT || 3001;

// HTTPS enforcement and HSTS (must be first)
app.use(httpsRedirect);
app.use(hsts);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // Increased limit for Excalidraw data
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Input sanitization
app.use(sanitizeInput);

// Rate limiting
app.use('/api', apiLimiter);

// CSRF protection (after authentication, before routes)
// Note: This will be applied selectively in routes that need it
app.use('/api', csrfProtection);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database health check
app.get('/health/db', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT NOW()`;
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Database health check failed', error as Error);
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Storage health check
app.get('/health/storage', async (_req: Request, res: Response) => {
  try {
    const { getStorageService } = await import('./services/storage.service');
    const storageService = getStorageService();
    
    // Try to check if a test drawing exists (this will verify connectivity)
    const testId = 'health-check-test';
    await storageService.drawingExists(testId);
    
    res.json({ 
      status: 'ok', 
      storage: 'connected',
      bucket: storageConfig.bucket
    });
  } catch (error) {
    logger.error('Storage health check failed', error as Error);
    res.status(500).json({ 
      status: 'error', 
      storage: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/drawings', drawingRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/public', publicRoutes);

app.get('/api', (_req: Request, res: Response) => {
  res.json({ 
    message: 'Excalidraw Organizer API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      dbHealth: '/health/db',
      auth: '/api/auth/*',
      drawings: '/api/drawings/*',
      projects: '/api/projects/*',
      public: '/api/public/:shareId'
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await disconnectPrisma();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await disconnectPrisma();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled rejection', reason instanceof Error ? reason : new Error(String(reason)));
  process.exit(1);
});

export default app;
