import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, updateUserProfile } from '@/lib/auth-utils'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { rateLimiter } from '@/lib/rate-limiter'

// Get user profile
async function getProfileHandler(request: NextRequest) {
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

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      },
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to get profile' },
      { status: 500 }
    )
  }
}

// Update user profile
async function updateProfileHandler(request: NextRequest) {
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

    const { name, avatar } = await request.json()

    // Validate input
    if (name && typeof name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Name must be a string' },
        { status: 400 }
      )
    }

    if (avatar && typeof avatar !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Avatar must be a string' },
        { status: 400 }
      )
    }

    // Update profile
    const updatedUser = await updateUserProfile(user.id, {
      name: name || undefined,
      avatar: avatar || undefined,
    })

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

export const GET = withCORS(withErrorHandler(getProfileHandler))
export const PATCH = withCORS(withErrorHandler(updateProfileHandler))




