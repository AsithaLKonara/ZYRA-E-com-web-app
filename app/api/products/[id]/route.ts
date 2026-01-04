import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { errorHandler, asyncHandler, NotFoundError } from '@/lib/error-handler';
import { withErrorHandler } from '@/lib/cors';
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

const UpdateProductSchema = ProductSchema.partial().omit({ id: true, createdAt: true });

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

// Get product by ID
const GETHandler = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
  const startTime = Date.now();
  const { id } = params;
  
  try {
    logger.info('Fetching product by ID', {
      id,
      path: request.nextUrl.pathname,
    });

    // Record metric
    monitoring.recordCounter('products.get.requests', 1, { id });

    // Check cache first
    const cacheKey = `product:${id}`;
    const cachedProduct = productCache.get(cacheKey);
    
    if (cachedProduct) {
      logger.debug('Product found in cache', { id });
      monitoring.recordCounter('products.get.cache_hits', 1, { id });
      
      return NextResponse.json(cachedProduct);
    }

    // Find product in mock data
    const product = mockProducts.find(p => p.id === id);
    
    if (!product) {
      logger.warn('Product not found', { id });
      monitoring.recordCounter('products.get.not_found', 1, { id });
      
      throw new NotFoundError(`Product with ID ${id} not found`);
    }

    // Cache the product
    productCache.set(cacheKey, product, 1800); // 30 minutes

    // Record success metric
    monitoring.recordCounter('products.get.success', 1, { id });
    monitoring.recordTimer('products.get.duration', Date.now() - startTime);

    logger.info('Product fetched successfully', {
      id,
      name: product.name,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(product);

  } catch (error) {
    logger.error('Failed to fetch product', {
      id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('products.get.errors', 1, { id });

    throw error;
  }
});

// Update product by ID
const PUTHandler = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
  const startTime = Date.now();
  const { id } = params;
  
  try {
    // Parse request body
    const body = await request.json();
    const updateData = UpdateProductSchema.parse(body);
    
    logger.info('Updating product', {
      id,
      updates: Object.keys(updateData),
    });

    // Record metric
    monitoring.recordCounter('products.update.requests', 1, { id });

    // Find product in mock data
    const productIndex = mockProducts.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      logger.warn('Product not found for update', { id });
      monitoring.recordCounter('products.update.not_found', 1, { id });
      
      throw new NotFoundError(`Product with ID ${id} not found`);
    }

    // Update product
    const existingProduct = mockProducts[productIndex]!; // We know it exists due to findIndex check
    const updatedProduct = {
      ...existingProduct,
      ...updateData,
      updatedAt: new Date(),
      // Ensure required fields are present
      id: existingProduct.id,
      createdAt: existingProduct.createdAt,
    };

    mockProducts[productIndex] = updatedProduct;

    // Update cache
    const cacheKey = `product:${id}`;
    productCache.set(cacheKey, updatedProduct, 1800); // 30 minutes

    // Record success metric
    monitoring.recordCounter('products.update.success', 1, { id });
    monitoring.recordTimer('products.update.duration', Date.now() - startTime);

    logger.info('Product updated successfully', {
      id,
      name: updatedProduct.name,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(updatedProduct);

  } catch (error) {
    logger.error('Failed to update product', {
      id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('products.update.errors', 1, { id });

    throw error;
  }
});

// Delete product by ID
const DELETEHandler = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
  const startTime = Date.now();
  const { id } = params;
  
  try {
    logger.info('Deleting product', {
      id,
      path: request.nextUrl.pathname,
    });

    // Record metric
    monitoring.recordCounter('products.delete.requests', 1, { id });

    // Find product in mock data
    const productIndex = mockProducts.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      logger.warn('Product not found for deletion', { id });
      monitoring.recordCounter('products.delete.not_found', 1, { id });
      
      throw new NotFoundError(`Product with ID ${id} not found`);
    }

    // Remove product
    const deletedProduct = mockProducts.splice(productIndex, 1)[0]!; // We know it exists due to findIndex check

    // Remove from cache
    const cacheKey = `product:${id}`;
    productCache.delete(cacheKey);

    // Record success metric
    monitoring.recordCounter('products.delete.success', 1, { id });
    monitoring.recordTimer('products.delete.duration', Date.now() - startTime);

    logger.info('Product deleted successfully', {
      id,
      name: deletedProduct.name,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      { message: 'Product deleted successfully', id },
      { status: 200 }
    );

  } catch (error) {
    logger.error('Failed to delete product', {
      id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('products.delete.errors', 1, { id });

    throw error;
  }
});

// Apply API versioning decorator
export const GET = withApiVersioning(withErrorHandler(GETHandler));
export const PUT = withApiVersioning(withErrorHandler(PUTHandler));
export const DELETE = withApiVersioning(withErrorHandler(DELETEHandler));