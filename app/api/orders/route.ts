import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { errorHandler, asyncHandler, ValidationError, NotFoundError, AuthorizationError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { monitoring } from '@/lib/monitoring';
import { withApiVersioning } from '@/lib/api-versioning';
import { withCache } from '@/lib/cache';
import { apiCache } from '@/lib/cache';
import { PrismaClient } from '@prisma/client';
import { AuthUtils, UserRole } from '@/lib/auth-utils';

// Create Prisma client
const prisma = new PrismaClient();

// Order schemas
const OrderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  total: z.number(),
  currency: z.string(),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }),
  billingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }),
  paymentMethod: z.string(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  items: z.array(z.object({
    id: z.string(),
    productId: z.string(),
    productName: z.string(),
    quantity: z.number(),
    price: z.number(),
    total: z.number(),
  })),
});

const CreateOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().int().positive('Quantity must be positive'),
  })).min(1, 'At least one item is required'),
  shippingAddress: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'Zip code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  billingAddress: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'Zip code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  notes: z.string().optional(),
});

const UpdateOrderSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
});

const QuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  userId: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'total', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Get orders with filtering
const GETHandler = asyncHandler(async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Check authentication
    const currentUser = await AuthUtils.requireAuth();
    
    // Parse query parameters
    const { searchParams } = request.nextUrl;
    const query = QuerySchema.parse(Object.fromEntries(searchParams));
    
    logger.info('Fetching orders', {
      query,
      userId: currentUser.id,
      path: request.nextUrl.pathname,
    });

    // Record metric
    monitoring.recordCounter('orders.list.requests', 1, {
      userId: currentUser.id,
      role: currentUser.role,
    });

    // Check cache first
    const cacheKey = `orders:${JSON.stringify(query)}:${currentUser.id}`;
    const cachedOrders = apiCache.get(cacheKey);
    
    if (cachedOrders) {
      logger.debug('Orders found in cache', { query });
      monitoring.recordCounter('orders.list.cache_hits', 1);
      
      return NextResponse.json(cachedOrders);
    }

    // Build where clause
    const where: any = {};
    
    // Users can only see their own orders unless they're admin
    if (currentUser.role !== UserRole.ADMIN) {
      where.userId = currentUser.id;
    } else if (query.userId) {
      where.userId = query.userId;
    }
    
    if (query.status) {
      where.status = query.status;
    }
    
    
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    // Get orders with related data
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
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
                  price: true,
                  images: true,
                },
              },
            },
          },
        },
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.order.count({ where }),
    ]);

    // Process orders to include calculated fields
    const processedOrders = orders.map(order => ({
      ...order,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      })),
    }));

    // Calculate pagination
    const totalPages = Math.ceil(total / query.limit);
    
    // Build response
    const response = {
      orders: processedOrders,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrev: query.page > 1,
      },
      filters: {
        status: query.status,
        userId: query.userId,
        startDate: query.startDate,
        endDate: query.endDate,
      },
      sort: {
        by: query.sortBy,
        order: query.sortOrder,
      },
      meta: {
        totalOrders: total,
        totalValue: orders.reduce((sum, order) => sum + order.total, 0),
        averageOrderValue: orders.length > 0 
          ? Math.round(orders.reduce((sum, order) => sum + order.total, 0) / orders.length * 100) / 100 
          : 0,
        statusCounts: orders.reduce((counts, order) => {
          counts[order.status] = (counts[order.status] || 0) + 1;
          return counts;
        }, {} as Record<string, number>),
      },
    };

    // Cache the response
    apiCache.set(cacheKey, response, 300); // 5 minutes

    // Record success metric
    monitoring.recordCounter('orders.list.success', 1);
    monitoring.recordTimer('orders.list.duration', Date.now() - startTime);

    logger.info('Orders fetched successfully', {
      count: orders.length,
      total,
      page: query.page,
      userId: currentUser.id,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Failed to fetch orders', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('orders.list.errors', 1);

    throw error;
  }
});

// Create new order
const POSTHandler = asyncHandler(async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Check authentication
    const currentUser = await AuthUtils.requireAuth();
    
    // Parse request body
    const body = await request.json();
    const orderData = CreateOrderSchema.parse(body);
    
    logger.info('Creating new order', {
      userId: currentUser.id,
      itemCount: orderData.items.length,
    });

    // Record metric
    monitoring.recordCounter('orders.create.requests', 1, {
      userId: currentUser.id,
    });

    // Validate products and calculate totals
    const orderItems = [];
    let total = 0;

    for (const item of orderData.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
        },
      });

      if (!product) {
        throw new NotFoundError(`Product with ID ${item.productId} not found`);
      }

      if (product.stock < item.quantity) {
        throw new ValidationError(`Insufficient stock for product ${product.name}`);
      }

      const itemTotal = product.price * item.quantity;
      total += itemTotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal,
      });
    }

    // Create order
    const newOrder = await prisma.order.create({
      data: {
        userId: currentUser.id,
        orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'PENDING',
        total,
        subtotal: total * 0.9, // Assuming 10% tax + shipping
        tax: total * 0.08,
        shipping: total * 0.02,
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
        items: {
          create: orderItems,
        },
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
                images: true,
              },
            },
          },
        },
      },
    });

    // Update product stock quantities
    for (const item of orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Clear cache
    apiCache.clear();

    // Record success metric
    monitoring.recordCounter('orders.create.success', 1);
    monitoring.recordTimer('orders.create.duration', Date.now() - startTime);

    logger.info('Order created successfully', {
      id: newOrder.id,
      userId: currentUser.id,
      total: newOrder.total,
      itemCount: newOrder.items.length,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(newOrder, { status: 201 });

  } catch (error) {
    logger.error('Failed to create order', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('orders.create.errors', 1);

    throw error;
  }
});

// Apply API versioning decorator
export const GET = withApiVersioning(GETHandler);
export const POST = withApiVersioning(POSTHandler);