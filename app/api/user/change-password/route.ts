import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, changePassword } from '@/lib/auth-utils'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { rateLimiter } from '@/lib/rate-limiter'
import { validatePasswordStrength } from '@/lib/security'

// Change password endpoint
async function changePasswordHandler(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = rateLimiter.middleware()(request)
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

    const { currentPassword, newPassword } = await request.json()

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    // Validate new password strength
    const passwordStrength = validatePasswordStrength(newPassword)
    if (!passwordStrength.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'New password does not meet requirements',
          details: passwordStrength.feedback
        },
        { status: 400 }
      )
    }

    // Change password
    const result = await changePassword(user.id, currentPassword, newPassword)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to change password' },
      { status: 500 }
    )
  }
}

export const POST = withCORS(withErrorHandler(changePasswordHandler))




