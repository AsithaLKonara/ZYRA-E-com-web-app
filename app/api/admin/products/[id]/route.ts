export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth-middleware'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { withApiVersioning } from '@/lib/api-versioning'
import { db } from '@/lib/db-connection'
import { logger } from '@/lib/logger'

// Get product by ID (admin)
async function getProductHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id

    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            orderItems: true,
            wishlistItems: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Calculate average rating
    const ratings = product.reviews.map(review => review.rating)
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
      : 0

    const productWithStats = {
      ...product,
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: ratings.length,
      totalSales: product._count.orderItems,
      wishlistCount: product._count.wishlistItems,
      _count: undefined,
    }

    logger.info('Admin product fetched', { productId })

    return NextResponse.json({
      success: true,
      data: productWithStats,
    })

  } catch (error) {
    logger.error('Error fetching admin product:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// Update product (admin)
async function updateProductHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id
    const updateData = await request.json()

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id: productId },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if SKU is being changed and if it already exists
    if (updateData.sku && updateData.sku !== existingProduct.sku) {
      const skuExists = await db.product.findUnique({
        where: { sku: updateData.sku },
      })

      if (skuExists) {
        return NextResponse.json(
          { success: false, error: 'SKU already exists' },
          { status: 409 }
        )
      }
    }

    // Generate new slug if name is being updated
    if (updateData.name && updateData.name !== existingProduct.name) {
      updateData.slug = updateData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    }

    // Update product
    const updatedProduct = await db.product.update({
      where: { id: productId },
      data: {
        ...updateData,
        updatedAt: new Date(),
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

    logger.info('Product updated', {
      productId,
      name: updatedProduct.name,
    })

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    })

  } catch (error) {
    logger.error('Error updating product:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// Delete product (admin)
async function deleteProductHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if product has orders
    const orderCount = await db.orderItem.count({
      where: { productId },
    })

    if (orderCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete product with existing orders' },
        { status: 400 }
      )
    }

    // Delete product
    await db.product.delete({
      where: { id: productId },
    })

    logger.info('Product deleted', {
      productId,
      name: product.name,
    })

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    })

  } catch (error) {
    logger.error('Error deleting product:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}

export const GET = withApiVersioning(withErrorHandler(withAdminAuth(getProductHandler)))
export const PUT = withApiVersioning(withErrorHandler(withAdminAuth(updateProductHandler)))
export const DELETE = withApiVersioning(withErrorHandler(withAdminAuth(deleteProductHandler)))




