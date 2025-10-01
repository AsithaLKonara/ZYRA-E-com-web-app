import { NextRequest, NextResponse } from 'next/server'
import { withOptionalAuth } from '@/lib/auth-middleware'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { withApiVersioning } from '@/lib/api-versioning'
import { db } from '@/lib/db-connection'
import { logger } from '@/lib/logger'
import { SEARCH } from '@/lib/constants'

// Search products and categories
async function searchHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'all' // all, products, categories
    const limit = Math.min(
      parseInt(searchParams.get('limit') || SEARCH.MAX_RESULTS.toString()),
      SEARCH.MAX_RESULTS
    )

    if (!query || query.length < SEARCH.MIN_QUERY_LENGTH) {
      return NextResponse.json({
        success: true,
        data: {
          products: [],
          categories: [],
          suggestions: [],
        },
        query,
      })
    }

    const results: any = {
      products: [],
      categories: [],
      suggestions: [],
    }

    // Search products
    if (type === 'all' || type === 'products') {
      const products = await db.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { tags: { has: query } },
            { sku: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        take: limit,
        orderBy: [
          { isFeatured: 'desc' },
          { name: 'asc' },
        ],
      })

      // Calculate average ratings
      results.products = products.map(product => {
        const ratings = product.reviews.map(review => review.rating)
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
          : 0

        return {
          ...product,
          averageRating: Math.round(averageRating * 10) / 10,
          reviewCount: ratings.length,
          reviews: undefined,
        }
      })
    }

    // Search categories
    if (type === 'all' || type === 'categories') {
      results.categories = await db.category.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          image: true,
        },
        take: limit,
        orderBy: { name: 'asc' },
      })
    }

    // Generate suggestions
    if (type === 'all') {
      const suggestions = await db.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { tags: { has: query } },
          ],
        },
        select: {
          name: true,
          tags: true,
        },
        take: SEARCH.SUGGESTIONS_LIMIT,
        distinct: ['name'],
      })

      results.suggestions = suggestions.map(product => ({
        name: product.name,
        tags: product.tags,
      }))
    }

    logger.info('Search performed', {
      query,
      type,
      limit,
      resultsCount: {
        products: results.products.length,
        categories: results.categories.length,
        suggestions: results.suggestions.length,
      },
    })

    return NextResponse.json({
      success: true,
      data: results,
      query,
    })

  } catch (error) {
    logger.error('Error performing search:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    )
  }
}

export const GET = withApiVersioning(withErrorHandler(withOptionalAuth(searchHandler)))




