import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { logger } from '@/lib/logger'
import { ReelStatus } from '@prisma/client'

// GET /api/reels - Get reels for users (TikTok-style feed)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const userId = searchParams.get('userId')
    const featured = searchParams.get('featured') === 'true'

    const skip = (page - 1) * limit

    // Build where clause
    const where = {
      status: 'PUBLISHED' as ReelStatus,
      ...(featured && { featured: true })
    }

    const [reels, total] = await Promise.all([
      db.adminReel.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: true,
                  slug: true
                }
              }
            }
          },
          hashtags: true,
          interactions: userId ? {
            where: { userId }
          } : false,
          _count: {
            select: {
              interactions: true,
              comments: true
            }
          }
        },
        orderBy: [
          { featured: 'desc' },
          { trendingScore: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      db.adminReel.count({ where })
    ])

    // Transform data for frontend
    const transformedReels = reels.map(reel => ({
      id: reel.id,
      title: reel.title,
      description: reel.description,
      videoUrl: reel.videoUrl,
      thumbnailUrl: reel.thumbnailUrl,
      duration: reel.duration,
      viewCount: reel.viewCount,
      likeCount: reel.likeCount,
      commentCount: reel.commentCount,
      shareCount: reel.shareCount,
      featured: reel.featured,
      trendingScore: reel.trendingScore,
      createdAt: reel.createdAt,
      publishedAt: reel.publishedAt,
      admin: reel.admin,
      products: reel.products.map(rp => ({
        id: rp.product.id,
        name: rp.product.name,
        price: rp.product.price,
        images: rp.product.images,
        slug: rp.product.slug,
        position: {
          x: rp.positionX,
          y: rp.positionY
        }
      })),
      hashtags: reel.hashtags.map(h => h.hashtag),
      userInteractions: reel.interactions || [],
      stats: {
        totalInteractions: reel._count.interactions,
        totalComments: reel._count.comments
      }
    }))

    return NextResponse.json({
      success: true,
      data: transformedReels,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    logger.error('Failed to get reels:', { error: error instanceof Error ? error.message : String(error) })
    
    return NextResponse.json(
      { 
        error: 'Failed to get reels',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


