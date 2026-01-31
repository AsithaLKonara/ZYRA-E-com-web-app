export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { videoProcessor } from '@/lib/video-processing'
import { config } from '@/lib/config'
import { logger } from '@/lib/logger'
import { ReelStatus } from '@prisma/client'
import { promises as fs } from 'fs'
import { join } from 'path'

// GET /api/admin/reels - Get all admin reels
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') as ReelStatus | null
    const featured = searchParams.get('featured') === 'true'

    const skip = (page - 1) * limit

    const where = {
      ...(status && { status }),
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
              email: true
            }
          },
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: true
                }
              }
            }
          },
          hashtags: true,
          _count: {
            select: {
              interactions: true,
              comments: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      db.adminReel.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: reels,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    logger.error('Failed to get admin reels:', { error: error instanceof Error ? error.message : String(error) })
    
    return NextResponse.json(
      { 
        error: 'Failed to get admin reels',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/admin/reels - Create new admin reel
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const { requireAdmin } = await import('@/lib/auth-utils')
    const currentUser = await requireAdmin().catch(() => null)
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const videoFile = formData.get('video') as File
    const productIds = formData.get('productIds') as string
    const hashtags = formData.get('hashtags') as string

    // Validate required fields
    if (!title || !videoFile) {
      return NextResponse.json(
        { error: 'Title and video file are required' },
        { status: 400 }
      )
    }

    // Use authenticated admin ID
    const adminId = currentUser.id

    // Create temporary file path
    const tempDir = join(config.video.storagePath, 'temp')
    await fs.mkdir(tempDir, { recursive: true })
    
    const tempPath = join(tempDir, `temp_${Date.now()}_${videoFile.name}`)
    
    // Save uploaded file
    const arrayBuffer = await videoFile.arrayBuffer()
    await fs.writeFile(tempPath, Buffer.from(arrayBuffer))

    try {
      // Process video
      const processingResult = await videoProcessor.processVideo({
        inputPath: tempPath,
        outputDir: join(config.video.storagePath, 'processed'),
        generateThumbnails: true,
        generateMultipleResolutions: true
      })

      // Create reel record
      const reel = await db.adminReel.create({
        data: {
          title,
          description: description || null,
          videoUrl: processingResult.processedPath || processingResult.outputPath || '',
          thumbnailUrl: processingResult.thumbnailPath || null,
          duration: Math.round(processingResult.metadata?.duration || 0),
          fileSize: processingResult.metadata?.fileSize || 0,
          status: 'PROCESSING',
          adminId,
          products: productIds ? {
            create: productIds.split(',').map((productId, index) => ({
              productId: productId.trim(),
              positionX: 0.5,
              positionY: 0.5 + (index * 0.1) // Stack products vertically
            }))
          } : undefined,
          hashtags: hashtags ? {
            create: hashtags.split(',').map(hashtag => ({
              hashtag: hashtag.trim().replace('#', '')
            }))
          } : undefined
        },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: true
                }
              }
            }
          },
          hashtags: true
        }
      })

      // Update status to published after successful processing
      await db.adminReel.update({
        where: { id: reel.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date()
        }
      })

      // Clean up temporary file
      await fs.unlink(tempPath)

      logger.info('Admin reel created successfully', {
        reelId: reel.id,
        title,
        adminId
      })

      return NextResponse.json({
        success: true,
        data: reel
      })

    } catch (processingError) {
      // Clean up temporary file on error
      await fs.unlink(tempPath).catch(() => {})
      
      logger.error('Video processing failed:', { error: processingError instanceof Error ? processingError.message : String(processingError) })
      
      return NextResponse.json(
        { 
          error: 'Video processing failed',
          details: processingError instanceof Error ? processingError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    logger.error('Failed to create admin reel:', { error: error instanceof Error ? error.message : String(error) })
    
    return NextResponse.json(
      { 
        error: 'Failed to create admin reel',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

