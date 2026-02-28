import { Server } from 'http';
import app from './app';
import config from './config/env';
import logger from './utils/logger';
import prisma from './config/database';

let server: Server;

async function startServer() {
  try {
    await prisma.$connect();

    server = app.listen(config.port, () => {
      logger.info(`Server running on http://localhost:${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`API endpoints available at http://localhost:${config.port}/api`);
    });
    server.on('error', (error: NodeJS.ErrnoException) => {
      logger.error('Server experienced a critical error:', error);
      process.exit(1);
    });
  } catch (error: unknown) {
    logger.error('Failed to start the server by unknown error.', error);
    process.exit(1);
  }
}

const IntendedShutdown = async (signal: string) => {
  logger.info(`\nReceived ${signal}. Starting shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server has been closed now.');
      await prisma.$disconnect();
      logger.info('Database connection has been closed. Now, safe to exit.');
      process.exit(0);
    });
  } else {
    await prisma.$disconnect();
    process.exit(0);
  }
};
process.on('SIGINT', () => IntendedShutdown('SIGINT'));
process.on('SIGTERM', () => IntendedShutdown('SIGTERM'));

startServer();
