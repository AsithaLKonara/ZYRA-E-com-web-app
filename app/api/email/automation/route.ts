import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { withApiVersioning } from '@/lib/api-versioning'
import { triggerAutomation } from '@/lib/email-automation'
import { logger } from '@/lib/logger'

// Trigger email automation
async function triggerAutomationHandler(request: NextRequest) {
  try {
    const user = (request as any).user
    
    // Only admins can trigger email automation
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { trigger, data } = await request.json()

    // Validate input
    if (!trigger) {
      return NextResponse.json(
        { success: false, error: 'Trigger is required' },
        { status: 400 }
      )
    }

    // Validate trigger type
    const validTriggers = [
      'user_registration',
      'order_created',
      'order_shipped',
      'order_delivered',
      'order_cancelled',
      'payment_failed',
      'review_reminder',
      'abandoned_cart',
      'low_stock_alert',
      'price_drop_alert',
    ]

    if (!validTriggers.includes(trigger)) {
      return NextResponse.json(
        { success: false, error: 'Invalid trigger type' },
        { status: 400 }
      )
    }

    // Trigger automation
    await triggerAutomation(trigger, data || {})

    logger.info('Email automation triggered', {
      userId: user.id,
      trigger,
      data,
    })

    return NextResponse.json({
      success: true,
      message: 'Email automation triggered successfully',
    })

  } catch (error) {
    logger.error('Error triggering email automation:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Failed to trigger email automation' },
      { status: 500 }
    )
  }
}

export const POST = withApiVersioning(withErrorHandler(withAuth(triggerAutomationHandler)))

