import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { errorHandler, asyncHandler, NotFoundError, ValidationError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { monitoring } from '@/lib/monitoring';
import { withApiVersioning } from '@/lib/api-versioning';
import { withCache } from '@/lib/cache';
import { sessionCache } from '@/lib/cache';

// Cart item schema
const CartItemSchema = z.object({
  id: z.string(),
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  price: z.number().positive('Price must be positive'),
  name: z.string().min(1, 'Product name is required'),
  image: z.string().url().optional(),
  variant: z.string().optional(),
});

// Cart schema
const CartSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  items: z.array(CartItemSchema).default([]),
  subtotal: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  shipping: z.number().min(0).default(0),
  total: z.number().min(0).default(0),
  currency: z.string().default('USD'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

const AddToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  variant: z.string().optional(),
});

const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

// Mock products data (in production, this would come from database)
const mockProducts = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    price: 299.99,
    image: 'https://example.com/headphones1.jpg',
    inStock: true,
    stockQuantity: 50,
  },
  {
    id: '2',
    name: 'Smart Fitness Watch',
    price: 199.99,
    image: 'https://example.com/watch1.jpg',
    inStock: true,
    stockQuantity: 30,
  },
  {
    id: '3',
    name: 'Organic Cotton T-Shirt',
    price: 29.99,
    image: 'https://example.com/tshirt1.jpg',
    inStock: true,
    stockQuantity: 100,
  },
];

// Mock carts data (in production, this would come from database)
const mockCarts: z.infer<typeof CartSchema>[] = [];

