import { env, isDevelopment, isProduction, isTest } from './env';

// Application configuration
export const appConfig = {
  name: 'ZYRA Fashion',
  version: '1.0.0',
  description: 'Ultra-modern e-commerce platform built with Next.js 14, TypeScript, and Tailwind CSS',
  url: env.NEXTAUTH_URL,
  environment: env.NODE_ENV,
  isDevelopment,
  isProduction,
  isTest,
} as const;

// API configuration
export const apiConfig = {
  version: 'v1',
  baseUrl: `${env.NEXTAUTH_URL}/api`,
  timeout: 30000, // 30 seconds
  retries: 3,
  rateLimit: {
    max: env.RATE_LIMIT_MAX,
    window: env.RATE_LIMIT_WINDOW,
  },
} as const;

// Database configuration
export const dbConfig = {
  url: env.DATABASE_URL,
  testUrl: env.TEST_DATABASE_URL,
  connectionTimeout: 10000, // 10 seconds
  queryTimeout: 30000, // 30 seconds
  maxConnections: 20,
  minConnections: 5,
  idleTimeout: 30000, // 30 seconds
  ssl: isProduction ? { rejectUnauthorized: false } : false,
} as const;

// Cache configuration
export const cacheConfig = {
  enabled: env.ENABLE_CACHING,
  redisUrl: env.REDIS_URL,
  defaultTtl: 3600, // 1 hour
  maxTtl: 86400, // 24 hours
  keyPrefix: 'zyra:',
  compression: true,
} as const;

// CDN configuration
export const cdnConfig = {
  enabled: env.ENABLE_CDN,
  url: env.CDN_URL,
  imageOptimization: true,
  imageFormats: ['webp', 'avif', 'jpeg', 'png'],
  imageSizes: [320, 640, 768, 1024, 1280, 1920],
  videoFormats: ['mp4', 'webm'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
} as const;

// Security configuration
export const securityConfig = {
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },
  rateLimit: {
    max: env.RATE_LIMIT_MAX,
    window: env.RATE_LIMIT_WINDOW,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  },
  csrf: {
    enabled: true,
    secret: env.NEXTAUTH_SECRET,
    cookieName: 'csrf-token',
    headerName: 'x-csrf-token',
  },
} as const;

// Logging configuration
export const loggingConfig = {
  level: isDevelopment ? 'debug' : 'info',
  format: isDevelopment ? 'pretty' : 'json',
  enableConsole: true,
  enableFile: isProduction,
  filePath: './logs/app.log',
  maxSize: '10MB',
  maxFiles: 5,
  enableRotation: true,
  verbose: env.VERBOSE_LOGGING,
} as const;

// Monitoring configuration
export const monitoringConfig = {
  enabled: env.ENABLE_MONITORING,
  sentry: {
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    profilesSampleRate: isProduction ? 0.1 : 1.0,
  },
  analytics: {
    enabled: env.ENABLE_ANALYTICS,
    gaId: env.NEXT_PUBLIC_GA_ID,
  },
  healthCheck: {
    enabled: true,
    interval: 30000, // 30 seconds
    timeout: 5000, // 5 seconds
    endpoints: ['/api/health', '/api/health/database', '/api/health/redis'],
  },
} as const;

// Email configuration
export const emailConfig = {
  provider: 'resend',
  apiKey: env.RESEND_API_KEY,
  fromEmail: env.FROM_EMAIL,
  templates: {
    welcome: 'welcome',
    passwordReset: 'password-reset',
    orderConfirmation: 'order-confirmation',
    orderShipped: 'order-shipped',
    orderDelivered: 'order-delivered',
    newsletter: 'newsletter',
  },
  rateLimit: {
    max: 100, // emails per hour
    window: 3600000, // 1 hour
  },
} as const;

// File upload configuration
export const uploadConfig = {
  provider: 'vercel-blob',
  token: env.BLOB_READ_WRITE_TOKEN,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'video/mp4',
    'video/webm',
    'application/pdf',
  ],
  imageOptimization: {
    enabled: true,
    quality: 85,
    formats: ['webp', 'avif', 'jpeg'],
    sizes: [320, 640, 768, 1024, 1280, 1920],
  },
} as const;

// Payment configuration
export const paymentConfig = {
  provider: 'stripe',
  secretKey: env.STRIPE_SECRET_KEY,
  publishableKey: env.STRIPE_PUBLISHABLE_KEY,
  webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  currency: 'USD',
  supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
  webhookTolerance: 300, // 5 minutes
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
} as const;

// Feature flags
export const featureFlags = {
  analytics: env.ENABLE_ANALYTICS,
  monitoring: env.ENABLE_MONITORING,
  caching: env.ENABLE_CACHING,
  cdn: env.ENABLE_CDN,
  debug: env.DEBUG,
  verboseLogging: env.VERBOSE_LOGGING,
} as const;

// Video configuration
export const videoConfig = {
  storagePath: env.VIDEO_STORAGE_PATH || './uploads/videos',
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedFormats: ['mp4', 'webm', 'mov', 'avi'],
  compression: {
    enabled: true,
    quality: 80,
    maxWidth: 1920,
    maxHeight: 1080,
  },
  thumbnail: {
    enabled: true,
    quality: 85,
    format: 'jpeg',
  },
} as const;

// Development configuration
export const devConfig = {
  debug: env.DEBUG,
  verboseLogging: env.VERBOSE_LOGGING,
  hotReload: isDevelopment,
  sourceMaps: isDevelopment,
  profiling: isDevelopment,
} as const;

// Export all configurations
export const config = {
  app: appConfig,
  api: apiConfig,
  database: dbConfig,
  cache: cacheConfig,
  cdn: cdnConfig,
  security: securityConfig,
  logging: loggingConfig,
  monitoring: monitoringConfig,
  email: emailConfig,
  upload: uploadConfig,
  payment: paymentConfig,
  features: featureFlags,
  video: videoConfig,
  dev: devConfig,
} as const;

export default config;