/**
 * Test-specific Prisma Client setup
 * 
 * This file creates a PrismaClient instance for integration tests that works with Prisma 7.2.0.
 * It uses the adapter pattern required by Prisma 7.2.0 for standalone scripts.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Get test database URL from environment at runtime (not at module load)
// This ensures DATABASE_URL from jest.env-setup.js is available
function getConnectionString(): string {
  // Get test database URL from environment
  // Try multiple sources: direct env, .env file, or default
  let connectionString = process.env.DATABASE_URL || 
                          process.env.TEST_DATABASE_URL ||
                          'postgresql://asithalakmal@localhost:5432/zyra_fashion?schema=public';

  // Clean up connection string - remove quotes if present
  if (typeof connectionString === 'string') {
    connectionString = connectionString.replace(/^["']|["']$/g, '');
  }

  if (!connectionString || connectionString.includes('not available')) {
    console.error('DATABASE_URL:', process.env.DATABASE_URL);
    console.error('TEST_DATABASE_URL:', process.env.TEST_DATABASE_URL);
    throw new Error(`DATABASE_URL is not set or database is not available for integration tests. Got: ${connectionString}`);
  }

  return connectionString;
}

// Create connection pool and Prisma client lazily
let poolInstance: Pool | null = null;
let adapterInstance: PrismaPg | null = null;
let testPrismaInstance: PrismaClient | null = null;

/**
 * Factory function that creates and returns a test Prisma Client instance
 * Uses singleton pattern to reuse the same client across tests
 */
export function getTestPrisma(): PrismaClient {
  if (!testPrismaInstance) {
    const connectionString = getConnectionString();
    
    // Create connection pool
    poolInstance = new Pool({ 
      connectionString,
      max: 1, // Use single connection for tests to avoid connection pool issues
    });

    // Create adapter
    adapterInstance = new PrismaPg(poolInstance);

    // Create Prisma client with adapter
    testPrismaInstance = new PrismaClient({
      adapter: adapterInstance,
      log: process.env.DEBUG === 'true' ? ['query', 'error', 'warn'] : ['error'],
      errorFormat: 'pretty',
    });

    // Ensure cleanup on process exit
    let cleanupRegistered = false;
    const cleanup = async () => {
      if (testPrismaInstance) {
        await testPrismaInstance.$disconnect().catch(() => {});
      }
      if (poolInstance) {
        await poolInstance.end().catch(() => {});
      }
    };

    // Only register cleanup handlers once
    if (!cleanupRegistered) {
      cleanupRegistered = true;
      process.on('beforeExit', cleanup);
      process.on('SIGINT', async () => {
        await cleanup();
        process.exit(0);
      });
      process.on('SIGTERM', async () => {
        await cleanup();
        process.exit(0);
      });
    }
  }

  return testPrismaInstance;
}

/**
 * Verify database connection before running tests
 */
export async function verifyTestDatabaseConnection(): Promise<boolean> {
  try {
    const client = getTestPrisma();
    // Try a simple query instead of $queryRaw to avoid adapter issues
    await client.$connect();
    await client.user.count();
    return true;
  } catch (error) {
    console.error('Test database connection failed:', error);
    console.error('DATABASE_URL being used:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')); // Hide password
    return false;
  }
}

// Export as direct accessor using Proxy for backward compatibility
// But prefer using getTestPrisma() directly
export const testPrisma: PrismaClient = new Proxy({} as any, {
  get(_target, prop) {
    const client = getTestPrisma();
    return Reflect.get(client, prop);
  }
});

export default testPrisma;

