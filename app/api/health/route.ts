import { NextRequest, NextResponse } from 'next/server';
import { withApiVersioning } from '@/lib/api-versioning';
import { monitoring } from '@/lib/monitoring';
import { logger } from '@/lib/logger';

// GET /api/health - Health check endpoint
const GETHandler = async (request: NextRequest) => {
  try {
    const healthStatus = monitoring.getHealthStatus();
    const performanceMetrics = monitoring.getPerformanceMetrics();
    const latestMetrics = performanceMetrics[performanceMetrics.length - 1];

    const health = {
      status: healthStatus.status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      metrics: {
        memory: {
          used: latestMetrics?.memoryUsage || 0,
          total: process.memoryUsage().heapTotal,
          free: process.memoryUsage().heapTotal - process.memoryUsage().heapUsed
        },
        cpu: {
          usage: latestMetrics?.cpuUsage || 0
        },
        performance: {
          responseTime: latestMetrics?.responseTime || 0,
          errorRate: latestMetrics?.errorRate || 0,
          throughput: latestMetrics?.throughput || 0
        }
      },
      services: {
        database: await checkDatabaseHealth(),
        redis: await checkRedisHealth(),
        blobStorage: await checkBlobStorageHealth(),
        email: await checkEmailHealth()
      },
      alerts: healthStatus.alerts
    };

    // Set appropriate status code based on health
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'warning' ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      {
        status: 'critical',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
};

// Check database health
async function checkDatabaseHealth(): Promise<{ status: string; message?: string }> {
  try {
    // TODO: Implement actual database health check
    // This would typically involve:
    // 1. Testing database connection
    // 2. Running a simple query
    // 3. Checking connection pool status
    
    return { status: 'healthy' };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: error instanceof Error ? error.message : 'Database check failed' 
    };
  }
}

// Check Redis health
async function checkRedisHealth(): Promise<{ status: string; message?: string }> {
  try {
    // TODO: Implement actual Redis health check
    // This would typically involve:
    // 1. Testing Redis connection
    // 2. Running a simple command
    // 3. Checking memory usage
    
    return { status: 'healthy' };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: error instanceof Error ? error.message : 'Redis check failed' 
    };
  }
}

// Check blob storage health
async function checkBlobStorageHealth(): Promise<{ status: string; message?: string }> {
  try {
    // TODO: Implement actual blob storage health check
    // This would typically involve:
    // 1. Testing storage connection
    // 2. Checking available space
    // 3. Testing read/write permissions
    
    return { status: 'healthy' };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: error instanceof Error ? error.message : 'Blob storage check failed' 
    };
  }
}

// Check email service health
async function checkEmailHealth(): Promise<{ status: string; message?: string }> {
  try {
    // TODO: Implement actual email service health check
    // This would typically involve:
    // 1. Testing email service connection
    // 2. Checking API key validity
    // 3. Testing email sending capability
    
    return { status: 'healthy' };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: error instanceof Error ? error.message : 'Email service check failed' 
    };
  }
}

export const GET = withApiVersioning(GETHandler);