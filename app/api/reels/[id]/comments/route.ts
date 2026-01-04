import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { logger } from '@/lib/logger'

// GET /api/reels/[id]/comments - Get comments for a reel
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const reelId = params.id

    const skip = (page - 1) * limit

    // Check if reel exists
    const reel = await db.adminReel.findUnique({
      where: { id: reelId, status: 'PUBLISHED' }
    })

    if (!reel) {
      return NextResponse.json(
        { error: 'Reel not found' },
        { status: 404 }
      )
    }

    const [comments, total] = await Promise.all([
      db.reelComment.findMany({
        where: { reelId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      db.reelComment.count({ where: { reelId } })
    ])

    return NextResponse.json({
      success: true,
      data: comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    logger.error('Failed to get reel comments:', { error: error instanceof Error ? error.message : String(error) })
    
    return NextResponse.json(
      { 
        error: 'Failed to get comments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/reels/[id]/comments - Create a comment on a reel
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { content, userId } = await request.json()
    const reelId = params.id

    // Validate required fields
    if (!content || !userId) {
      return NextResponse.json(
        { error: 'content and userId are required' },
        { status: 400 }
      )
    }

    // Validate content length
    if (content.length > 500) {
      return NextResponse.json(
        { error: 'Comment too long (max 500 characters)' },
        { status: 400 }
      )
    }

    // Check if reel exists
    const reel = await db.adminReel.findUnique({
      where: { id: reelId, status: 'PUBLISHED' }
    })

    if (!reel) {
      return NextResponse.json(
        { error: 'Reel not found' },
        { status: 404 }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create comment
    const comment = await db.reelComment.create({
      data: {
        content,
        reelId,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    // Update comment count
    await db.adminReel.update({
      where: { id: reelId },
      data: {
        commentCount: { increment: 1 }
      }
    })

    logger.info('Reel comment created', {
      commentId: comment.id,
      reelId,
      userId
    })

    return NextResponse.json({
      success: true,
      data: comment
    })

  } catch (error) {
    logger.error('Failed to create reel comment:', { error: error instanceof Error ? error.message : String(error) })
    
    return NextResponse.json(
      { 
        error: 'Failed to create comment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


