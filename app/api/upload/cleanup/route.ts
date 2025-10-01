import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { withApiVersioning } from '@/lib/api-versioning'
import { cleanupTempFiles } from '@/lib/blob-storage'
import { logger } from '@/lib/logger'

// Cleanup temporary files
async function cleanupFilesHandler(request: NextRequest) {
  try {
    const user = (request as any).user
    
    // Only admins can cleanup files
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const olderThanHours = parseInt(searchParams.get('olderThanHours') || '24')

    // Validate input
    if (olderThanHours < 1 || olderThanHours > 168) { // 1 hour to 1 week
      return NextResponse.json(
        { success: false, error: 'olderThanHours must be between 1 and 168' },
        { status: 400 }
      )
    }

    // Cleanup files
    const cutoffDate = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000))
    const filesDeleted = await cleanupTempFiles(cutoffDate)

    logger.info('Temporary files cleanup completed', {
      userId: user.id,
      olderThanHours,
      deletedCount: filesDeleted,
    })

    return NextResponse.json({
      success: true,
      message: 'Temporary files cleanup completed',
      data: {
        deletedCount: filesDeleted,
        olderThanHours,
      },
    })

  } catch (error) {
    logger.error('File cleanup error:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'File cleanup failed' },
      { status: 500 }
    )
  }
}

export const POST = withApiVersioning(withErrorHandler(withAuth(cleanupFilesHandler)))

