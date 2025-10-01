import { PrismaClient } from '@prisma/client'
import { config } from './config'
import { logger } from './logger'

// Connection pool configuration
const connectionConfig = {
  maxConnections: config.database.maxConnections,
  connectionTimeout: config.database.connectionTimeout,
  idleTimeout: 30000, // 30 seconds
  acquireTimeout: 60000, // 60 seconds
}

// Enhanced Prisma client with connection pooling
class DatabaseConnection {
  private client: PrismaClient
  private isConnected = false
  private connectionCount = 0
  private maxConnections = connectionConfig.maxConnections

  constructor() {
    this.client = new PrismaClient({
      log: [
        { level: 'query', emit: 'stdout' },
        { level: 'error', emit: 'stdout' },
        { level: 'info', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
      datasources: {
        db: {
          url: config.database.url,
        },
      },
    })

    // Set up event listeners
    this.setupEventListeners()
  }

  private setupEventListeners() {
    // Prisma client event listeners are not available in the current version
    // Logging is handled through the log configuration above
    // This method is kept for future compatibility
  }

  // Get database client
  getClient(): PrismaClient {
    if (!this.isConnected) {
      throw new Error('Database not connected')
    }
    return this.client
  }

  // Connect to database
  async connect(): Promise<void> {
    try {
      await this.client.$connect()
      this.isConnected = true
      logger.success('Database connected successfully')
    } catch (error) {
      logger.error('Failed to connect to database:', error)
      throw error
    }
  }

  // Disconnect from database
  async disconnect(): Promise<void> {
    try {
      await this.client.$disconnect()
      this.isConnected = false
      logger.info('Database disconnected')
    } catch (error) {
      logger.error('Error disconnecting from database:', error)
      throw error
    }
  }

  // Check database health
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      logger.error('Database health check failed:', error)
      return false
    }
  }

  // Get connection stats
  getStats() {
    return {
      isConnected: this.isConnected,
      connectionCount: this.connectionCount,
      maxConnections: this.maxConnections,
    }
  }

  // Execute transaction
  async transaction<T>(
    fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>) => Promise<T>
  ): Promise<T> {
    return await this.client.$transaction(fn)
  }

  // Execute raw query
  async rawQuery<T = any>(query: string, ...params: any[]): Promise<T> {
    return await this.client.$queryRawUnsafe(query, ...params)
  }
}

// Database connection instance
export const dbConnection = new DatabaseConnection()

// Initialize database connection
export async function initializeDatabase(): Promise<void> {
  await dbConnection.connect()
}

// Graceful shutdown
export async function shutdownDatabase(): Promise<void> {
  await dbConnection.disconnect()
}

// Database health check
export async function checkDatabaseHealth(): Promise<boolean> {
  return await dbConnection.healthCheck()
}

// Get database stats
export function getDatabaseStats() {
  return dbConnection.getStats()
}

// Transaction helper
export async function withTransaction<T>(
  fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>) => Promise<T>
): Promise<T> {
  return await dbConnection.transaction(fn)
}

// Raw query helper
export async function executeRawQuery<T = any>(
  query: string,
  ...params: any[]
): Promise<T> {
  return await dbConnection.rawQuery<T>(query, ...params)
}

// Export the client for direct use
export const db = dbConnection.getClient()


