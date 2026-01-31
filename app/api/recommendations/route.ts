import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { PrismaClient } from "@prisma/client"
import { z } from "zod"
import { logger } from "@/lib/logger"

import { db as prisma } from '@/lib/database'

const recommendationSchema = z.object({
  type: z.enum(['similar', 'trending', 'personalized', 'frequently_bought', 'new_arrivals']),
  productId: z.string().optional(),
  userId: z.string().optional(),
  limit: z.number().min(1).max(50).default(10),
  category: z.string().optional(),
  excludeIds: z.array(z.string()).optional()
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const params = {
      type: searchParams.get('type') || 'trending',
      productId: searchParams.get('productId') || undefined,
      userId: searchParams.get('userId') || undefined,
      limit: parseInt(searchParams.get('limit') || '10'),
      category: searchParams.get('category') || undefined,
      excludeIds: searchParams.get('excludeIds')?.split(',') || []
    }

    const validatedParams = recommendationSchema.parse(params)
    const recommendations = await getRecommendations(validatedParams)

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        type: validatedParams.type,
        count: recommendations.length
      }
    })

  } catch (error) {
    logger.error("Recommendations error", {}, error instanceof Error ? error : undefined)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "Invalid parameters",
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: "Failed to get recommendations"
    }, { status: 500 })
  }
}

async function getRecommendations(params: z.infer<typeof recommendationSchema>) {
  const { type, productId, userId, limit, category, excludeIds = [] } = params

  let where: any = {
    inStock: true,
    ...(excludeIds.length > 0 && { id: { notIn: excludeIds } }),
    ...(category && { category: { equals: category, mode: 'insensitive' } })
  }

  let orderBy: any = {}

  switch (type) {
    case 'similar':
      if (!productId) {
        throw new Error('Product ID required for similar recommendations')
      }

      // Get the target product to find similar ones
      const targetProduct = await prisma.product.findUnique({
        where: { id: productId },
        select: { category: true, tags: true, price: true }
      })

      if (!targetProduct) {
        return []
      }

      // Find products with similar category, brand, or tags
      where = {
        ...where,
        id: { not: productId },
        OR: [
          { category: { equals: targetProduct.category, mode: 'insensitive' } },
          { tags: { hasSome: targetProduct.tags } }
        ]
      }

      // Order by similarity (same category first, then brand, then price proximity)
      orderBy = [
        { category: 'asc' },
        { brand: 'asc' },
        { rating: 'desc' }
      ]
      break

    case 'trending':
      // Products with high sales and recent activity
      orderBy = [
        { rating: 'desc' },
        { reviewCount: 'desc' },
        { createdAt: 'desc' }
      ]
      break

    case 'personalized':
      if (!userId) {
        // Fallback to trending if no user
        orderBy = [
          { rating: 'desc' },
          { reviewCount: 'desc' },
          { createdAt: 'desc' }
        ]
      } else {
        // Get user's purchase history and preferences
        const userOrders = await prisma.order.findMany({
          where: { userId },
          include: {
            items: {
              include: {
                product: {
                  select: { category: true, tags: true }
                }
              }
            }
          }
        })

        // Extract user preferences
        const categories = userOrders.flatMap(order =>
          order.items.map(item => item.product.category)
        )
        // Note: Brand field doesn't exist in Product model
        // const brands = userOrders.flatMap(order =>
        //   order.items.map(item => item.product.brand)
        // )
        const tags = userOrders.flatMap(order =>
          order.items.flatMap(item => item.product.tags)
        )

        // Find most common preferences
        const categoryCounts = categories.reduce((acc, cat) => {
          const catId = cat.id
          acc[catId] = (acc[catId] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        // Note: Brand field doesn't exist in Product model
        // const brandCounts = brands.reduce((acc, brand) => {
        //   acc[brand] = (acc[brand] || 0) + 1
        //   return acc
        // }, {} as Record<string, number>)

        const topCategories = Object.entries(categoryCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([cat]) => cat)

        // Note: Brand field doesn't exist in Product model
        // const topBrands = Object.entries(brandCounts)
        //   .sort(([,a], [,b]) => b - a)
        //   .slice(0, 3)
        //   .map(([brand]) => brand)

        if (topCategories.length > 0) {
          where.OR = [
            ...(topCategories.length > 0 ? [{ categoryId: { in: topCategories } }] : [])
          ]
        }

        orderBy = [
          { rating: 'desc' },
          { reviewCount: 'desc' },
          { createdAt: 'desc' }
        ]
      }
      break

    case 'frequently_bought':
      // Products that are frequently bought together
      // This would require order analysis in a real implementation
      orderBy = [
        { reviewCount: 'desc' },
        { rating: 'desc' },
        { createdAt: 'desc' }
      ]
      break

    case 'new_arrivals':
      where.isNew = true
      orderBy = { createdAt: 'desc' }
      break

    default:
      orderBy = { createdAt: 'desc' }
  }

  const recommendations = await prisma.product.findMany({
    where,
    orderBy,
    take: limit,
    include: {
      reviews: {
        select: {
          rating: true,
          createdAt: true
        }
      }
    }
  })

  return recommendations
}
