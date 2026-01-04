import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { withApiVersioning } from '@/lib/api-versioning'
import { db } from '@/lib/db-connection'
import { logger } from '@/lib/logger'
import { CART } from '@/lib/constants'

// Update cart item quantity
async function updateCartItemHandler(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const user = (request as any).user
    const productId = params.productId
    const { quantity } = await request.json()

    // Validate input
    if (quantity < 0 || quantity > CART.MAX_QUANTITY_PER_ITEM) {
      return NextResponse.json(
        { success: false, error: `Quantity must be between 0 and ${CART.MAX_QUANTITY_PER_ITEM}` },
        { status: 400 }
      )
    }

    // Check if item exists in cart
    const cartItem = await db.cartItem.findFirst({
      where: {
        userId: user.id,
        productId,
      },
      include: {
        product: {
          select: {
            stock: true,
            isActive: true,
          },
        },
      },
    })

    if (!cartItem) {
      return NextResponse.json(
        { success: false, error: 'Item not found in cart' },
        { status: 404 }
      )
    }

    if (!cartItem.product.isActive) {
      return NextResponse.json(
        { success: false, error: 'Product is no longer available' },
        { status: 400 }
      )
    }

    if (quantity === 0) {
      // Remove item from cart
      await db.cartItem.delete({
        where: { id: cartItem.id },
      })

      logger.info('Item removed from cart', {
        userId: user.id,
        productId,
      })

      return NextResponse.json({
        success: true,
        message: 'Item removed from cart',
      })
    }

    // Check stock availability
    if (cartItem.product.stock < quantity) {
      return NextResponse.json(
        { success: false, error: 'Insufficient stock' },
        { status: 400 }
      )
    }

    // Update quantity
    await db.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity },
    })

    logger.info('Cart item updated', {
      userId: user.id,
      productId,
      quantity,
    })

    return NextResponse.json({
      success: true,
      message: 'Cart item updated successfully',
    })

  } catch (error) {
    logger.error('Error updating cart item:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Failed to update cart item' },
      { status: 500 }
    )
  }
}

// Remove item from cart
async function removeCartItemHandler(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const user = (request as any).user
    const productId = params.productId

    // Check if item exists in cart
    const cartItem = await db.cartItem.findFirst({
      where: {
        userId: user.id,
        productId,
      },
    })

    if (!cartItem) {
      return NextResponse.json(
        { success: false, error: 'Item not found in cart' },
        { status: 404 }
      )
    }

    // Remove item from cart
    await db.cartItem.delete({
      where: { id: cartItem.id },
    })

    logger.info('Item removed from cart', {
      userId: user.id,
      productId,
    })

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart successfully',
    })

  } catch (error) {
    logger.error('Error removing cart item:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Failed to remove cart item' },
      { status: 500 }
    )
  }
}

export const PUT = withApiVersioning(withErrorHandler(withAuth(updateCartItemHandler)))
export const DELETE = withApiVersioning(withErrorHandler(withAuth(removeCartItemHandler)))




