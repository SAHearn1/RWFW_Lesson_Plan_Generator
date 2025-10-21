// src/lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn(
    'DATABASE_URL is not set. Prisma Client will not be initialized; DB features disabled.'
  );
}

// Create once in dev, once per lambda in prod (normal)
export const prisma =
  databaseUrl
    ? globalForPrisma.prisma ??
      new PrismaClient({
        // Keep logs quiet in prod
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      })
    : undefined;

if (databaseUrl && process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
