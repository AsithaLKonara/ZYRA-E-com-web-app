import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { logger } from '@/lib/logger'
import { ReelInteractionType } from '@prisma/client'

// POST /api/reels/[id]/interactions - Create interaction (like, view, share)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { interactionType, userId } = await request.json()
    const reelId = params.id

    // Validate required fields
    if (!interactionType || !userId) {
      return NextResponse.json(
        { error: 'interactionType and userId are required' },
        { status: 400 }
      )
    }

    // Validate interaction type
    if (!Object.values(ReelInteractionType).includes(interactionType)) {
      return NextResponse.json(
        { error: 'Invalid interaction type' },
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

    // Handle different interaction types
    let interaction
    let updateData: any = {}

    switch (interactionType) {
      case 'VIEW':
        // For views, we just increment the counter (no unique constraint)
        updateData = { viewCount: { increment: 1 } }
        break

      case 'LIKE':
        // For likes, check if already liked
        const existingLike = await db.reelInteraction.findUnique({
          where: {
            reelId_userId_interactionType: {
              reelId,
              userId,
              interactionType: 'LIKE'
            }
          }
        })

        if (existingLike) {
          // Unlike
          await db.reelInteraction.delete({
            where: { id: existingLike.id }
          })
          updateData = { likeCount: { decrement: 1 } }
        } else {
          // Like
          interaction = await db.reelInteraction.create({
            data: {
              reelId,
              userId,
              interactionType: 'LIKE'
            }
          })
          updateData = { likeCount: { increment: 1 } }
        }
        break

      case 'SHARE':
        // For shares, just increment counter
        updateData = { shareCount: { increment: 1 } }
        break

      default:
        return NextResponse.json(
          { error: 'Unsupported interaction type' },
          { status: 400 }
        )
    }

    // Update reel counters
    await db.adminReel.update({
      where: { id: reelId },
      data: updateData
    })

    // Get updated counts
    const updatedReel = await db.adminReel.findUnique({
      where: { id: reelId },
      select: {
        viewCount: true,
        likeCount: true,
        shareCount: true,
        commentCount: true
      }
    })

    logger.info('Reel interaction created', {
      reelId,
      userId,
      interactionType,
      interactionId: interaction?.id
    })

    return NextResponse.json({
      success: true,
      data: {
        interaction,
        counts: updatedReel
      }
    })

  } catch (error) {
    logger.error('Failed to create reel interaction:', { error: error instanceof Error ? error.message : String(error) })
    
    return NextResponse.json(
      { 
        error: 'Failed to create interaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET /api/reels/[id]/interactions - Get user's interactions with a reel
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const reelId = params.id

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const interactions = await db.reelInteraction.findMany({
      where: {
        reelId,
        userId
      },
      select: {
        id: true,
        interactionType: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: interactions
    })

  } catch (error) {
    logger.error('Failed to get reel interactions:', { error: error instanceof Error ? error.message : String(error) })
    
    return NextResponse.json(
      { 
        error: 'Failed to get interactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