// Get or create cart
function getOrCreateCart(sessionId: string, userId?: string): z.infer<typeof CartSchema> {
  let cart = mockCarts.find(c => c.sessionId === sessionId || c.userId === userId);
  
  if (!cart) {
    cart = {
      id: (mockCarts.length + 1).toString(),
      userId,
      sessionId,
      items: [],
      subtotal: 0,
      tax: 0,
      shipping: 0,
      total: 0,
      currency: 'USD',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockCarts.push(cart);
  }
  
  return cart;
}

// Calculate cart totals
function calculateCartTotals(cart: z.infer<typeof CartSchema>): z.infer<typeof CartSchema> {
  const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal > 100 ? 0 : 9.99; // Free shipping over $100
  const total = subtotal + tax + shipping;
  
  return {
    ...cart,
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    total: Math.round(total * 100) / 100,
    updatedAt: new Date(),
  };
}

// Get cart
const GETHandler = asyncHandler(async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Get session ID from headers or generate one
    const sessionId = request.headers.get('X-Session-ID') || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userId = request.headers.get('X-User-ID') || undefined;
    
    logger.info('Fetching cart', {
      sessionId,
      userId,
      path: request.nextUrl.pathname,
    });

    // Record metric
    monitoring.recordCounter('cart.get.requests', 1, {
      hasUserId: !!userId ? 'true' : 'false',
    });

    // Check cache first
    const cacheKey = `cart:${sessionId}:${userId || 'anonymous'}`;
    const cachedCart = sessionCache.get(cacheKey);
    
    if (cachedCart) {
      logger.debug('Cart found in cache', { sessionId, userId });
      monitoring.recordCounter('cart.get.cache_hits', 1);
      
      return NextResponse.json(cachedCart);
    }

    // Get or create cart
    const cart = getOrCreateCart(sessionId, userId);
    const calculatedCart = calculateCartTotals(cart);

    // Cache the cart
    sessionCache.set(cacheKey, calculatedCart, 3600); // 1 hour

    // Record success metric
    monitoring.recordCounter('cart.get.success', 1);
    monitoring.recordTimer('cart.get.duration', Date.now() - startTime);

    logger.info('Cart fetched successfully', {
      sessionId,
      userId,
      itemCount: calculatedCart.items.length,
      total: calculatedCart.total,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(calculatedCart);

  } catch (error) {
    logger.error('Failed to fetch cart', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('cart.get.errors', 1);

    throw error;
  }
});

// Add item to cart
const POSTHandler = asyncHandler(async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    const addToCartData = AddToCartSchema.parse(body);
    
    // Get session ID from headers or generate one
    const sessionId = request.headers.get('X-Session-ID') || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userId = request.headers.get('X-User-ID') || undefined;
    
    logger.info('Adding item to cart', {
      sessionId,
      userId,
      productId: addToCartData.productId,
      quantity: addToCartData.quantity,
    });

    // Record metric
    monitoring.recordCounter('cart.add.requests', 1, {
      productId: addToCartData.productId,
    });

    // Find product
    const product = mockProducts.find(p => p.id === addToCartData.productId);
    if (!product) {
      logger.warn('Product not found for cart', { productId: addToCartData.productId });
      monitoring.recordCounter('cart.add.product_not_found', 1);
      
      throw new NotFoundError(`Product with ID ${addToCartData.productId} not found`);
    }

    // Check stock availability
    if (!product.inStock || product.stockQuantity < addToCartData.quantity) {
      logger.warn('Insufficient stock for cart', { 
        productId: addToCartData.productId, 
        requested: addToCartData.quantity,
        available: product.stockQuantity 
      });
      monitoring.recordCounter('cart.add.insufficient_stock', 1);
      
      throw new ValidationError('Insufficient stock available');
    }

    // Get or create cart
    const cart = getOrCreateCart(sessionId, userId);
    
    // Check if item already exists in cart
    const existingItemIndex = cart.items?.findIndex(
      item => item.productId === addToCartData.productId && item.variant === addToCartData.variant
    ) ?? -1;

    if (existingItemIndex !== -1) {
      // Update existing item quantity
      if (cart.items && existingItemIndex >= 0 && cart.items[existingItemIndex]) {
        cart.items[existingItemIndex].quantity += addToCartData.quantity;
      }
    } else {
      // Add new item to cart
      const newItem = {
        id: `${(cart.items?.length ?? 0) + 1}`,
        productId: addToCartData.productId,
        quantity: addToCartData.quantity,
        price: product.price,
        name: product.name,
        image: product.image,
        variant: addToCartData.variant,
      };
      cart.items?.push(newItem);
    }

    // Calculate totals
    const calculatedCart = calculateCartTotals(cart);

    // Update cache
    const cacheKey = `cart:${sessionId}:${userId || 'anonymous'}`;
    sessionCache.set(cacheKey, calculatedCart, 3600); // 1 hour

    // Record success metric
    monitoring.recordCounter('cart.add.success', 1);
    monitoring.recordTimer('cart.add.duration', Date.now() - startTime);

    logger.info('Item added to cart successfully', {
      sessionId,
      userId,
      productId: addToCartData.productId,
      quantity: addToCartData.quantity,
      total: calculatedCart.total,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(calculatedCart, { status: 201 });

  } catch (error) {
    logger.error('Failed to add item to cart', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('cart.add.errors', 1);

    throw error;
  }
});

// Clear cart
const DELETEHandler = asyncHandler(async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Get session ID from headers
    const sessionId = request.headers.get('X-Session-ID');
    const userId = request.headers.get('X-User-ID') || undefined;
    
    if (!sessionId) {
      logger.warn('No session ID provided for cart clear', {});
      monitoring.recordCounter('cart.clear.no_session', 1);
      
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    logger.info('Clearing cart', {
      sessionId,
      userId,
    });

    // Record metric
    monitoring.recordCounter('cart.clear.requests', 1, {
      hasUserId: !!userId ? 'true' : 'false',
    });

    // Find cart
    const cartIndex = mockCarts.findIndex(c => c.sessionId === sessionId || c.userId === userId);
    
    if (cartIndex === -1) {
      logger.warn('Cart not found for clear', { sessionId, userId });
      monitoring.recordCounter('cart.clear.not_found', 1);
      
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    // Clear cart items
    let clearedCart;
    if (mockCarts[cartIndex]) {
      mockCarts[cartIndex].items = [];
      clearedCart = calculateCartTotals(mockCarts[cartIndex]);
    } else {
      throw new Error('Cart not found');
    }

    // Update cache
    const cacheKey = `cart:${sessionId}:${userId || 'anonymous'}`;
    sessionCache.set(cacheKey, clearedCart, 3600); // 1 hour

    // Record success metric
    monitoring.recordCounter('cart.clear.success', 1);
    monitoring.recordTimer('cart.clear.duration', Date.now() - startTime);

    logger.info('Cart cleared successfully', {
      sessionId,
      userId,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(clearedCart);

  } catch (error) {
    logger.error('Failed to clear cart', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('cart.clear.errors', 1);

    throw error;
  }
});

// Apply API versioning decorator
export const GET = withApiVersioning(GETHandler);
export const POST = withApiVersioning(POSTHandler);
export const DELETE = withApiVersioning(DELETEHandler);