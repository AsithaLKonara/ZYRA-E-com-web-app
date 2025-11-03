import { z } from 'zod'
import { logger } from './logger'

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format')
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
export const urlSchema = z.string().url('Invalid URL format')

// User validation schemas
export const userRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema.optional(),
})

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const userUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters').optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
})

// Product validation schemas
export const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').max(200, 'Product name must be less than 200 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description must be less than 5000 characters'),
  price: z.number().positive('Price must be positive'),
  categoryId: z.string().uuid('Invalid category ID'),
  images: z.array(z.string().url()).min(1, 'At least one image is required'),
  tags: z.array(z.string().max(50)).optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
  isActive: z.boolean().optional(),
  weight: z.number().positive().optional(),
  dimensions: z.object({
    length: z.number().positive().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
  }).optional(),
})

export const productUpdateSchema = productSchema.partial()

// Category validation schemas
export const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(100, 'Category name must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be less than 1000 characters').optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  parentId: z.string().uuid().optional(),
  image: z.string().url().optional(),
  isActive: z.boolean().optional(),
})

export const categoryUpdateSchema = categorySchema.partial()

// Address validation schemas
export const addressSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name must be less than 50 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name must be less than 50 characters'),
  company: z.string().max(100, 'Company name must be less than 100 characters').optional(),
  address1: z.string().min(5, 'Address must be at least 5 characters').max(200, 'Address must be less than 200 characters'),
  address2: z.string().max(200, 'Address line 2 must be less than 200 characters').optional(),
  city: z.string().min(2, 'City must be at least 2 characters').max(100, 'City must be less than 100 characters'),
  state: z.string().min(2, 'State must be at least 2 characters').max(100, 'State must be less than 100 characters'),
  postalCode: z.string().min(3, 'Postal code must be at least 3 characters').max(20, 'Postal code must be less than 20 characters'),
  country: z.string().length(2, 'Country code must be exactly 2 characters'),
  phone: phoneSchema.optional(),
})

export const addressUpdateSchema = addressSchema.partial()

// Order validation schemas
export const orderItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
})

export const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  notes: z.string().max(1000, 'Order notes must be less than 1000 characters').optional(),
  couponCode: z.string().max(50, 'Coupon code must be less than 50 characters').optional(),
})

// Review validation schemas
export const reviewSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  title: z.string().min(5, 'Review title must be at least 5 characters').max(200, 'Review title must be less than 200 characters'),
  content: z.string().min(10, 'Review content must be at least 10 characters').max(2000, 'Review content must be less than 2000 characters'),
  images: z.array(z.string().url()).max(5, 'Maximum 5 images allowed').optional(),
})

export const reviewUpdateSchema = reviewSchema.partial()

// Search validation schemas
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(200, 'Search query must be less than 200 characters'),
  category: z.string().uuid().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  sortBy: z.enum(['price', 'name', 'rating', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
})

// Pagination validation schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Validation helper functions
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: string[]
} {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      logger.warn('Validation error:', { errors, data })
      return { success: false, errors }
    }
    logger.error('Validation error:', {}, error instanceof Error ? error : new Error(String(error)))
    return { success: false, errors: ['Unknown validation error'] }
  }
}

export function validateAndSanitizeInput<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: string[]
} {
  try {
    // First sanitize the data
    const sanitizedData = sanitizeInput(data)
    
    // Then validate the sanitized data
    const validatedData = schema.parse(sanitizedData)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      logger.warn('Validation error:', { errors, data })
      return { success: false, errors }
    }
    logger.error('Validation error:', {}, error instanceof Error ? error : new Error(String(error)))
    return { success: false, errors: ['Unknown validation error'] }
  }
}

// Sanitization functions
export function sanitizeInput(data: any): any {
  if (data === null || data === undefined) {
    return data
  }

  if (typeof data === 'string') {
    return sanitizeString(data)
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeInput(item))
  }

  if (typeof data === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      sanitized[sanitizeString(key)] = sanitizeInput(value)
    }
    return sanitized
  }

  return data
}

export function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
}

// Security validation functions
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9-]+$/
  return slugRegex.test(slug)
}

// Rate limiting validation
export function isValidRateLimitWindow(window: string): boolean {
  const validWindows = ['1m', '5m', '15m', '1h', '1d']
  return validWindows.includes(window)
}

export function isValidRateLimit(max: number): boolean {
  return Number.isInteger(max) && max > 0 && max <= 10000
}

// File upload validation
export function isValidFileType(filename: string, allowedTypes: string[]): boolean {
  const extension = filename.split('.').pop()?.toLowerCase()
  return extension ? allowedTypes.includes(extension) : false
}

export function isValidFileSize(size: number, maxSize: number): boolean {
  return size > 0 && size <= maxSize
}

// Content Security Policy validation
export function isValidCSPDirective(directive: string): boolean {
  const validDirectives = [
    'default-src', 'script-src', 'style-src', 'img-src', 'font-src',
    'connect-src', 'media-src', 'object-src', 'child-src', 'frame-src',
    'worker-src', 'frame-ancestors', 'form-action', 'base-uri', 'plugin-types',
    'manifest-src', 'prefetch-src', 'navigate-to'
  ]
  return validDirectives.includes(directive)
}

// Export types for use in other files
export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>
export type UserLoginInput = z.infer<typeof userLoginSchema>
export type UserUpdateInput = z.infer<typeof userUpdateSchema>
export type ProductInput = z.infer<typeof productSchema>
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>
export type AddressInput = z.infer<typeof addressSchema>
export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>
export type OrderInput = z.infer<typeof orderSchema>
export type ReviewInput = z.infer<typeof reviewSchema>
export type ReviewUpdateInput = z.infer<typeof reviewUpdateSchema>
export type SearchInput = z.infer<typeof searchSchema>
export type PaginationInput = z.infer<typeof paginationSchema>




