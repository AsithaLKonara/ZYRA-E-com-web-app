// Application constants
export const APP_CONSTANTS = {
  // App information
  NAME: 'ZYRA Fashion',
  VERSION: '1.0.0',
  DESCRIPTION: 'Ultra-modern e-commerce platform',
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Cache TTL (in milliseconds)
  CACHE_TTL: {
    SHORT: 5 * 60 * 1000, // 5 minutes
    MEDIUM: 30 * 60 * 1000, // 30 minutes
    LONG: 60 * 60 * 1000, // 1 hour
    VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  // Rate limiting
  RATE_LIMITS: {
    API: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
    AUTH: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 requests per 15 minutes
    UPLOAD: { windowMs: 60 * 60 * 1000, max: 10 }, // 10 uploads per hour
  },
  
  // File upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  
  // Password requirements
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIREMENTS: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  
  // Session
  SESSION_MAX_AGE: 30 * 24 * 60 * 60, // 30 days
  SESSION_UPDATE_AGE: 24 * 60 * 60, // 24 hours
  
  // Email
  EMAIL_TEMPLATES: {
    WELCOME: 'welcome',
    PASSWORD_RESET: 'password-reset',
    ORDER_CONFIRMATION: 'order-confirmation',
    ORDER_SHIPPED: 'order-shipped',
    ORDER_DELIVERED: 'order-delivered',
  },
  
  // Order status
  ORDER_STATUS: {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
  },
  
  // User roles
  USER_ROLES: {
    ADMIN: 'ADMIN',
    CUSTOMER: 'CUSTOMER',
  },
  
  // Product status
  PRODUCT_STATUS: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    OUT_OF_STOCK: 'OUT_OF_STOCK',
  },
  
  // Payment methods
  PAYMENT_METHODS: {
    CARD: 'card',
    PAYPAL: 'paypal',
    APPLE_PAY: 'apple_pay',
    GOOGLE_PAY: 'google_pay',
  },
  
  // Shipping methods
  SHIPPING_METHODS: {
    STANDARD: 'standard',
    EXPRESS: 'express',
    OVERNIGHT: 'overnight',
  },
  
  // Currency
  CURRENCY: {
    CODE: 'USD',
    SYMBOL: '$',
    DECIMAL_PLACES: 2,
  },
  
  // Tax rates
  TAX_RATES: {
    DEFAULT: 0.08, // 8%
    REDUCED: 0.05, // 5%
    ZERO: 0.00, // 0%
  },
  
  // Shipping rates
  SHIPPING_RATES: {
    STANDARD: 9.99,
    EXPRESS: 19.99,
    OVERNIGHT: 39.99,
    FREE_THRESHOLD: 100.00, // Free shipping over $100
  },
  
  // Search
  SEARCH: {
    MIN_QUERY_LENGTH: 2,
    MAX_RESULTS: 50,
    SUGGESTIONS_LIMIT: 10,
  },
  
  // Reviews
  REVIEW: {
    MIN_RATING: 1,
    MAX_RATING: 5,
    MIN_COMMENT_LENGTH: 10,
    MAX_COMMENT_LENGTH: 1000,
  },
  
  // Wishlist
  WISHLIST: {
    MAX_ITEMS: 100,
  },
  
  // Cart
  CART: {
    MAX_ITEMS: 50,
    MAX_QUANTITY_PER_ITEM: 10,
  },
  
  // Admin
  ADMIN: {
    ITEMS_PER_PAGE: 25,
    MAX_EXPORT_RECORDS: 10000,
  },
  
  // API
  API: {
    VERSION: 'v1',
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
  
  // Error codes
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
    CONFLICT_ERROR: 'CONFLICT_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
  },
  
  // HTTP status codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },
} as const

// Export individual constants for easier access
export const {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  CACHE_TTL,
  RATE_LIMITS,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENTS,
  SESSION_MAX_AGE,
  SESSION_UPDATE_AGE,
  EMAIL_TEMPLATES,
  ORDER_STATUS,
  USER_ROLES,
  PRODUCT_STATUS,
  PAYMENT_METHODS,
  SHIPPING_METHODS,
  CURRENCY,
  TAX_RATES,
  SHIPPING_RATES,
  SEARCH,
  REVIEW,
  WISHLIST,
  CART,
  ADMIN,
  API,
  ERROR_CODES,
  HTTP_STATUS,
} = APP_CONSTANTS




