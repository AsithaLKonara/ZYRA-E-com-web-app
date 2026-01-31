export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth-middleware'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { withApiVersioning } from '@/lib/api-versioning'
import { db } from '@/lib/db-connection'
import { logger } from '@/lib/logger'

// Get product inventory details
async function getProductInventoryHandler(
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

    // Get recent stock movements (if you have a stock_movements table)
    // For now, we'll calculate some basic metrics
    const totalSales = product._count.orderItems
    const wishlistCount = product._count.wishlistItems

    // Calculate stock turnover rate (simplified)
    const stockTurnoverRate = product.stock > 0 ? totalSales / product.stock : 0

    const inventoryData = {
      ...product,
      totalSales,
      wishlistCount,
      stockTurnoverRate: Math.round(stockTurnoverRate * 100) / 100,
      _count: undefined,
    }

    logger.info('Product inventory details fetched', { productId })

    return NextResponse.json({
      success: true,
      data: inventoryData,
    })

  } catch (error) {
    logger.error('Error fetching product inventory:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product inventory' },
      { status: 500 }
    )
  }
}

// Update product stock
async function updateProductStockHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id
    const { stock, operation, reason, notes } = await request.json()

    if (stock === undefined) {
      return NextResponse.json(
        { success: false, error: 'Stock value is required' },
        { status: 400 }
      )
    }

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, stock: true },
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    let newStock = product.stock

    // Apply operation
    switch (operation) {
      case 'set':
        newStock = stock
        break
      case 'add':
        newStock = product.stock + stock
        break
      case 'subtract':
        newStock = Math.max(0, product.stock - stock)
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid operation. Use set, add, or subtract' },
          { status: 400 }
        )
    }

    // Update stock
    const updatedProduct = await db.product.update({
      where: { id: productId },
      data: { stock: newStock },
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

    // Log stock change
    logger.info('Product stock updated', {
      productId,
      productName: product.name,
      oldStock: product.stock,
      newStock,
      operation,
      reason,
      notes,
    })

    return NextResponse.json({
      success: true,
      message: 'Stock updated successfully',
      data: updatedProduct,
    })

  } catch (error) {
    logger.error('Error updating product stock:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Failed to update stock' },
      { status: 500 }
    )
  }
}

// Get stock history (placeholder - would need a stock_movements table)
async function getStockHistoryHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // For now, return empty history
    // In a real implementation, you would query a stock_movements table
    const stockHistory: any[] = []

    logger.info('Stock history fetched', { productId })

    return NextResponse.json({
      success: true,
      data: {
        productId,
        productName: product.name,
        history: stockHistory,
      },
    })

  } catch (error) {
    logger.error('Error fetching stock history:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock history' },
      { status: 500 }
    )
  }
}

export const GET = withApiVersioning(withErrorHandler(withAdminAuth(getProductInventoryHandler)))
export const PUT = withApiVersioning(withErrorHandler(withAdminAuth(updateProductStockHandler)))
export const POST = withApiVersioning(withErrorHandler(withAdminAuth(getStockHistoryHandler)))

