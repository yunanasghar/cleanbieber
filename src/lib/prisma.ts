import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Configure database URL with serverless connection pooling parameters.
 * Supabase PgBouncer (port 6543) requires pgbouncer=true & connection_limit=1
 * in serverless environments to avoid client pool exhaustion.
 */
function getEffectiveDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;

  let configured = url;
  if (configured.includes('pooler.supabase.com')) {
    if (!configured.includes('connection_limit=')) {
      configured += (configured.includes('?') ? '&' : '?') + 'connection_limit=1';
    }
  }
  return configured;
}

const effectiveDbUrl = getEffectiveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: effectiveDbUrl ? { db: { url: effectiveDbUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
