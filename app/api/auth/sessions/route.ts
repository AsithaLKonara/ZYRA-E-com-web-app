import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { sessionUtils } from '@/lib/session-manager'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { withApiVersioning } from '@/lib/api-versioning'

// Get user sessions
async function getSessionsHandler(request: NextRequest) {
  try {
    const userId = (request as any).user.id
    const sessions = await sessionUtils.getUserSessions(userId)

    return NextResponse.json({
      success: true,
      sessions: sessions.map(session => ({
        id: session.id,
        expires: session.expiresAt,
        isActive: session.expiresAt > new Date(),
      })),
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to get sessions' },
      { status: 500 }
    )
  }
}

// Revoke all sessions
async function revokeAllSessionsHandler(request: NextRequest) {
  try {
    const userId = (request as any).user.id
    const revokedCount = await sessionUtils.revokeAllUserSessions(userId)

    return NextResponse.json({
      success: true,
      message: `Revoked ${revokedCount} sessions`,
      revokedCount,
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to revoke sessions' },
      { status: 500 }
    )
  }
}

export const GET = withApiVersioning(withErrorHandler(withAuth(getSessionsHandler)))
export const DELETE = withApiVersioning(withErrorHandler(withAuth(revokeAllSessionsHandler)))

