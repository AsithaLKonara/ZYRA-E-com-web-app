import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { z } from "zod"
import { logger } from "@/lib/logger"

import { db as prisma } from '@/lib/database'

const searchSchema = z.object({
  query: z.string().min(1),
  filters: z.object({
    category: z.string().optional(),
    brand: z.string().optional(),
    priceMin: z.number().optional(),
    priceMax: z.number().optional(),
    rating: z.number().min(1).max(5).optional(),
    inStock: z.boolean().optional(),
    isNew: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
  sort: z.enum(['relevance', 'price-asc', 'price-desc', 'rating', 'newest', 'name-asc', 'name-desc']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query, filters = {}, sort = 'relevance', page, limit } = searchSchema.parse(body)

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      AND: [
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { brand: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [query] } }
          ]
        }
      ]
    }

    // Apply filters
    if (filters.category) {
      where.AND.push({ category: { equals: filters.category, mode: 'insensitive' } })
    }
    if (filters.brand) {
      where.AND.push({ brand: { equals: filters.brand, mode: 'insensitive' } })
    }
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      const priceFilter: any = {}
      if (filters.priceMin !== undefined) priceFilter.gte = filters.priceMin
      if (filters.priceMax !== undefined) priceFilter.lte = filters.priceMax
      where.AND.push({ price: priceFilter })
    }
    if (filters.rating !== undefined) {
      where.AND.push({ rating: { gte: filters.rating } })
    }
    if (filters.inStock !== undefined) {
      where.AND.push({ inStock: filters.inStock })
    }
    if (filters.isNew !== undefined) {
      where.AND.push({ isNew: filters.isNew })
    }
    if (filters.tags && filters.tags.length > 0) {
      where.AND.push({ tags: { hasSome: filters.tags } })
    }

    // Build orderBy clause
    let orderBy: any = {}
    switch (sort) {
      case 'price-asc':
        orderBy = { price: 'asc' }
        break
      case 'price-desc':
        orderBy = { price: 'desc' }
        break
      case 'rating':
        orderBy = { rating: 'desc' }
        break
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      case 'name-asc':
        orderBy = { name: 'asc' }
        break
      case 'name-desc':
        orderBy = { name: 'desc' }
        break
      case 'relevance':
      default:
        // For relevance, we'll use a combination of factors
        orderBy = [
          { rating: 'desc' },
          { reviewCount: 'desc' },
          { createdAt: 'desc' }
        ]
        break
    }

    // Execute search
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          reviews: {
            select: {
              rating: true,
              createdAt: true
            }
          }
        }
      }),
      prisma.product.count({ where })
    ])

    // Get search suggestions and facets
    const [suggestions, facets] = await Promise.all([
      getSearchSuggestions(query),
      getSearchFacets(where)
    ])

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
        suggestions,
        facets,
        query,
        filters,
        sort
      }
    })

  } catch (error) {
    logger.error("Advanced search error", {}, error instanceof Error ? error : undefined)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "Invalid search parameters",
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: "Search failed"
    }, { status: 500 })
  }
}

async function getSearchSuggestions(query: string) {
  try {
    const suggestions = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { name: { contains: query, mode: 'insensitive' } } }
        ]
      },
      select: {
        name: true,
        category: true
      },
      take: 5
    })

    return {
      products: suggestions.map(s => s.name),
      brands: [], // Brand field doesn't exist in Product model
      categories: [...new Set(suggestions.map(s => s.category.name))]
    }
  } catch (error) {
    logger.error("Error getting search suggestions", {}, error instanceof Error ? error : undefined)
    return { products: [], brands: [], categories: [] }
  }
}

async function getSearchFacets(where: any) {
  try {
    const [categories, brands, priceRange, ratings] = await Promise.all([
      prisma.product.groupBy({
        by: ['categoryId'],
        where,
        _count: { categoryId: true }
      }),
      // Brand field doesn't exist in Product model
      Promise.resolve([]),
      prisma.product.aggregate({
        where,
        _min: { price: true },
        _max: { price: true }
      }),
      // Rating field doesn't exist in Product model
      Promise.resolve([])
    ])

    return {
      categories: categories.map(c => ({
        value: c.categoryId,
        count: c._count.categoryId
      })),
      brands: [], // Brand field doesn't exist in Product model
      priceRange: {
        min: priceRange._min.price || 0,
        max: priceRange._max.price || 0
      },
      ratings: [] // Rating field doesn't exist in Product model
    }
  } catch (error) {
    logger.error("Error getting search facets", {}, error instanceof Error ? error : undefined)
    return { categories: [], brands: [], priceRange: { min: 0, max: 0 }, ratings: [] }
  }
}
