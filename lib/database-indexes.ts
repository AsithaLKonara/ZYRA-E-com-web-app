import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import { monitoring } from './monitoring';

// Database indexes configuration
const DATABASE_INDEXES = {
  // User table indexes
  users: [
    { fields: ['email'], unique: true, name: 'idx_users_email' },
    { fields: ['emailVerified'], name: 'idx_users_email_verified' },
    { fields: ['createdAt'], name: 'idx_users_created_at' },
    { fields: ['updatedAt'], name: 'idx_users_updated_at' },
    { fields: ['role'], name: 'idx_users_role' },
    { fields: ['isActive'], name: 'idx_users_is_active' },
  ],

  // Product table indexes
  products: [
    { fields: ['name'], name: 'idx_products_name' },
    { fields: ['category'], name: 'idx_products_category' },
    { fields: ['price'], name: 'idx_products_price' },
    { fields: ['inStock'], name: 'idx_products_in_stock' },
    { fields: ['createdAt'], name: 'idx_products_created_at' },
    { fields: ['updatedAt'], name: 'idx_products_updated_at' },
    { fields: ['category', 'inStock'], name: 'idx_products_category_stock' },
    { fields: ['price', 'inStock'], name: 'idx_products_price_stock' },
  ],

  // Category table indexes
  categories: [
    { fields: ['slug'], unique: true, name: 'idx_categories_slug' },
    { fields: ['parentId'], name: 'idx_categories_parent_id' },
    { fields: ['isActive'], name: 'idx_categories_is_active' },
    { fields: ['sortOrder'], name: 'idx_categories_sort_order' },
    { fields: ['createdAt'], name: 'idx_categories_created_at' },
  ],

  // Order table indexes
  orders: [
    { fields: ['userId'], name: 'idx_orders_user_id' },
    { fields: ['status'], name: 'idx_orders_status' },
    { fields: ['createdAt'], name: 'idx_orders_created_at' },
    { fields: ['updatedAt'], name: 'idx_orders_updated_at' },
    { fields: ['userId', 'status'], name: 'idx_orders_user_status' },
    { fields: ['status', 'createdAt'], name: 'idx_orders_status_created' },
  ],

  // OrderItem table indexes
  orderItems: [
    { fields: ['orderId'], name: 'idx_order_items_order_id' },
    { fields: ['productId'], name: 'idx_order_items_product_id' },
    { fields: ['orderId', 'productId'], name: 'idx_order_items_order_product' },
  ],

  // Cart table indexes
  carts: [
    { fields: ['userId'], name: 'idx_carts_user_id' },
    { fields: ['sessionId'], name: 'idx_carts_session_id' },
    { fields: ['createdAt'], name: 'idx_carts_created_at' },
    { fields: ['updatedAt'], name: 'idx_carts_updated_at' },
  ],

  // CartItem table indexes
  cartItems: [
    { fields: ['cartId'], name: 'idx_cart_items_cart_id' },
    { fields: ['productId'], name: 'idx_cart_items_product_id' },
    { fields: ['cartId', 'productId'], name: 'idx_cart_items_cart_product' },
  ],

  // Review table indexes
  reviews: [
    { fields: ['productId'], name: 'idx_reviews_product_id' },
    { fields: ['userId'], name: 'idx_reviews_user_id' },
    { fields: ['rating'], name: 'idx_reviews_rating' },
    { fields: ['createdAt'], name: 'idx_reviews_created_at' },
    { fields: ['productId', 'rating'], name: 'idx_reviews_product_rating' },
  ],

  // Wishlist table indexes
  wishlists: [
    { fields: ['userId'], name: 'idx_wishlists_user_id' },
    { fields: ['productId'], name: 'idx_wishlists_product_id' },
    { fields: ['userId', 'productId'], name: 'idx_wishlists_user_product' },
    { fields: ['createdAt'], name: 'idx_wishlists_created_at' },
  ],
} as const;

// Database connection pooling configuration
export const DATABASE_POOL_CONFIG = {
  max: 20, // Maximum number of connections
  min: 5,  // Minimum number of connections
  acquireTimeoutMillis: 30000, // 30 seconds
  createTimeoutMillis: 30000,  // 30 seconds
  destroyTimeoutMillis: 5000,  // 5 seconds
  idleTimeoutMillis: 30000,    // 30 seconds
  reapIntervalMillis: 1000,    // 1 second
  createRetryIntervalMillis: 200, // 200ms
} as const;

// Database performance monitoring
export class DatabasePerformanceMonitor {
  private queryTimes: number[] = [];
  private errorCount = 0;
  private successCount = 0;

  recordQuery(duration: number, success: boolean = true): void {
    this.queryTimes.push(duration);
    if (success) {
      this.successCount++;
    } else {
      this.errorCount++;
    }

    // Keep only last 1000 query times
    if (this.queryTimes.length > 1000) {
      this.queryTimes = this.queryTimes.slice(-1000);
    }

    // Record metrics
    monitoring.recordTimer('database.query.duration', duration);
    monitoring.recordCounter(success ? 'database.query.success' : 'database.query.error', 1);
  }

  getStats(): {
    averageQueryTime: number;
    totalQueries: number;
    successRate: number;
    errorRate: number;
  } {
    const totalQueries = this.successCount + this.errorCount;
    const averageQueryTime = this.queryTimes.length > 0 
      ? this.queryTimes.reduce((sum, time) => sum + time, 0) / this.queryTimes.length 
      : 0;

    return {
      averageQueryTime: Math.round(averageQueryTime * 100) / 100,
      totalQueries,
      successRate: totalQueries > 0 ? (this.successCount / totalQueries) * 100 : 0,
      errorRate: totalQueries > 0 ? (this.errorCount / totalQueries) * 100 : 0,
    };
  }
}

