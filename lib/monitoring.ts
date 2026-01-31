import { logger } from './logger';

export interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: Date;
}

export interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  errorRate: number;
  throughput: number;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private metrics: Map<string, MetricData[]> = new Map();
  private alerts: AlertRule[] = [];
  private performanceData: PerformanceMetrics[] = [];

  constructor() {
    this.initializeDefaultAlerts();
    this.startPerformanceMonitoring();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Record a metric (alias for recordMetric)
   */
  recordCounter(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric(name, value, tags);
  }

  /**
   * Record a timer metric (alias for recordMetric)
   */
  recordTimer(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric(name, value, tags);
  }

  /**
   * Record a gauge metric (alias for recordMetric)
   */
  recordGauge(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric(name, value, tags);
  }

  /**
   * Record a metric
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: MetricData = {
      name,
      value,
      tags,
      timestamp: new Date()
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name)!.push(metric);

    // Keep only last 1000 metrics per name
    const metrics = this.metrics.get(name)!;
    if (metrics.length > 1000) {
      metrics.splice(0, metrics.length - 1000);
    }

    // Check for alerts
    this.checkAlerts(metric);

    logger.info('Metric recorded', { name, value, tags });
  }

  /**
   * Get metrics for a specific name
   */
  getMetrics(name: string, limit?: number): MetricData[] {
    const metrics = this.metrics.get(name) || [];
    return limit ? metrics.slice(-limit) : metrics;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, MetricData[]> {
    const result: Record<string, MetricData[]> = {};
    for (const [name, metrics] of this.metrics) {
      result[name] = metrics;
    }
    return result;
  }

  /**
   * Get metric statistics
   */
  getMetricStats(name: string, timeRange?: { start: Date; end: Date }): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
    latest: number;
  } {
    let metrics = this.getMetrics(name);

    if (timeRange) {
      metrics = metrics.filter(m =>
        m.timestamp! >= timeRange.start && m.timestamp! <= timeRange.end
      );
    }

    if (metrics.length === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0, latest: 0 };
    }

    if (metrics.length === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0, latest: 0 };
    }

    const values = metrics.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const latest = values[values.length - 1]!; // Safe because we checked metrics.length > 0

    return { count: metrics.length, sum, avg, min, max, latest };
  }

  /**
   * Add alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alerts.push(rule);
    logger.info('Alert rule added', { rule: rule.name });
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(name: string): void {
    this.alerts = this.alerts.filter(rule => rule.name !== name);
    logger.info('Alert rule removed', { name });
  }

  /**
   * Get alert rules
   */
  getAlertRules(): AlertRule[] {
    return [...this.alerts];
  }

  /**
   * Check alerts for a metric
   */
  private checkAlerts(metric: MetricData): void {
    for (const rule of this.alerts) {
      if (!rule.enabled || !rule.condition.includes(metric.name)) {
        continue;
      }

      let shouldAlert = false;

      switch (rule.condition) {
        case `${metric.name} > ${rule.threshold}`:
          shouldAlert = metric.value > rule.threshold;
          break;
        case `${metric.name} < ${rule.threshold}`:
          shouldAlert = metric.value < rule.threshold;
          break;
        case `${metric.name} >= ${rule.threshold}`:
          shouldAlert = metric.value >= rule.threshold;
          break;
        case `${metric.name} <= ${rule.threshold}`:
          shouldAlert = metric.value <= rule.threshold;
          break;
        case `${metric.name} == ${rule.threshold}`:
          shouldAlert = metric.value === rule.threshold;
          break;
      }

      if (shouldAlert) {
        this.triggerAlert(rule, metric);
      }
    }
  }

  /**
   * Trigger alert
   */
  private triggerAlert(rule: AlertRule, metric: MetricData): void {
    const alert = {
      rule: rule.name,
      metric: metric.name,
      value: metric.value,
      threshold: rule.threshold,
      severity: rule.severity,
      timestamp: new Date(),
      condition: rule.condition
    };

    logger.error('Alert triggered', alert);

    // In production, this would send notifications to monitoring services
    // like PagerDuty, Slack, email, etc.
    this.sendAlertNotification(alert);
  }

  /**
   * Send alert notification
   */
  private sendAlertNotification(alert: any): void {
    // TODO: Implement actual notification sending
    // This could integrate with:
    // - Slack webhooks
    // - Email services
    // - PagerDuty
    // - Discord webhooks
    // - SMS services

    logger.error('Alert triggered', { alert });
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultAlerts(): void {
    this.addAlertRule({
      name: 'High Error Rate',
      condition: 'error_rate > 0.05',
      threshold: 0.05,
      severity: 'high',
      enabled: true
    });

    this.addAlertRule({
      name: 'Slow Response Time',
      condition: 'response_time > 5000',
      threshold: 5000,
      severity: 'medium',
      enabled: true
    });

    this.addAlertRule({
      name: 'High Memory Usage',
      condition: 'memory_usage > 0.9',
      threshold: 0.9,
      severity: 'high',
      enabled: true
    });

    this.addAlertRule({
      name: 'High CPU Usage',
      condition: 'cpu_usage > 0.8',
      threshold: 0.8,
      severity: 'medium',
      enabled: true
    });
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.collectPerformanceMetrics();
    }, 30000); // Collect every 30 seconds
  }

  /**
   * Collect performance metrics
   */
  private collectPerformanceMetrics(): void {
    if (process.env.NEXT_RUNTIME === 'edge') {
      return;
    }

    // Check if process.memoryUsage is available (Node.js environment)
    if (typeof process.memoryUsage !== 'function' || typeof process.cpuUsage !== 'function') {
      return;
    }

    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const metrics: PerformanceMetrics = {
      responseTime: 0, // This would be calculated from request timing
      memoryUsage: memUsage.heapUsed / memUsage.heapTotal,
      cpuUsage: cpuUsage.user / 1000000, // Convert to seconds
      errorRate: 0, // This would be calculated from error logs
      throughput: 0 // This would be calculated from request count
    };

    this.performanceData.push(metrics);

    // Keep only last 100 performance measurements
    if (this.performanceData.length > 100) {
      this.performanceData.splice(0, this.performanceData.length - 100);
    }

    // Record metrics
    this.recordMetric('memory_usage', metrics.memoryUsage);
    this.recordMetric('cpu_usage', metrics.cpuUsage);
    this.recordMetric('error_rate', metrics.errorRate);
    this.recordMetric('throughput', metrics.throughput);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.performanceData];
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    metrics: {
      memoryUsage: number;
      cpuUsage: number;
      errorRate: number;
      responseTime: number;
    };
    alerts: number;
  } {
    const latest = this.performanceData[this.performanceData.length - 1];
    const activeAlerts = this.alerts.filter(rule => rule.enabled).length;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (latest) {
      if (latest.memoryUsage > 0.9 || latest.cpuUsage > 0.8 || latest.errorRate > 0.05) {
        status = 'critical';
      } else if (latest.memoryUsage > 0.7 || latest.cpuUsage > 0.6 || latest.errorRate > 0.02) {
        status = 'warning';
      }
    }

    return {
      status,
      metrics: latest || {
        memoryUsage: 0,
        cpuUsage: 0,
        errorRate: 0,
        responseTime: 0
      },
      alerts: activeAlerts
    };
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(format: 'json' | 'prometheus' = 'json'): string {
    if (format === 'prometheus') {
      let prometheus = '';
      for (const [name, metrics] of this.metrics) {
        const latest = metrics[metrics.length - 1];
        if (latest) {
          const tags = latest.tags ?
            Object.entries(latest.tags).map(([k, v]) => `${k}="${v}"`).join(',') : '';
          prometheus += `${name}{${tags}} ${latest.value}\n`;
        }
      }
      return prometheus;
    }

    return JSON.stringify(this.getAllMetrics(), null, 2);
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(olderThan: Date): void {
    for (const [name, metrics] of this.metrics) {
      const filtered = metrics.filter(m => m.timestamp! > olderThan);
      this.metrics.set(name, filtered);
    }
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics.clear();
    this.performanceData = [];
    logger.info('All metrics reset');
  }

  /**
   * Track an event (for analytics integration)
   */
  trackEvent(data: {
    event: string;
    properties?: Record<string, any>;
    userId?: string;
    sessionId?: string;
  }): void {
    // Record as a metric with all properties as tags
    const tags: Record<string, string> = {
      event: data.event,
      ...(data.userId && { userId: data.userId }),
      ...(data.sessionId && { sessionId: data.sessionId }),
      ...(data.properties && Object.fromEntries(
        Object.entries(data.properties).map(([k, v]) => [k, String(v)])
      )),
    };

    this.recordCounter('analytics.event', 1, tags);
  }
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance();