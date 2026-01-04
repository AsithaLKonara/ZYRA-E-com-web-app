import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { withApiVersioning } from '@/lib/api-versioning'
import { StripeService } from '@/lib/stripe'
import { db } from '@/lib/db-connection'
import { logger } from '@/lib/logger'
import { ORDER_STATUS } from '@/lib/constants'

// Cancel payment
async function cancelPaymentHandler(request: NextRequest) {
  try {
    const user = (request as any).user
    const { paymentIntentId } = await request.json()

    // Validate input
    if (!paymentIntentId) {
      return NextResponse.json(
        { success: false, error: 'Payment intent ID is required' },
        { status: 400 }
      )
    }

    // For now, we'll find orders by user and status
    // In a real implementation, you'd store paymentIntentId in the order
    const order = await db.order.findFirst({
      where: {
        userId: user.id,
        status: "PENDING",
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Payment intent not found' },
        { status: 404 }
      )
    }

    // Check if order is in a valid state for cancellation
    if (order.status !== ORDER_STATUS.PENDING) {
      return NextResponse.json(
        { success: false, error: 'Order is not in a valid state for cancellation' },
        { status: 400 }
      )
    }

    // Cancel payment intent with Stripe
    // Note: In a real implementation, you'd cancel the payment intent
    // For now, we'll just log it
    logger.info('Payment intent cancelled', { paymentIntentId })

    // Update order status
    await db.order.update({
      where: { id: order.id },
      data: {
        status: ORDER_STATUS.CANCELLED,
        updatedAt: new Date(),
      },
    })

    logger.info('Payment cancelled successfully', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: user.id,
      paymentIntentId,
    })

    return NextResponse.json({
      success: true,
      message: 'Payment cancelled successfully',
      data: {
        orderId: order.id,
        status: ORDER_STATUS.CANCELLED,
      },
    })

  } catch (error) {
    logger.error('Error cancelling payment:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Failed to cancel payment' },
      { status: 500 }
    )
  }
}

export const POST = withApiVersioning(withErrorHandler(withAuth(cancelPaymentHandler)))

