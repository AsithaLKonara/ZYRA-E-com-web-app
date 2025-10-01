import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { errorHandler, asyncHandler } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { monitoring } from '@/lib/monitoring';
import { withApiVersioning } from '@/lib/api-versioning';
import { withCache } from '@/lib/cache';
import { productCache } from '@/lib/cache';

// Product schema
const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  images: z.array(z.string().url()).optional(),
  inStock: z.boolean().default(true),
  stockQuantity: z.number().int().min(0).default(0),
  tags: z.array(z.string()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

const CreateProductSchema = ProductSchema.omit({ id: true, createdAt: true, updatedAt: true });
const UpdateProductSchema = CreateProductSchema.partial();

// Query parameters schema
const QuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  category: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.string().transform(Number).optional(),
  maxPrice: z.string().transform(Number).optional(),
  inStock: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['name', 'price', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Mock products data (in production, this would come from database)
const mockProducts = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    price: 299.99,
    category: 'Electronics',
    images: ['https://example.com/headphones1.jpg'],
    inStock: true,
    stockQuantity: 50,
    tags: ['wireless', 'noise-cancellation', 'premium'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Smart Fitness Watch',
    description: 'Advanced fitness tracking with heart rate monitoring',
    price: 199.99,
    category: 'Electronics',
    images: ['https://example.com/watch1.jpg'],
    inStock: true,
    stockQuantity: 30,
    tags: ['fitness', 'smartwatch', 'health'],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '3',
    name: 'Organic Cotton T-Shirt',
    description: 'Comfortable and sustainable cotton t-shirt',
    price: 29.99,
    category: 'Clothing',
    images: ['https://example.com/tshirt1.jpg'],
    inStock: true,
    stockQuantity: 100,
    tags: ['organic', 'cotton', 'sustainable'],
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
  },
];

// Get all products
const GETHandler = asyncHandler(async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Parse query parameters
    const { searchParams } = request.nextUrl;
    const query = QuerySchema.parse(Object.fromEntries(searchParams));
    
    logger.info('Fetching products', {
      query,
      path: request.nextUrl.pathname,
    });

    // Record metric
    monitoring.recordCounter('products.list.requests', 1, {
      category: query.category || 'all',
    });

    // Filter products
    let filteredProducts = [...mockProducts];

    // Apply filters
    if (query.category) {
      filteredProducts = filteredProducts.filter(p => 
        p.category.toLowerCase() === query.category!.toLowerCase()
      );
    }

    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm) ||
        p.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    if (query.minPrice !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.price >= query.minPrice!);
    }

    if (query.maxPrice !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.price <= query.maxPrice!);
    }

    if (query.inStock !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.inStock === query.inStock);
    }

    // Sort products
    filteredProducts.sort((a, b) => {
      const aValue = a[query.sortBy];
      const bValue = b[query.sortBy];
      
      if (query.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Pagination
    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / query.limit);
    const startIndex = (query.page - 1) * query.limit;
    const endIndex = startIndex + query.limit;
    const products = filteredProducts.slice(startIndex, endIndex);

    // Build response
    const response = {
      products,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrev: query.page > 1,
      },
      filters: {
        category: query.category,
        search: query.search,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        inStock: query.inStock,
      },
      sort: {
        by: query.sortBy,
        order: query.sortOrder,
      },
    };

    // Record success metric
    monitoring.recordCounter('products.list.success', 1);
    monitoring.recordTimer('products.list.duration', Date.now() - startTime);

    logger.info('Products fetched successfully', {
      count: products.length,
      total,
      page: query.page,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Failed to fetch products', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('products.list.errors', 1);

    throw error;
  }
});

// Create new product
const POSTHandler = asyncHandler(async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    const productData = CreateProductSchema.parse(body);
    
    logger.info('Creating new product', {
      name: productData.name,
      category: productData.category,
      price: productData.price,
    });

    // Record metric
    monitoring.recordCounter('products.create.requests', 1, {
      category: productData.category,
    });

    // Generate new product ID
    const newProduct = {
      id: (mockProducts.length + 1).toString(),
      name: productData.name,
      description: productData.description || '',
      price: productData.price,
      category: productData.category,
      images: productData.images || [],
      inStock: productData.inStock ?? true,
      stockQuantity: productData.stockQuantity || 0,
      tags: productData.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add to mock data (in production, save to database)
    mockProducts.push(newProduct);

    // Record success metric
    monitoring.recordCounter('products.create.success', 1);
    monitoring.recordTimer('products.create.duration', Date.now() - startTime);

    logger.info('Product created successfully', {
      id: newProduct.id,
      name: newProduct.name,
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
    monitoring.recordCounter('products.create.errors', 1);

    throw error;
  }
});

// Apply API versioning decorator
export const GET = withApiVersioning(GETHandler);
export const POST = withApiVersioning(POSTHandler);