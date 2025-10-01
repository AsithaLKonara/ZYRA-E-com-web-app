#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'
import { logger } from '../lib/logger'

const prisma = new PrismaClient()

async function setupDatabase() {
  try {
    logger.info('Starting database setup...')

    // Check database connection
    await prisma.$connect()
    logger.info('Database connection established')

    // Create database if it doesn't exist (PostgreSQL)
    const dbName = process.env.DATABASE_NAME || 'neoshop_ultra'
    const dbHost = process.env.DATABASE_HOST || 'localhost'
    const dbPort = process.env.DATABASE_PORT || '5432'
    const dbUser = process.env.DATABASE_USER || 'postgres'

    logger.info(`Setting up database: ${dbName} on ${dbHost}:${dbPort}`)

    // Run migrations
    logger.info('Running database migrations...')
    const { execSync } = require('child_process')
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })
    logger.info('Database migrations completed')

    // Create indexes for performance
    logger.info('Creating database indexes...')
    await createIndexes()
    logger.info('Database indexes created')

    // Set up connection pooling
    logger.info('Configuring connection pooling...')
    await configureConnectionPooling()
    logger.info('Connection pooling configured')

    // Verify setup
    logger.info('Verifying database setup...')
    const healthCheck = await checkDatabaseHealth()
    if (healthCheck.status === 'healthy') {
      logger.info('Database setup completed successfully')
    } else {
      throw new Error('Database health check failed')
    }

  } catch (error) {
    logger.error('Database setup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function createIndexes() {
  const indexes = [
    // User indexes
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
    'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)',
    
    // Product indexes
    'CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)',
    'CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id)',
    'CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)',
    'CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock)',
    
    // Category indexes
    'CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name)',
    'CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)',
    'CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active)',
    
    // Order indexes
    'CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
    'CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status)',
    
    // Order item indexes
    'CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)',
    'CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id)',
    
    // Review indexes
    'CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id)',
    'CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating)',
    'CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at)',
    
    // Session indexes
    'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)',
    
    // Cart indexes
    'CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id)',
    
    // Wishlist indexes
    'CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON wishlist_items(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON wishlist_items(product_id)',
    
    // Audit log indexes
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)',
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)',
  ]

  for (const indexQuery of indexes) {
    try {
      await prisma.$executeRawUnsafe(indexQuery)
    } catch (error) {
      logger.warn(`Failed to create index: ${indexQuery}`, error)
    }
  }
}

async function configureConnectionPooling() {
  const poolConfig = [
    // Set connection pool size
    `ALTER SYSTEM SET max_connections = ${process.env.DATABASE_MAX_CONNECTIONS || '100'}`,
    // Set shared buffers
    `ALTER SYSTEM SET shared_buffers = '${process.env.DATABASE_SHARED_BUFFERS || '256MB'}'`,
    // Set effective cache size
    `ALTER SYSTEM SET effective_cache_size = '${process.env.DATABASE_EFFECTIVE_CACHE_SIZE || '1GB'}'`,
    // Set work memory
    `ALTER SYSTEM SET work_mem = '${process.env.DATABASE_WORK_MEM || '4MB'}'`,
    // Set maintenance work memory
    `ALTER SYSTEM SET maintenance_work_mem = '${process.env.DATABASE_MAINTENANCE_WORK_MEM || '64MB'}'`,
    // Set checkpoint completion target
    `ALTER SYSTEM SET checkpoint_completion_target = 0.9`,
    // Set WAL buffer size
    `ALTER SYSTEM SET wal_buffers = '${process.env.DATABASE_WAL_BUFFERS || '16MB'}'`,
    // Set default statistics target
    `ALTER SYSTEM SET default_statistics_target = 100`,
  ]

  for (const configQuery of poolConfig) {
    try {
      await prisma.$executeRawUnsafe(configQuery)
    } catch (error) {
      logger.warn(`Failed to apply configuration: ${configQuery}`, error)
    }
  }

  // Reload configuration
  try {
    await prisma.$executeRaw`SELECT pg_reload_conf()`
  } catch (error) {
    logger.warn('Failed to reload configuration:', error)
  }
}

async function checkDatabaseHealth() {
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        version() as version,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
        (SELECT count(*) FROM pg_stat_activity) as total_connections
    `
    
    const health = result as any[]
    logger.info('Database health check:', health[0])
    
    return {
      status: 'healthy' as const,
      version: health[0]?.version,
      activeConnections: parseInt(health[0]?.active_connections || '0'),
      totalConnections: parseInt(health[0]?.total_connections || '0'),
    }
  } catch (error) {
    logger.error('Database health check failed:', error)
    return {
      status: 'unhealthy' as const,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase()
}

export { setupDatabase, createIndexes, configureConnectionPooling, checkDatabaseHealth }




