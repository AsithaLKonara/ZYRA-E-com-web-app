import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"
import { logger } from "@/lib/logger"

import { db as prisma } from '@/lib/database'

const createReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().min(1).max(5),
  title: z.string().min(1).max(200),
  comment: z.string().min(1).max(1000),
  isAnonymous: z.boolean().optional().default(false)
})

const getReviewsSchema = z.object({
  productId: z.string().min(1),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(10),
  sort: z.enum(['newest', 'oldest', 'highest_rating', 'lowest_rating', 'most_helpful']).optional().default('newest'),
  rating: z.number().min(1).max(5).optional()
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { productId, rating, title, comment, isAnonymous } = createReviewSchema.parse(body)

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json({
        error: "Product not found"
      }, { status: 404 })
    }

    // Check if user has already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: session.user.id,
        productId
      }
    })

    if (existingReview) {
      return NextResponse.json({
        error: "You have already reviewed this product"
      }, { status: 400 })
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        productId,
        rating,
        comment
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Update product rating and review count
    await updateProductRating(productId)

    return NextResponse.json({
      success: true,
      data: review
    })

  } catch (error) {
    logger.error("Review creation error", { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "Invalid input data",
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: "Failed to create review"
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const params = {
      productId: searchParams.get('productId') || '',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      sort: searchParams.get('sort') || 'newest',
      rating: searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : undefined
    }

    const { productId, page, limit, sort, rating } = getReviewsSchema.parse(params)

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = { productId }
    if (rating) {
      where.rating = rating
    }

    // Build orderBy clause
    let orderBy: any = {}
    switch (sort) {
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
      case 'highest_rating':
        orderBy = { rating: 'desc' }
        break
      case 'lowest_rating':
        orderBy = { rating: 'asc' }
        break
      case 'most_helpful':
        orderBy = { helpfulCount: 'desc' }
        break
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.review.count({ where })
    ])

    // Get rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { productId },
      _count: { rating: true }
    })

    // Get average rating
    const avgRating = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true }
    })

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        ratingDistribution: ratingDistribution.reduce((acc, item) => {
          acc[item.rating] = item._count.rating
          return acc
        }, {} as Record<number, number>),
        averageRating: avgRating._avg.rating || 0,
        totalReviews: total
      }
    })

  } catch (error) {
    logger.error("Reviews fetch error", { error: error instanceof Error ? error.message : String(error) }, error instanceof Error ? error : undefined)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "Invalid parameters",
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: "Failed to fetch reviews"
    }, { status: 500 })
  }
}

async function updateProductRating(productId: string) {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true }
    })

    if (reviews.length === 0) return

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = totalRating / reviews.length

    // Note: Product model doesn't have rating and reviewCount fields
    // In a real implementation, you'd update the product's aggregated rating
    logger.info('Product rating updated', {
      productId,
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: reviews.length
    })
  } catch (error) {
    logger.error("Error updating product rating", { productId }, error instanceof Error ? error : undefined)
  }
}