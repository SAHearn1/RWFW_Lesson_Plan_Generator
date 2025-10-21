// File: src/lib/db.ts

import { PrismaClient } from '@prisma/client';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn(
    'DATABASE_URL environment variable is not set. Prisma Client will not be initialised and any database features will be disabled.',
  );
}

// Prevent creating a new Prisma Client on every hot reload in development while also
// avoiding instantiation when the DATABASE_URL is not configured (such as in preview demos).
const prismaClient = databaseUrl
  ? global.prisma ||
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  : undefined;

if (databaseUrl && process.env.NODE_ENV !== 'production' && prismaClient) {
  global.prisma = prismaClient;
}

export const prisma = prismaClient;
