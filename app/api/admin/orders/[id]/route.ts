import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth-middleware'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { withApiVersioning } from '@/lib/api-versioning'
import { db } from '@/lib/db-connection'
import { logger } from '@/lib/logger'
import { ORDER_STATUS } from '@/lib/constants'

// Get order by ID (admin)
async function getOrderHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id

    const order = await db.order.findUnique({
      where: { id: orderId },
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
                sku: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    logger.info('Admin order fetched', { orderId })

    return NextResponse.json({
      success: true,
      data: order,
    })

  } catch (error) {
    logger.error('Error fetching admin order:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

// Update order status (admin)
async function updateOrderHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id
    const { status, notes } = await request.json()

    // Validate status
    if (!status || !Object.values(ORDER_STATUS).includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order status' },
        { status: 400 }
      )
    }

    // Check if order exists
    const existingOrder = await db.order.findUnique({
      where: { id: orderId },
    })

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Update order
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        status,
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
                slug: true,
                images: true,
              },
            },
          },
        },
      },
    })

    // Log status change
    logger.info('Order status updated', {
      orderId,
      orderNumber: updatedOrder.orderNumber,
      oldStatus: existingOrder.status,
      newStatus: status,
      notes,
    })

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrder,
    })

  } catch (error) {
    logger.error('Error updating order:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    )
  }
}

// Cancel order (admin)
async function cancelOrderHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id
    const { reason } = await request.json()

    // Check if order exists
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                stock: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if order can be cancelled
    if (order.status === ORDER_STATUS.CANCELLED) {
      return NextResponse.json(
        { success: false, error: 'Order is already cancelled' },
        { status: 400 }
      )
    }

    if (order.status === ORDER_STATUS.DELIVERED) {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel delivered order' },
        { status: 400 }
      )
    }

    // Update order status
    await db.order.update({
      where: { id: orderId },
      data: {
        status: ORDER_STATUS.CANCELLED,
        updatedAt: new Date(),
      },
    })

    // Restore product stock
    for (const item of order.items) {
      await db.product.update({
        where: { id: item.product.id },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      })
    }

    logger.info('Order cancelled', {
      orderId,
      orderNumber: order.orderNumber,
      reason,
    })

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
    })

  } catch (error) {
    logger.error('Error cancelling order:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Failed to cancel order' },
      { status: 500 }
    )
  }
}

export const GET = withApiVersioning(withErrorHandler(withAdminAuth(getOrderHandler)))
export const PUT = withApiVersioning(withErrorHandler(withAdminAuth(updateOrderHandler)))
export const DELETE = withApiVersioning(withErrorHandler(withAdminAuth(cancelOrderHandler)))

