import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  // Application Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),

  // Database Configuration
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Authentication Providers (Optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // Payment Processing
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Email Service
  RESEND_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),

  // File Storage
  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  // Monitoring & Analytics
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_GA_ID: z.string().optional(),

  // Redis Cache (Optional)
  REDIS_URL: z.string().url().optional(),

  // External Services
  CDN_URL: z.string().url().optional(),

  // Security Configuration
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  RATE_LIMIT_WINDOW: z.string().transform(Number).default('900000'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Feature Flags
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_MONITORING: z.string().transform(val => val === 'true').default('true'),
  ENABLE_CACHING: z.string().transform(val => val === 'true').default('true'),
  ENABLE_CDN: z.string().transform(val => val === 'true').default('true'),

  // Development Configuration
  DEBUG: z.string().transform(val => val === 'true').default('false'),
  VERBOSE_LOGGING: z.string().transform(val => val === 'true').default('false'),

  // Test Configuration
  TEST_DATABASE_URL: z.string().url().optional(),
});

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      // Use safeParse for Edge Runtime compatibility
      // Return default values instead of exiting
      return envSchema.parse({
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'development',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production',
        DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/zyra_fashion',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      });
    }
    throw error;
  }
}

// Export validated environment variables
export const env = validateEnv();

// Type-safe environment variables
export type Env = z.infer<typeof envSchema>;

// Environment-specific configurations
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Feature flags
export const features = {
  analytics: env.ENABLE_ANALYTICS,
  monitoring: env.ENABLE_MONITORING,
  caching: env.ENABLE_CACHING,
  cdn: env.ENABLE_CDN,
} as const;

// Security configuration
export const security = {
  rateLimit: {
    max: env.RATE_LIMIT_MAX,
    window: env.RATE_LIMIT_WINDOW,
  },
  cors: {
    origin: env.CORS_ORIGIN,
  },
} as const;

// Database configuration
export const database = {
  url: env.DATABASE_URL,
  testUrl: env.TEST_DATABASE_URL,
} as const;

// External services
export const services = {
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    publishableKey: env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },
  email: {
    resendApiKey: env.RESEND_API_KEY,
    fromEmail: env.FROM_EMAIL,
  },
  storage: {
    blobToken: env.BLOB_READ_WRITE_TOKEN,
  },
  monitoring: {
    sentryDsn: env.SENTRY_DSN,
    gaId: env.NEXT_PUBLIC_GA_ID,
  },
  cache: {
    redisUrl: env.REDIS_URL,
  },
  cdn: {
    url: env.CDN_URL,
  },
} as const;

// Authentication providers
export const authProviders = {
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  },
  github: {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  },
} as const;

// Development configuration
export const dev = {
  debug: env.DEBUG,
  verboseLogging: env.VERBOSE_LOGGING,
} as const;