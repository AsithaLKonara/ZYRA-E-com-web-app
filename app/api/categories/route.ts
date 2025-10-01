import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { errorHandler, asyncHandler } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { monitoring } from '@/lib/monitoring';
import { withApiVersioning } from '@/lib/api-versioning';
import { withCache } from '@/lib/cache';
import { apiCache } from '@/lib/cache';

// Category schema
const CategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  slug: z.string().min(1, 'Category slug is required'),
  parentId: z.string().optional(),
  image: z.string().url().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  productCount: z.number().int().min(0).default(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

const CreateCategorySchema = CategorySchema.omit({ 
  id: true, 
  productCount: true, 
  createdAt: true, 
  updatedAt: true 
});

const UpdateCategorySchema = CreateCategorySchema.partial();

// Query parameters schema
const QuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  parentId: z.string().optional(),
  isActive: z.string().transform(val => val === 'true').optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'sortOrder', 'productCount', 'createdAt']).default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Mock categories data (in production, this would come from database)
const mockCategories = [
  {
    id: '1',
    name: 'Electronics',
    description: 'Electronic devices and accessories',
    slug: 'electronics',
    parentId: null,
    image: 'https://example.com/electronics.jpg',
    isActive: true,
    sortOrder: 1,
    productCount: 25,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Clothing',
    description: 'Fashion and apparel',
    slug: 'clothing',
    parentId: null,
    image: 'https://example.com/clothing.jpg',
    isActive: true,
    sortOrder: 2,
    productCount: 50,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: '3',
    name: 'Home & Garden',
    description: 'Home improvement and garden supplies',
    slug: 'home-garden',
    parentId: null,
    image: 'https://example.com/home-garden.jpg',
    isActive: true,
    sortOrder: 3,
    productCount: 30,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
  {
    id: '4',
    name: 'Smartphones',
    description: 'Mobile phones and accessories',
    slug: 'smartphones',
    parentId: '1',
    image: 'https://example.com/smartphones.jpg',
    isActive: true,
    sortOrder: 1,
    productCount: 15,
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04'),
  },
  {
    id: '5',
    name: 'Laptops',
    description: 'Portable computers and accessories',
    slug: 'laptops',
    parentId: '1',
    image: 'https://example.com/laptops.jpg',
    isActive: true,
    sortOrder: 2,
    productCount: 10,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
  },
];

// Get all categories
const GETHandler = asyncHandler(async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Parse query parameters
    const { searchParams } = request.nextUrl;
    const query = QuerySchema.parse(Object.fromEntries(searchParams));
    
    logger.info('Fetching categories', {
      query,
      path: request.nextUrl.pathname,
    });

    // Record metric
    monitoring.recordCounter('categories.list.requests', 1, {
      parentId: query.parentId || 'all',
    });

    // Check cache first
    const cacheKey = `categories:${JSON.stringify(query)}`;
    const cachedCategories = apiCache.get(cacheKey);
    
    if (cachedCategories) {
      logger.debug('Categories found in cache', { query });
      monitoring.recordCounter('categories.list.cache_hits', 1);
      
      return NextResponse.json(cachedCategories);
    }

    // Filter categories
    let filteredCategories = [...mockCategories];

    // Apply filters
    if (query.parentId !== undefined) {
      if (query.parentId === null) {
        filteredCategories = filteredCategories.filter(c => c.parentId === null);
      } else {
        filteredCategories = filteredCategories.filter(c => c.parentId === query.parentId);
      }
    }

    if (query.isActive !== undefined) {
      filteredCategories = filteredCategories.filter(c => c.isActive === query.isActive);
    }

    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      filteredCategories = filteredCategories.filter(c => 
        c.name.toLowerCase().includes(searchTerm) ||
        c.description?.toLowerCase().includes(searchTerm) ||
        c.slug.toLowerCase().includes(searchTerm)
      );
    }

    // Sort categories
    filteredCategories.sort((a, b) => {
      const aValue = a[query.sortBy];
      const bValue = b[query.sortBy];
      
      if (query.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Pagination
    const total = filteredCategories.length;
    const totalPages = Math.ceil(total / query.limit);
    const startIndex = (query.page - 1) * query.limit;
    const endIndex = startIndex + query.limit;
    const categories = filteredCategories.slice(startIndex, endIndex);

    // Build response
    const response = {
      categories,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrev: query.page > 1,
      },
      filters: {
        parentId: query.parentId,
        isActive: query.isActive,
        search: query.search,
      },
      sort: {
        by: query.sortBy,
        order: query.sortOrder,
      },
    };

    // Cache the response
    apiCache.set(cacheKey, response, 300); // 5 minutes

    // Record success metric
    monitoring.recordCounter('categories.list.success', 1);
    monitoring.recordTimer('categories.list.duration', Date.now() - startTime);

    logger.info('Categories fetched successfully', {
      count: categories.length,
      total,
      page: query.page,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Failed to fetch categories', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('categories.list.errors', 1);

    throw error;
  }
});

// Create new category
const POSTHandler = asyncHandler(async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    const categoryData = CreateCategorySchema.parse(body);
    
    logger.info('Creating new category', {
      name: categoryData.name,
      slug: categoryData.slug,
      parentId: categoryData.parentId,
    });

    // Record metric
    monitoring.recordCounter('categories.create.requests', 1, {
      parentId: categoryData.parentId || 'root',
    });

    // Check if slug already exists
    const existingCategory = mockCategories.find(c => c.slug === categoryData.slug);
    if (existingCategory) {
      logger.warn('Category slug already exists', { slug: categoryData.slug });
      monitoring.recordCounter('categories.create.duplicate_slug', 1);
      
      return NextResponse.json(
        { error: 'Category slug already exists' },
        { status: 409 }
      );
    }

    // Generate new category ID
    const newCategory = {
      id: (mockCategories.length + 1).toString(),
      name: categoryData.name,
      description: categoryData.description || '',
      slug: categoryData.slug,
      parentId: categoryData.parentId || null,
      image: categoryData.image || '',
      isActive: categoryData.isActive ?? true,
      sortOrder: categoryData.sortOrder || 0,
      productCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add to mock data (in production, save to database)
    mockCategories.push(newCategory);

    // Clear cache
    apiCache.clear();

    // Record success metric
    monitoring.recordCounter('categories.create.success', 1);
    monitoring.recordTimer('categories.create.duration', Date.now() - startTime);

    logger.info('Category created successfully', {
      id: newCategory.id,
      name: newCategory.name,
      slug: newCategory.slug,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(newCategory, { status: 201 });

  } catch (error) {
    logger.error('Failed to create category', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('categories.create.errors', 1);

    throw error;
  }
});

// Apply API versioning decorator
export const GET = withApiVersioning(GETHandler);
export const POST = withApiVersioning(POSTHandler);