import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { errorHandler, asyncHandler, ValidationError, AuthorizationError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { monitoring } from '@/lib/monitoring';
import { withApiVersioning } from '@/lib/api-versioning';
import { withCache } from '@/lib/cache';
import { apiCache } from '@/lib/cache';
import { PrismaClient } from '@prisma/client';
import { AuthUtils, UserRole } from '@/lib/auth-utils';

// Create Prisma client
const prisma = new PrismaClient();

// Analytics schemas
const AnalyticsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).default('month'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  metric: z.enum(['revenue', 'orders', 'users', 'products', 'categories']).optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

// Get analytics data
const GETHandler = asyncHandler(async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Check authentication and authorization
    const currentUser = await AuthUtils.requireModeratorOrAdmin();
    
    // Parse query parameters
    const { searchParams } = request.nextUrl;
    const query = AnalyticsQuerySchema.parse(Object.fromEntries(searchParams));
    
    logger.info('Fetching analytics data', {
      query,
      userId: currentUser.id,
      path: request.nextUrl.pathname,
    });

    // Record metric
    monitoring.recordCounter('analytics.requests', 1, {
      userId: currentUser.id,
      period: query.period,
    });

    // Check cache first
    const cacheKey = `analytics:${JSON.stringify(query)}`;
    const cachedData = apiCache.get(cacheKey);
    
    if (cachedData) {
      logger.debug('Analytics data found in cache', { query });
      monitoring.recordCounter('analytics.cache_hits', 1);
      
      return NextResponse.json(cachedData);
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (query.startDate && query.endDate) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
    } else {
      switch (query.period) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    // Get analytics data
    const [
      revenueData,
      orderData,
      userData,
      productData,
      categoryData,
      topProducts,
      topCategories,
      userGrowth,
      orderGrowth,
      revenueGrowth,
    ] = await Promise.all([
      // Revenue analytics
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
        select: {
          total: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      
      // Order analytics
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          status: true,
          total: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      
      // User analytics
      prisma.user.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          createdAt: true,
          role: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      
      // Product analytics
      prisma.product.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          createdAt: true,
          categoryId: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      
      // Category analytics
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      }),
      
      // Top products by sales
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
      
      // Top categories by product count
      prisma.category.findMany({
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
        orderBy: {
          products: {
            _count: 'desc',
          },
        },
        take: 10,
      }),
      
      // User growth over time
      prisma.user.groupBy({
        by: ['createdAt'],
        _count: {
          id: true,
        },
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      
      // Order growth over time
      prisma.order.groupBy({
        by: ['createdAt'],
        _count: {
          id: true,
        },
        _sum: {
          total: true,
        },
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      
      // Revenue growth over time
      prisma.order.groupBy({
        by: ['createdAt'],
        _sum: {
          total: true,
        },
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
    ]);

    // Process data for charts
    const processTimeSeriesData = (data: any[], groupBy: string) => {
      const grouped = data.reduce((acc, item) => {
        const date = new Date(item.createdAt || new Date());
        let key: string;
        
        switch (groupBy) {
          case 'day':
            key = date.toISOString().split('T')[0] || date.toISOString();
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().split('T')[0] || weekStart.toISOString();
            break;
          case 'month':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          default:
            key = date.toISOString().split('T')[0] || date.toISOString();
        }
        
        if (!acc[key]) {
          acc[key] = {
            date: key,
            count: 0,
            total: 0,
          };
        }
        
        acc[key].count += 1;
        acc[key].total += item.total || 0;
        
        return acc;
      }, {} as Record<string, { date: string; count: number; total: number }>);
      
      return Object.values(grouped).sort((a, b) => (a as any).date.localeCompare((b as any).date));
    };

    // Build analytics response
    const analyticsData = {
      period: {
        start: startDate,
        end: endDate,
        type: query.period,
      },
      revenue: {
        total: revenueData.reduce((sum, item) => sum + item.total, 0),
        growth: 0, // This would be calculated from previous period
        timeSeries: processTimeSeriesData(revenueData, query.groupBy),
      },
      orders: {
        total: orderData.length,
        growth: 0, // This would be calculated from previous period
        timeSeries: processTimeSeriesData(orderData, query.groupBy),
        byStatus: orderData.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      users: {
        total: userData.length,
        growth: 0, // This would be calculated from previous period
        timeSeries: processTimeSeriesData(userData, query.groupBy),
        byRole: userData.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      products: {
        total: productData.length,
        growth: 0, // This would be calculated from previous period
        timeSeries: processTimeSeriesData(productData, query.groupBy),
        inStock: productData.filter(p => p.stock > 0).length,
        outOfStock: productData.filter(p => p.stock === 0).length,
      },
      categories: {
        total: categoryData.length,
        growth: 0, // This would be calculated from previous period
        timeSeries: processTimeSeriesData(categoryData, query.groupBy),
      },
      topProducts: topProducts.map(product => {
        const reviews = product.reviews || [];
        const averageRating = reviews.length > 0 
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
          : 0;
        
        return {
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          averageRating: Math.round(averageRating * 10) / 10,
          reviewCount: reviews.length,
        };
      }),
      topCategories: topCategories.map(category => ({
        id: category.id,
        name: category.name,
        productCount: category._count.products,
      })),
      meta: {
        lastUpdated: new Date(),
        cacheExpiry: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    };

    // Cache the response
    apiCache.set(cacheKey, analyticsData, 300); // 5 minutes

    // Record success metric
    monitoring.recordCounter('analytics.success', 1);
    monitoring.recordTimer('analytics.duration', Date.now() - startTime);

    logger.info('Analytics data fetched successfully', {
      period: query.period,
      startDate,
      endDate,
      userId: currentUser.id,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(analyticsData);

  } catch (error) {
    logger.error('Failed to fetch analytics data', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('analytics.errors', 1);

    throw error;
  }
});

// Apply API versioning decorator
export const GET = withApiVersioning(GETHandler);


