import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import { monitoring } from './monitoring';

// Database monitoring configuration
const DB_MONITORING_CONFIG = {
  // Health check intervals
  healthCheckInterval: 30000, // 30 seconds
  performanceCheckInterval: 60000, // 1 minute
  
  // Performance thresholds
  thresholds: {
    queryTime: 1000, // 1 second
    connectionTime: 5000, // 5 seconds
    memoryUsage: 0.8, // 80%
    cpuUsage: 0.8, // 80%
    diskUsage: 0.9, // 90%
  },
  
  // Alert configuration
  alerts: {
    enabled: true,
    email: process.env.ALERT_EMAIL,
    webhook: process.env.ALERT_WEBHOOK,
  },
} as const;

// Database health status
export enum DatabaseHealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

// Database metrics interface
interface DatabaseMetrics {
  // Connection metrics
  activeConnections: number;
  maxConnections: number;
  connectionUtilization: number;
  
  // Performance metrics
  averageQueryTime: number;
  slowQueries: number;
  totalQueries: number;
  queryThroughput: number;
  
  // Resource metrics
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  
  // Database size
  databaseSize: number;
  tableSizes: { table: string; size: number }[];
  
  // Index metrics
  indexUsage: { index: string; usage: number }[];
  unusedIndexes: string[];
  
  // Lock metrics
  activeLocks: number;
  lockWaitTime: number;
  
  // Replication metrics (if applicable)
  replicationLag: number;
  replicationStatus: string;
  
  // Timestamp
  timestamp: Date;
}

