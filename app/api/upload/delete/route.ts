import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { deleteFiles } from '@/lib/blob-storage'
import { logger } from '@/lib/logger'

// Delete files
async function deleteFilesHandler(request: NextRequest) {
  try {
    const user = (request as any).user
    const { urls } = await request.json()

    // Validate input
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'URLs array is required' },
        { status: 400 }
      )
    }

    // Validate URLs
    const validUrls = urls.filter((url: string) => {
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    })

    if (validUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid URLs provided' },
        { status: 400 }
      )
    }

    // Delete files
    try {
      await deleteFiles(validUrls)
      logger.info('Files deleted successfully', {
        userId: user.id,
        deletedCount: validUrls.length
      })
    } catch (deleteError) {
      logger.error('Failed to delete files', {
        userId: user.id,
        error: deleteError instanceof Error ? deleteError.message : String(deleteError)
      })
      return NextResponse.json(
        { success: false, error: 'Failed to delete files' },
        { status: 500 }
      )
    }

    logger.info('Files deleted', {
      userId: user.id,
      totalCount: validUrls.length,
      successCount: validUrls.length,
      failedCount: 0,
    })

    return NextResponse.json({
      success: true,
      message: 'Files deleted successfully',
      data: {
        summary: {
          total: validUrls.length,
          successful: validUrls.length,
          failed: 0,
        },
      },
    })

  } catch (error) {
    logger.error('File deletion error:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'File deletion failed' },
      { status: 500 }
    )
  }
}

export const DELETE = withErrorHandler(withAuth(deleteFilesHandler))

