import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, deactivateUser } from '@/lib/auth-utils'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { rateLimiter } from '@/lib/rate-limiter'

// Deactivate user account endpoint
async function deactivateHandler(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = rateLimiter.middleware(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Deactivate user account
    const success = await deactivateUser(user.id)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to deactivate account' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Account deactivated successfully',
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to deactivate account' },
      { status: 500 }
    )
  }
}

export const POST = withCORS(withErrorHandler(deactivateHandler))




