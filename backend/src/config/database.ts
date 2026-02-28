import { PrismaClient } from '@prisma/client';
import config from './env';
import logger from '../utils/logger';

const prisma = new PrismaClient({
  log: config.nodeEnv === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

prisma
  .$connect()
  .then(() => {
    logger.info(' Successfully connected to the PostgreSQL database');
  })
  .catch((err: unknown) => {
    if (err instanceof Error) {
      logger.error(`Database connection failed: ${err.message}`);
    } else {
      logger.error('Database connection failed with an unknown error');
    }
    process.exit(1);
  });

// clean up
process.on('beforeExit', async () => {
  logger.info('Closing database connection ...');
  await prisma.$disconnect();
});

export default prisma;
