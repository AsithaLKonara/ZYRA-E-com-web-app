import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { errorHandler, asyncHandler, ValidationError, NotFoundError, AuthorizationError } from '@/lib/error-handler';
import { withErrorHandler } from '@/lib/cors';
import { logger } from '@/lib/logger';
import { monitoring } from '@/lib/monitoring';
import { withApiVersioning } from '@/lib/api-versioning';
import { withCache } from '@/lib/cache';
import { sessionCache } from '@/lib/cache';
import { PrismaClient } from '@prisma/client';
import { AuthUtils, UserRole } from '@/lib/auth-utils';

// Create Prisma client
const prisma = new PrismaClient();

// Order schemas
const OrderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
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

const UpdateOrderSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
});

// Get order by ID
const GETHandler = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
  const startTime = Date.now();
  const { id } = params;
  
  try {
    // Check authentication
    const currentUser = await AuthUtils.requireAuth();
    
    logger.info('Fetching order by ID', {
      id,
      userId: currentUser.id,
      path: request.nextUrl.pathname,
    });

    // Record metric
    monitoring.recordCounter('orders.get.requests', 1, { id, userId: currentUser.id });

    // Check cache first
    const cacheKey = `order:${id}`;
    const cachedOrder = sessionCache.get(cacheKey);
    
    if (cachedOrder) {
      logger.debug('Order found in cache', { id });
      monitoring.recordCounter('orders.get.cache_hits', 1, { id });
      
      return NextResponse.json(cachedOrder);
    }

    // Find order
    const order = await prisma.order.findUnique({
      where: { id },
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

    if (!order) {
      logger.warn('Order not found', { id });
      monitoring.recordCounter('orders.get.not_found', 1, { id });
      
      throw new NotFoundError(`Order with ID ${id} not found`);
    }

    // Check authorization - users can only access their own orders unless they're admin
    if (order.userId !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
      logger.warn('Unauthorized order access attempt', {
        id,
        orderUserId: order.userId,
        currentUserId: currentUser.id,
      });
      monitoring.recordCounter('orders.get.unauthorized', 1, { id });
      
      throw new AuthorizationError('Access denied');
    }

    // Process order to include calculated fields
    const processedOrder = {
      ...order,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      })),
    };

    // Cache the order
    sessionCache.set(cacheKey, processedOrder, 1800); // 30 minutes

    // Record success metric
    monitoring.recordCounter('orders.get.success', 1, { id });
    monitoring.recordTimer('orders.get.duration', Date.now() - startTime);

    logger.info('Order fetched successfully', {
      id,
      userId: currentUser.id,
      status: order.status,
      total: order.total,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(processedOrder);

  } catch (error) {
    logger.error('Failed to fetch order', {
      id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('orders.get.errors', 1, { id });

    throw error;
  }
});

// Update order by ID
const PUTHandler = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
  const startTime = Date.now();
  const { id } = params;
  
  try {
    // Check authentication and authorization
    const currentUser = await AuthUtils.requireModeratorOrAdmin();
    
    // Parse request body
    const body = await request.json();
    const updateData = UpdateOrderSchema.parse(body);
    
    logger.info('Updating order', {
      id,
      updates: Object.keys(updateData),
      userId: currentUser.id,
    });

    // Record metric
    monitoring.recordCounter('orders.update.requests', 1, { id, userId: currentUser.id });

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });
    
    if (!existingOrder) {
      logger.warn('Order not found for update', { id });
      monitoring.recordCounter('orders.update.not_found', 1, { id });
      
      throw new NotFoundError(`Order with ID ${id} not found`);
    }

    // Validate status transitions
    if (updateData.status) {
      const validTransitions: Record<string, string[]> = {
        'PENDING': ['PROCESSING', 'CANCELLED'],
        'PROCESSING': ['SHIPPED', 'CANCELLED'],
        'SHIPPED': ['DELIVERED', 'CANCELLED'],
        'DELIVERED': [],
        'CANCELLED': [],
      };

      const currentStatus = existingOrder.status;
      const newStatus = updateData.status;

      if (!validTransitions[currentStatus]?.includes(newStatus)) {
        throw new ValidationError(`Invalid status transition from ${currentStatus} to ${newStatus}`);
      }
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
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

    // Process order to include calculated fields
    const processedOrder = {
      ...updatedOrder,
      items: updatedOrder.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      })),
    };

    // Update cache
    const cacheKey = `order:${id}`;
    sessionCache.set(cacheKey, processedOrder, 1800); // 30 minutes

    // Record success metric
    monitoring.recordCounter('orders.update.success', 1, { id });
    monitoring.recordTimer('orders.update.duration', Date.now() - startTime);

    logger.info('Order updated successfully', {
      id,
      status: updatedOrder.status,
      userId: currentUser.id,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(processedOrder);

  } catch (error) {
    logger.error('Failed to update order', {
      id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('orders.update.errors', 1, { id });

    throw error;
  }
});

// Cancel order
const DELETEHandler = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
  const startTime = Date.now();
  const { id } = params;
  
  try {
    // Check authentication
    const currentUser = await AuthUtils.requireAuth();
    
    logger.info('Cancelling order', {
      id,
      userId: currentUser.id,
    });

    // Record metric
    monitoring.recordCounter('orders.cancel.requests', 1, { id, userId: currentUser.id });

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });
    
    if (!existingOrder) {
      logger.warn('Order not found for cancellation', { id });
      monitoring.recordCounter('orders.cancel.not_found', 1, { id });
      
      throw new NotFoundError(`Order with ID ${id} not found`);
    }

    // Check authorization - users can only cancel their own orders unless they're admin
    if (existingOrder.userId !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
      logger.warn('Unauthorized order cancellation attempt', {
        id,
        orderUserId: existingOrder.userId,
        currentUserId: currentUser.id,
      });
      monitoring.recordCounter('orders.cancel.unauthorized', 1, { id });
      
      throw new AuthorizationError('Access denied');
    }

    // Check if order can be cancelled
    if (!['PENDING', 'PROCESSING'].includes(existingOrder.status)) {
      throw new ValidationError(`Order cannot be cancelled in ${existingOrder.status} status`);
    }

    // Cancel order
    const cancelledOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    });

    // Restore product stock quantities
    for (const item of existingOrder.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }

    // Remove from cache
    const cacheKey = `order:${id}`;
    sessionCache.delete(cacheKey);

    // Record success metric
    monitoring.recordCounter('orders.cancel.success', 1, { id });
    monitoring.recordTimer('orders.cancel.duration', Date.now() - startTime);

    logger.info('Order cancelled successfully', {
      id,
      userId: currentUser.id,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      { message: 'Order cancelled successfully', order: cancelledOrder },
      { status: 200 }
    );

  } catch (error) {
    logger.error('Failed to cancel order', {
      id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('orders.cancel.errors', 1, { id });

    throw error;
  }
});

// Apply API versioning decorator
export const GET = withApiVersioning(withErrorHandler(GETHandler));
export const PUT = withApiVersioning(withErrorHandler(PUTHandler));
export const DELETE = withApiVersioning(withErrorHandler(DELETEHandler));