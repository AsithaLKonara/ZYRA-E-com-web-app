import { db } from './db-connection'
import { logger } from './logger'

// Database monitoring metrics
interface DatabaseMetrics {
  connectionCount: number
  activeQueries: number
  slowQueries: number
  errorCount: number
  averageQueryTime: number
  totalQueries: number
  lastUpdated: Date
}

// Query performance tracking
interface QueryPerformance {
  query: string
  duration: number
  timestamp: Date
  isSlow: boolean
}

// Database monitoring class
class DatabaseMonitoring {
  private metrics: DatabaseMetrics = {
    connectionCount: 0,
    activeQueries: 0,
    slowQueries: 0,
    errorCount: 0,
    averageQueryTime: 0,
    totalQueries: 0,
    lastUpdated: new Date(),
  }

  private queryPerformance: QueryPerformance[] = []
  private maxQueryHistory = 1000
  private slowQueryThreshold = 1000 // 1 second

  // Track query performance
  trackQuery(query: string, duration: number): void {
    const isSlow = duration > this.slowQueryThreshold
    const performance: QueryPerformance = {
      query,
      duration,
      timestamp: new Date(),
      isSlow,
    }

    this.queryPerformance.push(performance)
    
    // Keep only recent queries
    if (this.queryPerformance.length > this.maxQueryHistory) {
      this.queryPerformance.shift()
    }

    // Update metrics
    this.metrics.totalQueries++
    this.metrics.averageQueryTime = 
      this.queryPerformance.reduce((sum, q) => sum + q.duration, 0) / this.queryPerformance.length

    if (isSlow) {
      this.metrics.slowQueries++
      logger.warn(`Slow query detected: ${duration}ms`, { query, duration })
    }

    this.metrics.lastUpdated = new Date()
  }

  // Track error
  trackError(error: any): void {
    this.metrics.errorCount++
    logger.error('Database error tracked:', {}, error instanceof Error ? error : new Error(String(error)))
  }

  // Get current metrics
  getMetrics(): DatabaseMetrics {
    return { ...this.metrics }
  }

  // Get query performance history
  getQueryPerformance(): QueryPerformance[] {
    return [...this.queryPerformance]
  }

  // Get slow queries
  getSlowQueries(): QueryPerformance[] {
    return this.queryPerformance.filter(q => q.isSlow)
  }

  // Get top slow queries
  getTopSlowQueries(limit: number = 10): QueryPerformance[] {
    return this.queryPerformance
      .filter(q => q.isSlow)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
  }

  // Get query statistics
  getQueryStats() {
    const totalQueries = this.queryPerformance.length
    const slowQueries = this.queryPerformance.filter(q => q.isSlow).length
    const averageDuration = totalQueries > 0 
      ? this.queryPerformance.reduce((sum, q) => sum + q.duration, 0) / totalQueries 
      : 0

    return {
      totalQueries,
      slowQueries,
      averageDuration,
      slowQueryPercentage: totalQueries > 0 ? (slowQueries / totalQueries) * 100 : 0,
    }
  }

  // Check database health
  async checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    issues: string[]
    metrics: DatabaseMetrics
  }> {
    const issues: string[] = []
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

    try {
      // Test database connection
      await db.$queryRaw`SELECT 1`
    } catch (error) {
      issues.push('Database connection failed')
      status = 'unhealthy'
    }

    // Check for slow queries
    const slowQueryPercentage = this.getQueryStats().slowQueryPercentage
    if (slowQueryPercentage > 20) {
      issues.push(`High percentage of slow queries: ${slowQueryPercentage.toFixed(2)}%`)
      status = status === 'unhealthy' ? 'unhealthy' : 'degraded'
    }

    // Check for errors
    if (this.metrics.errorCount > 10) {
      issues.push(`High error count: ${this.metrics.errorCount}`)
      status = status === 'unhealthy' ? 'unhealthy' : 'degraded'
    }

    // Check average query time
    if (this.metrics.averageQueryTime > 500) {
      issues.push(`High average query time: ${this.metrics.averageQueryTime.toFixed(2)}ms`)
      status = status === 'unhealthy' ? 'unhealthy' : 'degraded'
    }

    return {
      status,
      issues,
      metrics: this.getMetrics(),
    }
  }

  // Get database size
  async getDatabaseSize(): Promise<{
    totalSize: number
    tableSizes: { table: string; size: number }[]
  }> {
    try {
      const result = await db.$queryRaw<{ table_name: string; size: number }[]>`
        SELECT 
          schemaname,
          tablename as table_name,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `

      const tableSizes = result.map((row: any) => ({
        table: row.table_name,
        size: typeof row.size === 'string' ? parseInt(row.size.replace(/\D/g, '')) || 0 : Number(row.size) || 0,
      }))

      const totalSize = tableSizes.reduce((sum, table) => sum + table.size, 0)

      return {
        totalSize,
        tableSizes,
      }
    } catch (error) {
      logger.error('Failed to get database size:', {}, error instanceof Error ? error : new Error(String(error)))
      return {
        totalSize: 0,
        tableSizes: [],
      }
    }
  }

  // Get table statistics
  async getTableStats(): Promise<{
    table: string
    rowCount: number
    size: number
  }[]> {
    try {
      const result = await db.$queryRaw<{ table_name: string; row_count: number; size: number }[]>`
        SELECT 
          schemaname,
          tablename as table_name,
          n_tup_ins - n_tup_del as row_count,
          pg_total_relation_size(schemaname||'.'||tablename) as size
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `

      return result.map(row => ({
        table: row.table_name,
        rowCount: row.row_count,
        size: row.size,
      }))
    } catch (error) {
      logger.error('Failed to get table statistics:', {}, error instanceof Error ? error : new Error(String(error)))
      return []
    }
  }

  // Reset metrics
  resetMetrics(): void {
    this.metrics = {
      connectionCount: 0,
      activeQueries: 0,
      slowQueries: 0,
      errorCount: 0,
      averageQueryTime: 0,
      totalQueries: 0,
      lastUpdated: new Date(),
    }
    this.queryPerformance = []
  }
}

// Database monitoring instance
export const dbMonitoring = new DatabaseMonitoring()

// Export monitoring functions
export const monitoringUtils = {
  trackQuery: (query: string, duration: number) => dbMonitoring.trackQuery(query, duration),
  trackError: (error: any) => dbMonitoring.trackError(error),
  getMetrics: () => dbMonitoring.getMetrics(),
  getQueryPerformance: () => dbMonitoring.getQueryPerformance(),
  getSlowQueries: () => dbMonitoring.getSlowQueries(),
  getTopSlowQueries: (limit?: number) => dbMonitoring.getTopSlowQueries(limit),
  getQueryStats: () => dbMonitoring.getQueryStats(),
  checkHealth: () => dbMonitoring.checkHealth(),
  getDatabaseSize: () => dbMonitoring.getDatabaseSize(),
  getTableStats: () => dbMonitoring.getTableStats(),
  resetMetrics: () => dbMonitoring.resetMetrics(),
}