// Database monitoring class
export class DatabaseMonitor {
  private prisma: PrismaClient;
  private isMonitoring = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private performanceCheckInterval: NodeJS.Timeout | null = null;
  private metrics: DatabaseMetrics[] = [];
  private maxMetricsHistory = 1000;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Start monitoring
  start(): void {
    if (this.isMonitoring) {
      logger.warn('Database monitoring already started');
      return;
    }

    this.isMonitoring = true;
    
    // Start health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck().catch(error => {
        logger.error('Health check failed', {}, error instanceof Error ? error : new Error(String(error)));
      });
    }, DB_MONITORING_CONFIG.healthCheckInterval);

    // Start performance checks
    this.performanceCheckInterval = setInterval(() => {
      this.collectPerformanceMetrics().catch(error => {
        logger.error('Performance check failed', {}, error instanceof Error ? error : new Error(String(error)));
      });
    }, DB_MONITORING_CONFIG.performanceCheckInterval);

    logger.info('Database monitoring started', {
      healthCheckInterval: DB_MONITORING_CONFIG.healthCheckInterval,
      performanceCheckInterval: DB_MONITORING_CONFIG.performanceCheckInterval,
    });
  }

  // Stop monitoring
  stop(): void {
    if (!this.isMonitoring) {
      logger.warn('Database monitoring not started');
      return;
    }

    this.isMonitoring = false;

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.performanceCheckInterval) {
      clearInterval(this.performanceCheckInterval);
      this.performanceCheckInterval = null;
    }

    logger.info('Database monitoring stopped');
  }

  // Perform health check
  async performHealthCheck(): Promise<DatabaseHealthStatus> {
    const startTime = Date.now();
    
    try {
      // Test basic connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      
      // Get connection info
      const connectionInfo = await this.getConnectionInfo();
      
      // Check if connections are within limits
      const connectionUtilization = connectionInfo.activeConnections / connectionInfo.maxConnections;
      
      let status: DatabaseHealthStatus = DatabaseHealthStatus.HEALTHY;
      
      // Check thresholds
      if (connectionUtilization > DB_MONITORING_CONFIG.thresholds.memoryUsage) {
        status = DatabaseHealthStatus.DEGRADED;
        logger.warn('High connection utilization detected', {
          activeConnections: connectionInfo.activeConnections,
          maxConnections: connectionInfo.maxConnections,
          utilization: connectionUtilization,
        });
      }

      // Record health check metric
      monitoring.recordCounter('database.health.check', 1, {
        status,
        duration: String(Date.now() - startTime),
      });

      logger.debug('Database health check completed', {
        status,
        duration: Date.now() - startTime,
        connections: connectionInfo.activeConnections,
      });

      return status;

    } catch (error) {
      logger.error('Database health check failed', {
        duration: Date.now() - startTime,
      }, error instanceof Error ? error : new Error(String(error)));

      monitoring.recordCounter('database.health.error', 1);
      return DatabaseHealthStatus.UNHEALTHY;
    }
  }

  // Collect performance metrics
  async collectPerformanceMetrics(): Promise<DatabaseMetrics> {
    const startTime = Date.now();
    
    try {
      // Get connection metrics
      const connectionInfo = await this.getConnectionInfo();
      
      // Get performance metrics
      const performanceInfo = await this.getPerformanceInfo();
      
      // Get resource metrics
      const resourceInfo = await this.getResourceInfo();
      
      // Get database size info
      const sizeInfo = await this.getSizeInfo();
      
      // Get index metrics
      const indexInfo = await this.getIndexInfo();
      
      // Get lock metrics
      const lockInfo = await this.getLockInfo();
      
      // Get replication info (if applicable)
      const replicationInfo = await this.getReplicationInfo();
      
      const metrics: DatabaseMetrics = {
        // Connection metrics
        activeConnections: connectionInfo.activeConnections,
        maxConnections: connectionInfo.maxConnections,
        connectionUtilization: connectionInfo.activeConnections / connectionInfo.maxConnections,
        
        // Performance metrics
        averageQueryTime: performanceInfo.averageQueryTime,
        slowQueries: performanceInfo.slowQueries,
        totalQueries: performanceInfo.totalQueries,
        queryThroughput: performanceInfo.queryThroughput,
        
        // Resource metrics
        memoryUsage: resourceInfo.memoryUsage,
        cpuUsage: resourceInfo.cpuUsage,
        diskUsage: resourceInfo.diskUsage,
        
        // Database size
        databaseSize: sizeInfo.databaseSize,
        tableSizes: sizeInfo.tableSizes,
        
        // Index metrics
        indexUsage: indexInfo.indexUsage,
        unusedIndexes: indexInfo.unusedIndexes,
        
        // Lock metrics
        activeLocks: lockInfo.activeLocks,
        lockWaitTime: lockInfo.lockWaitTime,
        
        // Replication metrics
        replicationLag: replicationInfo.replicationLag,
        replicationStatus: replicationInfo.replicationStatus,
        
        // Timestamp
        timestamp: new Date(),
      };

      // Store metrics
      this.metrics.push(metrics);
      
      // Keep only recent metrics
      if (this.metrics.length > this.maxMetricsHistory) {
        this.metrics = this.metrics.slice(-this.maxMetricsHistory);
      }

      // Record performance metrics
      monitoring.recordGauge('database.connections.active', metrics.activeConnections);
      monitoring.recordGauge('database.connections.utilization', metrics.connectionUtilization);
      monitoring.recordGauge('database.query.average_time', metrics.averageQueryTime);
      monitoring.recordGauge('database.query.throughput', metrics.queryThroughput);
      monitoring.recordGauge('database.memory.usage', metrics.memoryUsage);
      monitoring.recordGauge('database.cpu.usage', metrics.cpuUsage);
      monitoring.recordGauge('database.disk.usage', metrics.diskUsage);
      monitoring.recordGauge('database.size', metrics.databaseSize);

      // Check for alerts
      await this.checkAlerts(metrics);

      logger.debug('Database performance metrics collected', {
        duration: Date.now() - startTime,
        activeConnections: metrics.activeConnections,
        averageQueryTime: metrics.averageQueryTime,
        memoryUsage: metrics.memoryUsage,
      });

      return metrics;

    } catch (error) {
      logger.error('Failed to collect performance metrics', {
        duration: Date.now() - startTime,
      }, error instanceof Error ? error : new Error(String(error)));

      monitoring.recordCounter('database.metrics.error', 1);
      throw error;
    }
  }

  // Get connection information
  private async getConnectionInfo(): Promise<{
    activeConnections: number;
    maxConnections: number;
  }> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections;
      `;
      
      const data = result as any[];
      return {
        activeConnections: data[0].active_connections,
        maxConnections: data[0].max_connections,
      };
    } catch (error) {
      logger.error('Failed to get connection info', {}, error instanceof Error ? error : new Error(String(error)));
      return { activeConnections: 0, maxConnections: 100 };
    }
  }

  // Get performance information
  private async getPerformanceInfo(): Promise<{
    averageQueryTime: number;
    slowQueries: number;
    totalQueries: number;
    queryThroughput: number;
  }> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          AVG(mean_exec_time) as avg_query_time,
          COUNT(*) as total_queries,
          COUNT(*) FILTER (WHERE mean_exec_time > ${DB_MONITORING_CONFIG.thresholds.queryTime}) as slow_queries
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%';
      `;
      
      const data = result as any[];
      const avgQueryTime = data[0].avg_query_time || 0;
      const totalQueries = data[0].total_queries || 0;
      const slowQueries = data[0].slow_queries || 0;
      
      return {
        averageQueryTime: Math.round(avgQueryTime * 100) / 100,
        slowQueries,
        totalQueries,
        queryThroughput: totalQueries / 60, // queries per minute
      };
    } catch (error) {
      logger.error('Failed to get performance info', {}, error instanceof Error ? error : new Error(String(error)));
      return {
        averageQueryTime: 0,
        slowQueries: 0,
        totalQueries: 0,
        queryThroughput: 0,
      };
    }
  }

  // Get resource information
  private async getResourceInfo(): Promise<{
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
  }> {
    try {
      // Get memory usage
      const memoryResult = await this.prisma.$queryRaw`
        SELECT 
          (SELECT setting::bigint FROM pg_settings WHERE name = 'shared_buffers') as shared_buffers,
          (SELECT setting::bigint FROM pg_settings WHERE name = 'effective_cache_size') as effective_cache_size;
      `;
      
      // Get disk usage
      const diskResult = await this.prisma.$queryRaw`
        SELECT 
          pg_database_size(current_database()) as database_size,
          pg_total_relation_size('pg_database') as total_size;
      `;
      
      const memoryData = memoryResult as any[];
      const diskData = diskResult as any[];
      
      // Calculate approximate memory usage (simplified)
      const memoryUsage = 0.5; // This would be calculated from actual memory usage
      const cpuUsage = 0.3; // This would be calculated from actual CPU usage
      const diskUsage = (diskData[0].database_size / diskData[0].total_size) || 0;
      
      return {
        memoryUsage,
        cpuUsage,
        diskUsage,
      };
    } catch (error) {
      logger.error('Failed to get resource info', {}, error instanceof Error ? error : new Error(String(error)));
      return {
        memoryUsage: 0,
        cpuUsage: 0,
        diskUsage: 0,
      };
    }
  }

  // Get size information
  private async getSizeInfo(): Promise<{
    databaseSize: number;
    tableSizes: { table: string; size: number }[];
  }> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename as table,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
      `;
      
      const data = result as any[];
      const tableSizes = data.map(row => ({
        table: row.table,
        size: row.size_bytes,
      }));
      
      const databaseSize = tableSizes.reduce((sum, table) => sum + table.size, 0);
      
      return {
        databaseSize,
        tableSizes,
      };
    } catch (error) {
      logger.error('Failed to get size info', {}, error instanceof Error ? error : new Error(String(error)));
      return {
        databaseSize: 0,
        tableSizes: [],
      };
    }
  }

  // Get index information
  private async getIndexInfo(): Promise<{
    indexUsage: { index: string; usage: number }[];
    unusedIndexes: string[];
  }> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          indexrelname as index_name,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        ORDER BY idx_tup_read DESC;
      `;
      
      const data = result as any[];
      const indexUsage = data.map(row => ({
        index: row.index_name,
        usage: row.idx_tup_read || 0,
      }));
      
      const unusedIndexes = data
        .filter(row => (row.idx_tup_read || 0) === 0)
        .map(row => row.index_name);
      
      return {
        indexUsage,
        unusedIndexes,
      };
    } catch (error) {
      logger.error('Failed to get index info', {}, error instanceof Error ? error : new Error(String(error)));
      return {
        indexUsage: [],
        unusedIndexes: [],
      };
    }
  }

  // Get lock information
  private async getLockInfo(): Promise<{
    activeLocks: number;
    lockWaitTime: number;
  }> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          COUNT(*) as active_locks,
          AVG(EXTRACT(EPOCH FROM (now() - query_start))) as avg_wait_time
        FROM pg_locks l
        JOIN pg_stat_activity a ON l.pid = a.pid
        WHERE NOT l.granted;
      `;
      
      const data = result as any[];
      return {
        activeLocks: data[0].active_locks || 0,
        lockWaitTime: data[0].avg_wait_time || 0,
      };
    } catch (error) {
      logger.error('Failed to get lock info', {}, error instanceof Error ? error : new Error(String(error)));
      return {
        activeLocks: 0,
        lockWaitTime: 0,
      };
    }
  }

  // Get replication information
  private async getReplicationInfo(): Promise<{
    replicationLag: number;
    replicationStatus: string;
  }> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN pg_is_in_recovery() THEN 'replica'
            ELSE 'primary'
          END as status,
          CASE 
            WHEN pg_is_in_recovery() THEN 
              EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))
            ELSE 0
          END as lag_seconds;
      `;
      
      const data = result as any[];
      return {
        replicationLag: data[0].lag_seconds || 0,
        replicationStatus: data[0].status || 'unknown',
      };
    } catch (error) {
      logger.error('Failed to get replication info', {}, error instanceof Error ? error : new Error(String(error)));
      return {
        replicationLag: 0,
        replicationStatus: 'unknown',
      };
    }
  }

  // Check for alerts
  private async checkAlerts(metrics: DatabaseMetrics): Promise<void> {
    if (!DB_MONITORING_CONFIG.alerts.enabled) {
      return;
    }

    const alerts: string[] = [];

    // Check connection utilization
    if (metrics.connectionUtilization > DB_MONITORING_CONFIG.thresholds.memoryUsage) {
      alerts.push(`High connection utilization: ${(metrics.connectionUtilization * 100).toFixed(1)}%`);
    }

    // Check query performance
    if (metrics.averageQueryTime > DB_MONITORING_CONFIG.thresholds.queryTime) {
      alerts.push(`Slow queries detected: ${metrics.averageQueryTime}ms average`);
    }

    // Check resource usage
    if (metrics.memoryUsage > DB_MONITORING_CONFIG.thresholds.memoryUsage) {
      alerts.push(`High memory usage: ${(metrics.memoryUsage * 100).toFixed(1)}%`);
    }

    if (metrics.cpuUsage > DB_MONITORING_CONFIG.thresholds.cpuUsage) {
      alerts.push(`High CPU usage: ${(metrics.cpuUsage * 100).toFixed(1)}%`);
    }

    if (metrics.diskUsage > DB_MONITORING_CONFIG.thresholds.diskUsage) {
      alerts.push(`High disk usage: ${(metrics.diskUsage * 100).toFixed(1)}%`);
    }

    // Send alerts if any
    if (alerts.length > 0) {
      await this.sendAlert(alerts, metrics);
    }
  }

  // Send alert
  private async sendAlert(alerts: string[], metrics: DatabaseMetrics): Promise<void> {
    try {
      const message = `Database Alert - ${new Date().toISOString()}\n\n${alerts.join('\n')}`;
      
      logger.warn('Database alert triggered', {
        alerts,
        metrics: {
          connections: metrics.activeConnections,
          queryTime: metrics.averageQueryTime,
          memoryUsage: metrics.memoryUsage,
        },
      });

      // Record alert metric
      monitoring.recordCounter('database.alert.triggered', 1, {
        alertCount: String(alerts.length),
      });

      // Here you would implement actual alert sending (email, webhook, etc.)
      // For now, we'll just log the alert
      
    } catch (error) {
      logger.error('Failed to send alert', {
        alerts,
      }, error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Get current metrics
  getCurrentMetrics(): DatabaseMetrics | null {
    return this.metrics.length > 0 ? (this.metrics[this.metrics.length - 1] ?? null) : null;
  }

  // Get metrics history
  getMetricsHistory(limit: number = 100): DatabaseMetrics[] {
    return this.metrics.slice(-limit);
  }

  // Get metrics summary
  getMetricsSummary(): {
    averageQueryTime: number;
    averageMemoryUsage: number;
    averageCpuUsage: number;
    totalAlerts: number;
    uptime: number;
  } {
    if (this.metrics.length === 0) {
      return {
        averageQueryTime: 0,
        averageMemoryUsage: 0,
        averageCpuUsage: 0,
        totalAlerts: 0,
        uptime: 0,
      };
    }

    const avgQueryTime = this.metrics.reduce((sum, m) => sum + m.averageQueryTime, 0) / this.metrics.length;
    const avgMemoryUsage = this.metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / this.metrics.length;
    const avgCpuUsage = this.metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / this.metrics.length;
    
    return {
      averageQueryTime: Math.round(avgQueryTime * 100) / 100,
      averageMemoryUsage: Math.round(avgMemoryUsage * 100) / 100,
      averageCpuUsage: Math.round(avgCpuUsage * 100) / 100,
      totalAlerts: 0, // This would be tracked separately
      uptime: this.metrics.length * (DB_MONITORING_CONFIG.performanceCheckInterval / 1000), // seconds
    };
  }
}

// Create database monitor instance
export const databaseMonitor = new DatabaseMonitor(new PrismaClient());

export default databaseMonitor;




