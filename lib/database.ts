import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { logger } from './logger'

// Database connection configuration
const databaseConfig = {
  // Connection pool settings
  connectionLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '10'),
  acquireTimeoutMillis: parseInt(process.env.DATABASE_ACQUIRE_TIMEOUT || '60000'),
  idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000'),
  // Query timeout
  queryTimeout: parseInt(process.env.DATABASE_QUERY_TIMEOUT || '30000'),
  // Transaction timeout
  transactionTimeout: parseInt(process.env.DATABASE_TRANSACTION_TIMEOUT || '60000'),
}

// Create Prisma client with production optimizations
// Uses adapter pattern for Prisma 7.2.0 compatibility
const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL
  
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  // Create connection pool
  const pool = new Pool({
    connectionString,
    max: databaseConfig.connectionLimit,
    idleTimeoutMillis: databaseConfig.idleTimeoutMillis,
  })

  // Create adapter
  const adapter = new PrismaPg(pool)

  // Create Prisma client with adapter (required for Prisma 7.2.0)
  const client = new PrismaClient({
    adapter,
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'info', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
    errorFormat: 'pretty',
  })

  // Query logging for performance monitoring
  client.$on('query', (e) => {
    if (e.duration > 1000) {
      logger.warn(`Slow query detected: ${e.duration}ms`, {
        query: e.query,
        params: e.params,
        duration: e.duration,
      })
    }
  })

  return client
}

// Global Prisma client instance
let prisma: PrismaClient

declare global {
  var __prisma: PrismaClient | undefined
}

// Use global variable in development to prevent multiple instances
if (process.env.NODE_ENV === 'production') {
  prisma = createPrismaClient()
} else {
  if (!global.__prisma) {
    global.__prisma = createPrismaClient()
  }
  prisma = global.__prisma
}

// Database health check
export const checkDatabaseHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy'
  details: {
    connected: boolean
    responseTime: number
    version: string
    connections: number
  }
}> => {
  const startTime = Date.now()
  
  try {
    // Test database connection
    const result = await prisma.$queryRaw`SELECT version() as version, 
      (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections`
    
    const responseTime = Date.now() - startTime
    const version = (result as any)[0]?.version || 'Unknown'
    const connections = (result as any)[0]?.active_connections || 0

    return {
      status: 'healthy',
      details: {
        connected: true,
        responseTime,
        version,
        connections: parseInt(connections),
      },
    }
  } catch (error) {
    logger.error('Database health check failed', {}, error instanceof Error ? error : new Error(String(error)))
    return {
      status: 'unhealthy',
      details: {
        connected: false,
        responseTime: Date.now() - startTime,
        version: 'Unknown',
        connections: 0,
      },
    }
  }
}

// Database connection pool monitoring
export const getConnectionPoolStats = async () => {
  try {
    const stats = await prisma.$queryRaw`
      SELECT 
        state,
        count(*) as count
      FROM pg_stat_activity 
      WHERE datname = current_database()
      GROUP BY state
    `
    return stats
  } catch (error) {
    logger.error('Failed to get connection pool stats', {}, error instanceof Error ? error : new Error(String(error)))
    return []
  }
}

// Database performance monitoring
export const getDatabasePerformance = async () => {
  try {
    const performance = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples
      FROM pg_stat_user_tables 
      ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC
      LIMIT 10
    `
    return performance
  } catch (error) {
    logger.error('Failed to get database performance stats', {}, error instanceof Error ? error : new Error(String(error)))
    return []
  }
}

// Database maintenance functions
export const performDatabaseMaintenance = async () => {
  try {
    logger.info('Starting database maintenance...')
    
    // Analyze tables for query optimization
    await prisma.$executeRaw`ANALYZE`
    
    // Update table statistics
    await prisma.$executeRaw`UPDATE pg_stat_user_tables SET n_tup_ins = 0, n_tup_upd = 0, n_tup_del = 0`
    
    // Clean up old sessions
    const deletedSessions = await prisma.session.deleteMany({
      where: {
        expires: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        }
      }
    })
    
    logger.info(`Database maintenance completed. Deleted ${deletedSessions.count} old sessions.`)
    
    return {
      success: true,
      deletedSessions: deletedSessions.count,
    }
  } catch (error) {
    logger.error('Database maintenance failed', {}, error instanceof Error ? error : new Error(String(error)))
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Graceful shutdown
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect()
    logger.info('Database connection closed gracefully')
  } catch (error) {
    logger.error('Error closing database connection', {}, error instanceof Error ? error : new Error(String(error)))
  }
}

// Export the Prisma client
export { prisma as db }

// Export database configuration
export { databaseConfig }


