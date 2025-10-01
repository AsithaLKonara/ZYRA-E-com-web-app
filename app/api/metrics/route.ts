import { NextRequest, NextResponse } from 'next/server';
import { withApiVersioning } from '@/lib/api-versioning';
import { monitoring } from '@/lib/monitoring';
import { logger } from '@/lib/logger';

// GET /api/metrics - Get application metrics
const GETHandler = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const name = searchParams.get('name');
    const limit = parseInt(searchParams.get('limit') || '100');

    let metrics;

    if (name) {
      // Get specific metric
      metrics = monitoring.getMetrics(name, limit);
    } else {
      // Get all metrics
      metrics = monitoring.getAllMetrics();
    }

    if (format === 'prometheus') {
      const prometheusMetrics = monitoring.exportMetrics('prometheus');
      return new NextResponse(prometheusMetrics, {
        headers: {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8'
        }
      });
    }

    const response = {
      timestamp: new Date().toISOString(),
      metrics,
      count: typeof metrics === 'object' && !Array.isArray(metrics) 
        ? Object.keys(metrics).length 
        : Array.isArray(metrics) ? metrics.length : 1
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Metrics retrieval failed', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      {
        error: 'Failed to retrieve metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// GET /api/metrics/stats - Get metric statistics
const getStatsHandler = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const startTime = searchParams.get('start');
    const endTime = searchParams.get('end');

    if (!name) {
      return NextResponse.json(
        { error: 'Metric name is required' },
        { status: 400 }
      );
    }

    let timeRange;
    if (startTime && endTime) {
      timeRange = {
        start: new Date(startTime),
        end: new Date(endTime)
      };
    }

    const stats = monitoring.getMetricStats(name, timeRange);

    const response = {
      metric: name,
      timeRange,
      stats,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Metrics stats retrieval failed', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      {
        error: 'Failed to retrieve metric statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// GET /api/metrics/performance - Get performance metrics
const getPerformanceHandler = async (request: NextRequest) => {
  try {
    const performanceMetrics = monitoring.getPerformanceMetrics();
    const healthStatus = monitoring.getHealthStatus();

    const response = {
      timestamp: new Date().toISOString(),
      performance: performanceMetrics,
      health: healthStatus,
      summary: {
        averageMemoryUsage: performanceMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / performanceMetrics.length || 0,
        averageCpuUsage: performanceMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) / performanceMetrics.length || 0,
        averageErrorRate: performanceMetrics.reduce((sum, m) => sum + m.errorRate, 0) / performanceMetrics.length || 0,
        averageResponseTime: performanceMetrics.reduce((sum, m) => sum + m.responseTime, 0) / performanceMetrics.length || 0
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Performance metrics retrieval failed', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      {
        error: 'Failed to retrieve performance metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// DELETE /api/metrics - Clear metrics
const deleteMetricsHandler = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const olderThan = searchParams.get('olderThan');

    if (olderThan) {
      const cutoffDate = new Date(olderThan);
      monitoring.clearOldMetrics(cutoffDate);
      
      return NextResponse.json({
        message: 'Old metrics cleared',
        cutoffDate: cutoffDate.toISOString()
      });
    } else {
      monitoring.resetMetrics();
      
      return NextResponse.json({
        message: 'All metrics reset'
      });
    }
  } catch (error) {
    logger.error('Metrics clearing failed', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      {
        error: 'Failed to clear metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// Route handlers based on path
export const GET = withApiVersioning(async (request: NextRequest) => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname.endsWith('/stats')) {
    return getStatsHandler(request);
  } else if (pathname.endsWith('/performance')) {
    return getPerformanceHandler(request);
  } else {
    return GETHandler(request);
  }
});

export const DELETE = withApiVersioning(deleteMetricsHandler);