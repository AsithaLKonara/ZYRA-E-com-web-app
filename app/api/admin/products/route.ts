import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth-middleware'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { withApiVersioning } from '@/lib/api-versioning'
import { db } from '@/lib/db-connection'
import { logger } from '@/lib/logger'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/lib/constants'

// Get all products (admin)
async function getProductsHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(
      parseInt(searchParams.get('limit') || DEFAULT_PAGE_SIZE.toString()),
      MAX_PAGE_SIZE
    )
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.category = {
        slug: category,
      }
    }

    if (status) {
      if (status === 'active') {
        where.isActive = true
      } else if (status === 'inactive') {
        where.isActive = false
      } else if (status === 'out-of-stock') {
        where.stock = 0
      }
    }

    // Build order by clause
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // Get products with pagination
    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
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
          _count: {
            select: {
              orderItems: true,
              wishlistItems: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      db.product.count({ where }),
    ])

    // Calculate average ratings and sales data
    const productsWithStats = products.map(product => {
      const ratings = product.reviews.map(review => review.rating)
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0

      return {
        ...product,
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: ratings.length,
        totalSales: product._count.orderItems,
        wishlistCount: product._count.wishlistItems,
        reviews: undefined, // Remove reviews from response
        _count: undefined, // Remove _count from response
      }
    })

    logger.info('Admin products fetched', {
      page,
      limit,
      total,
      search,
      category,
      status,
    })

    return NextResponse.json({
      success: true,
      data: productsWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })

  } catch (error) {
    logger.error('Error fetching admin products:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// Create product (admin)
async function createProductHandler(request: NextRequest) {
  try {
    const {
      name,
      description,
      price,
      originalPrice,
      sku,
      stock,
      images,
      tags,
      categoryId,
      isFeatured = false,
    } = await request.json()

    // Validate input
    if (!name || !price || !sku || !categoryId) {
      return NextResponse.json(
        { success: false, error: 'Name, price, SKU, and category are required' },
        { status: 400 }
      )
    }

    // Check if SKU already exists
    const existingProduct = await db.product.findUnique({
      where: { sku },
    })

    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: 'SKU already exists' },
        { status: 409 }
      )
    }

    // Check if category exists
    const category = await db.category.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Create product
    const product = await db.product.create({
      data: {
        name,
        slug,
        description,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        sku,
        stock: parseInt(stock) || 0,
        images: images || [],
        tags: tags || [],
        categoryId,
        isFeatured: Boolean(isFeatured),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    logger.info('Product created', {
      productId: product.id,
      name: product.name,
      sku: product.sku,
    })

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      data: product,
    })

  } catch (error) {
    logger.error('Error creating product:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    )
  }
}

export const GET = withApiVersioning(withErrorHandler(withAdminAuth(getProductsHandler)))
export const POST = withApiVersioning(withErrorHandler(withAdminAuth(createProductHandler)))




