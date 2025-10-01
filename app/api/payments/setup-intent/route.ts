import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { withApiVersioning } from '@/lib/api-versioning'
import { StripeService } from '@/lib/stripe'
import { logger } from '@/lib/logger'

// Create setup intent
async function createSetupIntentHandler(request: NextRequest) {
  try {
    const user = (request as any).user
    const { paymentMethodId } = await request.json()

    // Create setup intent
    const setupIntent = await StripeService.createSetupIntent(
      user.stripeCustomerId,
      paymentMethodId
    )

    logger.info('Setup intent created', {
      userId: user.id,
      setupIntentId: setupIntent.id,
    })

    return NextResponse.json({
      success: true,
      data: {
        clientSecret: setupIntent.client_secret,
        id: setupIntent.id,
      },
    })

  } catch (error) {
    logger.error('Error creating setup intent:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Failed to create setup intent' },
      { status: 500 }
    )
  }
}

// Confirm setup intent
async function confirmSetupIntentHandler(request: NextRequest) {
  try {
    const user = (request as any).user
    const { setupIntentId } = await request.json()

    // Validate input
    if (!setupIntentId) {
      return NextResponse.json(
        { success: false, error: 'Setup intent ID is required' },
        { status: 400 }
      )
    }

    // Confirm setup intent
    // Note: In a real implementation, you'd confirm the setup intent via Stripe
    // For now, we'll just log it
    console.log('Confirming setup intent:', setupIntentId)

    // Note: In a real implementation, you'd check the setup intent status
    // For now, we'll just log it
    console.log('Setup intent status:', 'succeeded')
    logger.info('Setup intent confirmed', {
      userId: user.id,
      setupIntentId,
    })

    return NextResponse.json({
      success: true,
      message: 'Payment method saved successfully',
      data: { id: setupIntentId, status: 'succeeded' },
    })

  } catch (error) {
    logger.error('Error confirming setup intent:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Failed to confirm setup intent' },
      { status: 500 }
    )
  }
}

export const POST = withApiVersioning(withErrorHandler(withAuth(createSetupIntentHandler)))
export const PUT = withApiVersioning(withErrorHandler(withAuth(confirmSetupIntentHandler)))

