import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth-middleware'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { withApiVersioning } from '@/lib/api-versioning'
import { db } from '@/lib/db-connection'
import { logger } from '@/lib/logger'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, ORDER_STATUS } from '@/lib/constants'

// Get all orders (admin)
async function getOrdersHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(
      parseInt(searchParams.get('limit') || DEFAULT_PAGE_SIZE.toString()),
      MAX_PAGE_SIZE
    )
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (status && Object.values(ORDER_STATUS).includes(status as any)) {
      where.status = status
    }

    // Build order by clause
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
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
                  slug: true,
                  images: true,
                },
              },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      db.order.count({ where }),
    ])

    logger.info('Admin orders fetched', {
      page,
      limit,
      total,
      search,
      status,
    })

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })

  } catch (error) {
    logger.error('Error fetching admin orders:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// Get order statistics (admin)
async function getOrderStatsHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Get order statistics
    const [
      totalOrders,
      totalRevenue,
      ordersByStatus,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      // Total orders
      db.order.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
      // Total revenue
      db.order.aggregate({
        where: {
          createdAt: {
            gte: startDate,
          },
          status: {
            not: ORDER_STATUS.CANCELLED,
          },
        },
        _sum: {
          total: true,
        },
      }),
      // Orders by status
      db.order.groupBy({
        by: ['status'],
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          id: true,
        },
      }),
      // Recent orders
      db.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Top products
      db.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            createdAt: {
              gte: startDate,
            },
            status: {
              not: ORDER_STATUS.CANCELLED,
            },
          },
        },
        _sum: {
          quantity: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 10,
      }),
    ])

    // Get product details for top products
    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await db.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
          },
        })
        return {
          ...item,
          product,
        }
      })
    )

    const stats = {
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      ordersByStatus: ordersByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.id
        return acc
      }, {} as Record<string, number>),
      recentOrders,
      topProducts: topProductsWithDetails,
    }

    logger.info('Order statistics fetched', {
      period,
      totalOrders,
      totalRevenue: stats.totalRevenue,
    })

    return NextResponse.json({
      success: true,
      data: stats,
    })

  } catch (error) {
    logger.error('Error fetching order statistics:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order statistics' },
      { status: 500 }
    )
  }
}

export const GET = withApiVersioning(withErrorHandler(withAdminAuth(getOrdersHandler)))
export const POST = withApiVersioning(withErrorHandler(withAdminAuth(getOrderStatsHandler)))




