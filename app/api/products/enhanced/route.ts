import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { errorHandler, asyncHandler, ValidationError, NotFoundError, AuthorizationError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { monitoring } from '@/lib/monitoring';
import { withApiVersioning } from '@/lib/api-versioning';
import { withCache } from '@/lib/cache';
import { apiCache } from '@/lib/cache';
import { PrismaClient } from '@prisma/client';
import { AuthUtils, UserRole } from '@/lib/auth-utils';

// Create Prisma client
import { db as prisma } from '@/lib/database';

// Enhanced product schemas
const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  categoryId: z.string(),
  images: z.array(z.string()),
  inStock: z.boolean(),
  stockQuantity: z.number(),
  tags: z.array(z.string()),
  specifications: z.record(z.string(), z.any()).optional(),
  variants: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    stockQuantity: z.number(),
    attributes: z.record(z.string(), z.string()),
  })).optional(),
  reviews: z.object({
    averageRating: z.number(),
    totalReviews: z.number(),
  }).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const CreateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be positive'),
  categoryId: z.string().uuid('Invalid category ID'),
  images: z.array(z.string().url()).min(1, 'At least one image is required'),
  inStock: z.boolean().default(true),
  stockQuantity: z.number().int().min(0, 'Stock quantity must be non-negative'),
  tags: z.array(z.string()).default([]),
  specifications: z.record(z.string(), z.any()).optional(),
  variants: z.array(z.object({
    name: z.string(),
    price: z.number().positive(),
    stockQuantity: z.number().int().min(0),
    attributes: z.record(z.string(), z.string()),
  })).optional(),
});

const UpdateProductSchema = CreateProductSchema.partial();

const QuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.string().transform(Number).optional(),
  maxPrice: z.string().transform(Number).optional(),
  inStock: z.string().transform(val => val === 'true').optional(),
  tags: z.string().optional(),
  sortBy: z.enum(['name', 'price', 'createdAt', 'updatedAt', 'rating']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  featured: z.string().transform(val => val === 'true').optional(),
});

// Get enhanced products with advanced filtering
const GETHandler = asyncHandler(async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Parse query parameters
    const { searchParams } = request.nextUrl;
    const query = QuerySchema.parse(Object.fromEntries(searchParams));
    
    logger.info('Fetching enhanced products', {
      query,
      path: request.nextUrl.pathname,
    });

    // Record metric
    monitoring.recordCounter('products.enhanced.list.requests', 1);

    // Check cache first
    const cacheKey = `products:enhanced:${JSON.stringify(query)}`;
    const cachedProducts = apiCache.get(cacheKey);
    
    if (cachedProducts) {
      logger.debug('Enhanced products found in cache', { query });
      monitoring.recordCounter('products.enhanced.list.cache_hits', 1);
      
      return NextResponse.json(cachedProducts);
    }

    // Build where clause
    const where: any = {
      isActive: true,
    };
    
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search } },
      ];
    }
    
    if (query.category) {
      where.categoryId = query.category;
    }
    
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) {
        where.price.gte = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        where.price.lte = query.maxPrice;
      }
    }
    
    if (query.inStock !== undefined) {
      where.inStock = query.inStock;
    }
    
    if (query.tags) {
      const tagArray = query.tags.split(',').map(tag => tag.trim());
      where.tags = { hasSome: tagArray };
    }
    
    if (query.featured) {
      where.featured = true;
    }

    // Get products with related data
    const [products, total] = await Promise.all([
      prisma.product.findMany({
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
        },
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Process products to include calculated fields
    const processedProducts = products.map(product => {
      const reviews = product.reviews || [];
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0;
      
      return {
        ...product,
        reviews: {
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: reviews.length,
        },
      };
    });

    // Calculate pagination
    const totalPages = Math.ceil(total / query.limit);
    
    // Build response
    const response = {
      products: processedProducts,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrev: query.page > 1,
      },
      filters: {
        search: query.search,
        category: query.category,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        inStock: query.inStock,
        tags: query.tags,
        featured: query.featured,
      },
      sort: {
        by: query.sortBy,
        order: query.sortOrder,
      },
      meta: {
        totalProducts: total,
        averagePrice: products.length > 0 
          ? Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length * 100) / 100 
          : 0,
        priceRange: products.length > 0 
          ? {
              min: Math.min(...products.map(p => p.price)),
              max: Math.max(...products.map(p => p.price)),
            }
          : { min: 0, max: 0 },
      },
    };

    // Cache the response
    apiCache.set(cacheKey, response, 300); // 5 minutes

    // Record success metric
    monitoring.recordCounter('products.enhanced.list.success', 1);
    monitoring.recordTimer('products.enhanced.list.duration', Date.now() - startTime);

    logger.info('Enhanced products fetched successfully', {
      count: products.length,
      total,
      page: query.page,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Failed to fetch enhanced products', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('products.enhanced.list.errors', 1);

    throw error;
  }
});

// Create new product (Admin only)
const POSTHandler = asyncHandler(async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Check authentication and authorization
    const currentUser = await AuthUtils.requireModeratorOrAdmin();
    
    // Parse request body
    const body = await request.json();
    const productData = CreateProductSchema.parse(body);
    
    logger.info('Creating new product', {
      name: productData.name,
      categoryId: productData.categoryId,
      userId: currentUser.id,
    });

    // Record metric
    monitoring.recordCounter('products.enhanced.create.requests', 1, {
      userId: currentUser.id,
      role: currentUser.role,
    });

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: productData.categoryId },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Create product
    const newProduct = await prisma.product.create({
      data: {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        images: productData.images,
        tags: productData.tags,
        categoryId: productData.categoryId,
        slug: productData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        sku: `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        stock: productData.stockQuantity || 0,
        isActive: true,
        isFeatured: false,
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
    });

    // Clear cache
    apiCache.clear();

    // Record success metric
    monitoring.recordCounter('products.enhanced.create.success', 1);
    monitoring.recordTimer('products.enhanced.create.duration', Date.now() - startTime);

    logger.info('Product created successfully', {
      id: newProduct.id,
      name: newProduct.name,
      categoryId: newProduct.categoryId,
      userId: currentUser.id,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(newProduct, { status: 201 });

  } catch (error) {
    logger.error('Failed to create product', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('products.enhanced.create.errors', 1);

    throw error;
  }
});

// Apply API versioning decorator
export const GET = withApiVersioning(GETHandler);
export const POST = withApiVersioning(POSTHandler);


