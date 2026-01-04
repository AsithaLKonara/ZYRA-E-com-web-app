import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { sessionUtils } from '@/lib/session-manager'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { withApiVersioning } from '@/lib/api-versioning'
import { db } from '@/lib/db-connection'

// Revoke specific session
async function revokeSessionHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = (request as any).user.id
    const sessionId = params.id

    // Check if session belongs to user
    const session = await db.session.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      )
    }

    // Delete session
    await db.session.delete({
      where: { id: sessionId },
    })

    return NextResponse.json({
      success: true,
      message: 'Session revoked successfully',
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to revoke session' },
      { status: 500 }
    )
  }
}

export const DELETE = withApiVersioning(withErrorHandler(withAuth(revokeSessionHandler)))




