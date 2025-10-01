import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { withCORS, withErrorHandler } from '@/lib/cors'
import { db } from '@/lib/db-connection'
import { logger } from '@/lib/logger'

// Remove item from wishlist
async function removeFromWishlistHandler(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const user = (request as any).user
    const productId = params.productId

    // Check if item exists in wishlist
    const wishlistItem = await db.wishlistItem.findFirst({
      where: {
        userId: user.id,
        productId,
      },
    })

    if (!wishlistItem) {
      return NextResponse.json(
        { success: false, error: 'Item not found in wishlist' },
        { status: 404 }
      )
    }

    // Remove item from wishlist
    await db.wishlistItem.delete({
      where: { id: wishlistItem.id },
    })

    logger.info('Item removed from wishlist', {
      userId: user.id,
      productId,
    })

    return NextResponse.json({
      success: true,
      message: 'Item removed from wishlist successfully',
    })

  } catch (error) {
    logger.error('Error removing from wishlist:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove item from wishlist' },
      { status: 500 }
    )
  }
}

// Check if item is in wishlist
async function checkWishlistHandler(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const user = (request as any).user
    const productId = params.productId

    const wishlistItem = await db.wishlistItem.findFirst({
      where: {
        userId: user.id,
        productId,
      },
    })

    return NextResponse.json({
      success: true,
      inWishlist: !!wishlistItem,
    })

  } catch (error) {
    logger.error('Error checking wishlist:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check wishlist' },
      { status: 500 }
    )
  }
}

export const DELETE = withCORS(withErrorHandler(withAuth(removeFromWishlistHandler)))
export const GET = withCORS(withErrorHandler(withAuth(checkWishlistHandler)))