// Create performance monitor instance
export const dbPerformanceMonitor = new DatabasePerformanceMonitor();

// Database connection with pooling
export class DatabaseConnection {
  private prisma: PrismaClient;
  private isConnected = false;

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'info', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
    });

    // Set up query logging
    this.prisma.$on('query', (e) => {
      const duration = e.duration;
      dbPerformanceMonitor.recordQuery(duration, true);
      
      logger.debug('Database query executed', {
        query: e.query,
        params: e.params,
        duration: `${duration}ms`,
        target: e.target,
      });
    });

    this.prisma.$on('error', (e) => {
      dbPerformanceMonitor.recordQuery(0, false);
      
      logger.error('Database error', {
        message: e.message,
        target: e.target,
      });
    });
  }

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.isConnected = true;
      
      logger.info('Database connected successfully');
      monitoring.recordCounter('database.connection.success', 1);
    } catch (error) {
      logger.error('Database connection failed', {
        error: error.message,
        stack: error.stack,
      });
      
      monitoring.recordCounter('database.connection.error', 1);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      
      logger.info('Database disconnected successfully');
      monitoring.recordCounter('database.disconnection.success', 1);
    } catch (error) {
      logger.error('Database disconnection failed', {
        error: error.message,
        stack: error.stack,
      });
      
      monitoring.recordCounter('database.disconnection.error', 1);
      throw error;
    }
  }

  getClient(): PrismaClient {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }
    return this.prisma;
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;
      
      return {
        healthy: true,
        latency,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      
      return {
        healthy: false,
        latency,
        error: error.message,
      };
    }
  }
}

// Create database connection instance
export const dbConnection = new DatabaseConnection();

// Database optimization utilities
export class DatabaseOptimizer {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Create indexes for a table
  async createIndexes(tableName: string): Promise<void> {
    const indexes = DATABASE_INDEXES[tableName as keyof typeof DATABASE_INDEXES];
    
    if (!indexes) {
      logger.warn(`No indexes defined for table: ${tableName}`);
      return;
    }

    for (const index of indexes) {
      try {
        const indexName = index.name;
        const fields = index.fields.join(', ');
        const unique = index.unique ? 'UNIQUE' : '';
        
        const sql = `CREATE ${unique} INDEX IF NOT EXISTS ${indexName} ON ${tableName} (${fields})`;
        
        await this.prisma.$executeRawUnsafe(sql);
        
        logger.info(`Index created: ${indexName} on ${tableName}`, {
          table: tableName,
          index: indexName,
          fields: index.fields,
          unique: index.unique,
        });
        
        monitoring.recordCounter('database.index.created', 1, {
          table: tableName,
          index: indexName,
        });
      } catch (error) {
        logger.error(`Failed to create index: ${index.name}`, {
          table: tableName,
          index: index.name,
          error: error.message,
        });
        
        monitoring.recordCounter('database.index.error', 1, {
          table: tableName,
          index: index.name,
        });
      }
    }
  }

  // Create all indexes
  async createAllIndexes(): Promise<void> {
    const tables = Object.keys(DATABASE_INDEXES);
    
    logger.info('Creating database indexes', {
      tables: tables.length,
    });

    for (const table of tables) {
      await this.createIndexes(table);
    }

    logger.info('All database indexes created successfully');
  }

  // Analyze table performance
  async analyzeTable(tableName: string): Promise<{
    rowCount: number;
    tableSize: string;
    indexSize: string;
    lastAnalyzed: Date;
  }> {
    try {
      const result = await this.prisma.$queryRawUnsafe(`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation,
          most_common_vals,
          most_common_freqs,
          histogram_bounds
        FROM pg_stats 
        WHERE tablename = '${tableName}'
        ORDER BY attname;
      `);

      const rowCountResult = await this.prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count FROM ${tableName};
      `);

      const sizeResult = await this.prisma.$queryRawUnsafe(`
        SELECT 
          pg_size_pretty(pg_total_relation_size('${tableName}')) as total_size,
          pg_size_pretty(pg_relation_size('${tableName}')) as table_size,
          pg_size_pretty(pg_total_relation_size('${tableName}') - pg_relation_size('${tableName}')) as index_size;
      `);

      return {
        rowCount: (rowCountResult as any)[0].count,
        tableSize: (sizeResult as any)[0].table_size,
        indexSize: (sizeResult as any)[0].index_size,
        lastAnalyzed: new Date(),
      };
    } catch (error) {
      logger.error(`Failed to analyze table: ${tableName}`, {
        error: error.message,
      });
      throw error;
    }
  }

  // Optimize database
  async optimize(): Promise<void> {
    try {
      logger.info('Starting database optimization');

      // Create all indexes
      await this.createAllIndexes();

      // Analyze all tables
      const tables = Object.keys(DATABASE_INDEXES);
      for (const table of tables) {
        const analysis = await this.analyzeTable(table);
        logger.info(`Table analysis: ${table}`, analysis);
      }

      // Update table statistics
      await this.prisma.$executeRaw`ANALYZE`;

      logger.info('Database optimization completed successfully');
      monitoring.recordCounter('database.optimization.success', 1);
    } catch (error) {
      logger.error('Database optimization failed', {
        error: error.message,
        stack: error.stack,
      });
      
      monitoring.recordCounter('database.optimization.error', 1);
      throw error;
    }
  }
}

// Export database connection and utilities
export { PrismaClient };
export default dbConnection;




