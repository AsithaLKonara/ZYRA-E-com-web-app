import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { PrismaClient, UserRole } from "@prisma/client"
import { z } from "zod"
import { logger } from "@/lib/logger"

const prisma = new PrismaClient()

const inventoryUpdateSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().min(0),
  action: z.enum(['add', 'subtract', 'set']),
  reason: z.string().optional(),
  notes: z.string().optional()
})

const bulkUpdateSchema = z.object({
  updates: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().min(0),
    action: z.enum(['add', 'subtract', 'set'])
  })),
  reason: z.string().optional(),
  notes: z.string().optional()
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""
    const lowStock = searchParams.get("lowStock") === "true"

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (category) {
      where.category = { name: { equals: category, mode: 'insensitive' } }
    }
    
    if (lowStock) {
      where.stock = { lte: 10 } // Low stock threshold
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          sku: true,
          category: true,
          price: true,
          stock: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ])

    // Get inventory statistics
    const stats = await prisma.product.aggregate({
      where: { isActive: true },
      _sum: { stock: true },
      _count: { id: true }
    })

    const lowStockCount = await prisma.product.count({
      where: { stock: { lte: 10 } }
    })

    const outOfStockCount = await prisma.product.count({
      where: { stock: { lte: 0 } }
    })

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats: {
          totalProducts: stats._count.id,
          totalStock: stats._sum.stock || 0,
          lowStockCount,
          outOfStockCount
        }
      }
    })

  } catch (error) {
    logger.error("Inventory fetch error", {}, error instanceof Error ? error : undefined)
    return NextResponse.json({
      error: "Failed to fetch inventory"
    }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { productId, quantity, action, reason, notes } = inventoryUpdateSchema.parse(body)

    // Get current product
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json({
        error: "Product not found"
      }, { status: 404 })
    }

    // Calculate new quantity
    let newQuantity = product.stock
    switch (action) {
      case 'add':
        newQuantity += quantity
        break
      case 'subtract':
        newQuantity = Math.max(0, newQuantity - quantity)
        break
      case 'set':
        newQuantity = quantity
        break
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        stock: newQuantity
      }
    })

    // TODO: Create inventory log when InventoryLog model is added to schema
    // For now, log using logger
    logger.info('Inventory update', {
      productId,
      userId: session.user.id,
      action: action.toUpperCase(),
      quantityChange: action === 'set' ? quantity - product.stock : 
                     action === 'add' ? quantity : -quantity,
      previousQuantity: product.stock,
      newQuantity,
      reason,
      notes
    })

    return NextResponse.json({
      success: true,
      data: updatedProduct
    })

  } catch (error) {
    logger.error("Inventory update error", {}, error instanceof Error ? error : undefined)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "Invalid input data",
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: "Failed to update inventory"
    }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { updates, reason, notes } = bulkUpdateSchema.parse(body)

    const results = []

    for (const update of updates) {
      const product = await prisma.product.findUnique({
        where: { id: update.productId }
      })

      if (!product) {
        results.push({
          productId: update.productId,
          success: false,
          error: "Product not found"
        })
        continue
      }

      let newQuantity = product.stock
      switch (update.action) {
        case 'add':
          newQuantity += update.quantity
          break
        case 'subtract':
          newQuantity = Math.max(0, newQuantity - update.quantity)
          break
        case 'set':
          newQuantity = update.quantity
          break
      }

      try {
        const updatedProduct = await prisma.product.update({
          where: { id: update.productId },
          data: {
            stock: newQuantity
          }
        })

        // TODO: Create inventory log when InventoryLog model is added to schema
        // For now, log using logger
        logger.info('Bulk inventory update', {
          productId: update.productId,
          userId: session.user.id,
          action: update.action.toUpperCase(),
          quantityChange: update.action === 'set' ? update.quantity - product.stock : 
                         update.action === 'add' ? update.quantity : -update.quantity,
          previousQuantity: product.stock,
          newQuantity,
          reason,
          notes
        })

        results.push({
          productId: update.productId,
          success: true,
          data: updatedProduct
        })
      } catch (err) {
        results.push({
          productId: update.productId,
          success: false,
          error: err instanceof Error ? err.message : "Update failed"
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        total: updates.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    })

  } catch (error) {
    logger.error("Bulk inventory update error", {}, error instanceof Error ? error : undefined)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "Invalid input data",
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: "Failed to update inventory"
    }, { status: 500 })
  }
}