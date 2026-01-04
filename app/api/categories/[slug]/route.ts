import { NextRequest, NextResponse } from 'next/server'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { withApiVersioning } from '@/lib/api-versioning'
import { db } from '@/lib/db-connection'
import { logger } from '@/lib/logger'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/lib/constants'

// Get category by slug with products
async function getCategoryHandler(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const categorySlug = params.slug
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(
      parseInt(searchParams.get('limit') || DEFAULT_PAGE_SIZE.toString()),
      MAX_PAGE_SIZE
    )
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const featured = searchParams.get('featured')

    // Get category
    const category = await db.category.findUnique({
      where: { slug: categorySlug },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            image: true,
          },
        },
      },
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Build products where clause
    const where: any = {
      categoryId: category.id,
      isActive: true,
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) {
        where.price.gte = parseFloat(minPrice)
      }
      if (maxPrice) {
        where.price.lte = parseFloat(maxPrice)
      }
    }

    // Featured filter
    if (featured === 'true') {
      where.isFeatured = true
    }

    // Build order by clause
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // Get products with pagination
    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      db.product.count({ where }),
    ])

    // Calculate average ratings
    const productsWithRatings = products.map(product => {
      const ratings = product.reviews.map(review => review.rating)
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0

      return {
        ...product,
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: ratings.length,
        reviews: undefined, // Remove reviews from response
      }
    })

    logger.info('Category fetched', {
      categorySlug,
      page,
      limit,
      total,
    })

    return NextResponse.json({
      success: true,
      data: {
        category,
        products: productsWithRatings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })

  } catch (error) {
    logger.error('Error fetching category:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

export const GET = withApiVersioning(withErrorHandler(getCategoryHandler))




