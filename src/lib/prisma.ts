import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Supabase session pooler on port 5432 is fast and reliable across serverless functions
const rawUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || '';
const effectiveDbUrl = rawUrl
  ? rawUrl.replace(':6543', ':5432').replace('?pgbouncer=true', '').replace('&pgbouncer=true', '')
  : undefined;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: effectiveDbUrl ? { db: { url: effectiveDbUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
