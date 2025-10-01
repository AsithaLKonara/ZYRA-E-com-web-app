import { NextRequest, NextResponse } from 'next/server';
import { errorHandler, asyncHandler, AuthorizationError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { monitoring } from '@/lib/monitoring';
import { withApiVersioning } from '@/lib/api-versioning';
import { withCache } from '@/lib/cache';
import { apiCache } from '@/lib/cache';
import { PrismaClient } from '@prisma/client';
import { AuthUtils, UserRole } from '@/lib/auth-utils';

// Create Prisma client
const prisma = new PrismaClient();

// Get admin dashboard data
const GETHandler = asyncHandler(async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Check authentication and authorization
    const currentUser = await AuthUtils.requireAdmin();
    
    logger.info('Fetching admin dashboard data', {
      userId: currentUser.id,
      path: request.nextUrl.pathname,
    });

    // Record metric
    monitoring.recordCounter('admin.dashboard.requests', 1, {
      userId: currentUser.id,
    });

    // Check cache first
    const cacheKey = 'admin:dashboard';
    const cachedData = apiCache.get(cacheKey);
    
    if (cachedData) {
      logger.debug('Admin dashboard data found in cache');
      monitoring.recordCounter('admin.dashboard.cache_hits', 1);
      
      return NextResponse.json(cachedData);
    }

    // Get dashboard data
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrders,
      topProducts,
      userGrowth,
      orderStats,
      revenueStats,
      categoryStats,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Total products
      prisma.product.count(),
      
      // Total orders
      prisma.order.count(),
      
      // Total revenue
      prisma.order.aggregate({
        where: {
          status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
        _sum: {
          total: true,
        },
      }),
      
      // Recent orders
      prisma.order.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
            },
          },
        },
      }),
      
      // Top products
      prisma.product.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      }),
      
      // User growth (last 30 days)
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // Order statistics
      prisma.order.groupBy({
        by: ['status'],
        _count: {
          id: true,
        },
        _sum: {
          total: true,
        },
      }),
      
      // Revenue statistics (last 30 days)
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
          status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
        _sum: {
          total: true,
        },
        _count: {
          id: true,
        },
      }),
      
      // Category statistics
      prisma.category.findMany({
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      }),
    ]);

    // Process data
    const processedRecentOrders = recentOrders.map(order => ({
      id: order.id,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
      user: order.user,
      itemCount: order.items.length,
    }));

    const processedTopProducts = topProducts.map(product => {
      const reviews = product.reviews || [];
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0;
      
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        inStock: product.stock > 0,
        category: product.category,
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: reviews.length,
      };
    });

    const processedOrderStats = orderStats.reduce((acc, stat) => {
      acc[stat.status] = {
        count: stat._count.id,
        total: stat._sum.total || 0,
      };
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    const processedCategoryStats = categoryStats.map(category => ({
      id: category.id,
      name: category.name,
      productCount: category._count.products,
    }));

    // Build dashboard response
    const dashboardData = {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        userGrowth,
        revenueGrowth: revenueStats._sum.total || 0,
        orderGrowth: revenueStats._count.id || 0,
      },
      recentOrders: processedRecentOrders,
      topProducts: processedTopProducts,
      orderStats: processedOrderStats,
      categoryStats: processedCategoryStats,
      charts: {
        userGrowth: {
          current: userGrowth,
          previous: 0, // This would be calculated from previous period
        },
        revenueGrowth: {
          current: revenueStats._sum.total || 0,
          previous: 0, // This would be calculated from previous period
        },
        orderGrowth: {
          current: revenueStats._count.id || 0,
          previous: 0, // This would be calculated from previous period
        },
      },
      meta: {
        lastUpdated: new Date(),
        cacheExpiry: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    };

    // Cache the response
    apiCache.set(cacheKey, dashboardData, 300); // 5 minutes

    // Record success metric
    monitoring.recordCounter('admin.dashboard.success', 1);
    monitoring.recordTimer('admin.dashboard.duration', Date.now() - startTime);

    logger.info('Admin dashboard data fetched successfully', {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      userId: currentUser.id,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(dashboardData);

  } catch (error) {
    logger.error('Failed to fetch admin dashboard data', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('admin.dashboard.errors', 1);

    throw error;
  }
});

// Apply API versioning decorator
export const GET = withApiVersioning(GETHandler);


