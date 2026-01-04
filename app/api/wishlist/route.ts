import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"
import { logger } from "@/lib/logger"

import { db as prisma } from '@/lib/database'

const wishlistItemSchema = z.object({
  productId: z.string().min(1)
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const skip = (page - 1) * limit

    const [wishlistItems, total] = await Promise.all([
      prisma.wishlistItem.findMany({
        where: { userId: session.user.id },
        include: {
          product: {
            include: {
              reviews: {
                select: {
                  rating: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.wishlistItem.count({
        where: { userId: session.user.id }
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: wishlistItems,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    logger.error("Wishlist fetch error", {}, error instanceof Error ? error : undefined)
    return NextResponse.json({
      error: "Failed to fetch wishlist"
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { productId } = wishlistItemSchema.parse(body)

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json({
        error: "Product not found"
      }, { status: 404 })
    }

    // Check if already in wishlist
    const existingItem = await prisma.wishlistItem.findFirst({
      where: {
        userId: session.user.id,
        productId
      }
    })

    if (existingItem) {
      return NextResponse.json({
        error: "Product already in wishlist"
      }, { status: 400 })
    }

    // Add to wishlist
    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId: session.user.id,
        productId
      },
      include: {
        product: {
          include: {
            reviews: {
              select: {
                rating: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: wishlistItem
    })

  } catch (error) {
    logger.error("Wishlist add error", {}, error instanceof Error ? error : undefined)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "Invalid input data",
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: "Failed to add to wishlist"
    }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { productId } = wishlistItemSchema.parse(body)

    // Remove from wishlist
    const deletedItem = await prisma.wishlistItem.deleteMany({
      where: {
        userId: session.user.id,
        productId
      }
    })

    if (deletedItem.count === 0) {
      return NextResponse.json({
        error: "Item not found in wishlist"
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Item removed from wishlist"
    })

  } catch (error) {
    logger.error("Wishlist remove error", {}, error instanceof Error ? error : undefined)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "Invalid input data",
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: "Failed to remove from wishlist"
    }, { status: 500 })
  }
}