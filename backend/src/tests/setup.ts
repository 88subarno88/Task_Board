import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  if (!process.env.DATABASE_URL?.includes('test')) {
    throw new Error('Error: Not connected to the test database. Aborting to save data.');
  }

  await prisma.$connect();
});

afterEach(async () => {
  try {
    const tableNames = [
      'Notification',
      'AuditLog',
      'Comment',
      'Issue',
      'Column',
      'Board',
      'ProjectMember',
      'Project',
      'RefreshToken',
      'User',
    ];

    for (const tableName of tableNames) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
    }
  } catch (error) {
    console.error('Failed to clean test database.', error);
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
