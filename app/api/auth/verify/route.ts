import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { sessionUtils } from '@/lib/session-manager'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { withApiVersioning } from '@/lib/api-versioning'

// Verify authentication status
async function verifyHandler(request: NextRequest) {
  try {
    const user = (request as any).user
    const session = await sessionUtils.getCurrentSession()

    if (!session || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Validate session
    const validation = await sessionUtils.validateSession(session.id)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      },
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    )
  }
}

export const GET = withApiVersioning(withErrorHandler(withAuth(verifyHandler)))




