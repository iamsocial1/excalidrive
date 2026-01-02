import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Create Prisma Client singleton with appropriate configuration
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'info',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
    errorFormat: 'pretty',
  });
};

// Ensure singleton pattern in development with hot reloading
declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

// Set up logging for Prisma events
prisma.$on('query', (e: any) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`Query: ${e.query}`, { params: e.params, duration: `${e.duration}ms` });
  }
});

prisma.$on('error', (e: any) => {
  logger.error(`Prisma Error: ${e.message}`);
});

prisma.$on('info', (e: any) => {
  logger.info(`Prisma Info: ${e.message}`);
});

prisma.$on('warn', (e: any) => {
  logger.warn(`Prisma Warning: ${e.message}`);
});

// Graceful shutdown handler
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Prisma Client disconnected');
}

// Export the Prisma Client instance
export { prisma };
