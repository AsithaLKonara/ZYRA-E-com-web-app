import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';
import { securityConfig } from './config';

// Rate limit store interface
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore: RateLimitStore = {};

// Rate limit configuration
interface RateLimitConfig {
  max: number;
  window: number; // in milliseconds
  keyGenerator?: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// Default rate limit configuration
const defaultConfig: RateLimitConfig = {
  max: securityConfig.rateLimit.max,
  window: securityConfig.rateLimit.window,
  keyGenerator: (request: NextRequest) => {
    // Use IP address as default key
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
    return ip || 'unknown';
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

// Rate limiter class
export class RateLimiter {
  private config: RateLimitConfig;
  private store: RateLimitStore;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.store = rateLimitStore;
  }

  // Generate rate limit key
  private generateKey(request: NextRequest): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(request);
    }
    return 'default';
  }

  // Check if request is within rate limit
  private checkLimit(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowStart = now - this.config.window;

    // Clean up expired entries
    Object.keys(this.store).forEach(storeKey => {
      const entry = this.store[storeKey];
      if (entry && entry.resetTime < now) {
        delete this.store[storeKey];
      }
    });

    // Get or create entry for this key
    if (!this.store[key]) {
      this.store[key] = {
        count: 0,
        resetTime: now + this.config.window,
      };
    }

    const entry = this.store[key];

    // Reset if window has passed
    if (entry.resetTime < now) {
      entry.count = 0;
      entry.resetTime = now + this.config.window;
    }

    // Check if limit exceeded
    const allowed = entry.count < this.config.max;
    const remaining = Math.max(0, this.config.max - entry.count);

    return {
      allowed,
      remaining,
      resetTime: entry.resetTime,
    };
  }

  // Increment counter for key
  private increment(key: string): void {
    if (!this.store[key]) {
      this.store[key] = {
        count: 0,
        resetTime: Date.now() + this.config.window,
      };
    }

    this.store[key].count++;
  }

  // Middleware function
  middleware(request: NextRequest): NextResponse | null {
    const key = this.generateKey(request);
    const { allowed, remaining, resetTime } = this.checkLimit(key);

    // Add rate limit headers
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', this.config.max.toString());
    headers.set('X-RateLimit-Remaining', remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());

    if (!allowed) {
      logger.warn('Rate limit exceeded', {
        key,
        limit: this.config.max,
        remaining,
        resetTime: new Date(resetTime).toISOString(),
        path: request.nextUrl.pathname,
        method: request.method,
      });

      return NextResponse.json(
        {
          error: {
            message: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            statusCode: 429,
            timestamp: new Date().toISOString(),
            retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
          },
        },
        {
          status: 429,
          headers,
        }
      );
    }

    // Increment counter
    this.increment(key);

    return null;
  }

  // Check rate limit without incrementing
  check(request: NextRequest): { allowed: boolean; remaining: number; resetTime: number } {
    const key = this.generateKey(request);
    return this.checkLimit(key);
  }

  // Reset rate limit for a key
  reset(key: string): void {
    delete this.store[key];
  }

  // Get current rate limit status
  getStatus(key: string): { count: number; remaining: number; resetTime: number } | null {
    const entry = this.store[key];
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (entry.resetTime < now) {
      return {
        count: 0,
        remaining: this.config.max,
        resetTime: now + this.config.window,
      };
    }

    return {
      count: entry.count,
      remaining: Math.max(0, this.config.max - entry.count),
      resetTime: entry.resetTime,
    };
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      const entry = this.store[key];
      if (entry && entry.resetTime < now) {
        delete this.store[key];
      }
    });
  }
}

// Create default rate limiter instance
export const rateLimiter = new RateLimiter();

// Create specialized rate limiters
export const createRateLimiter = (config: Partial<RateLimitConfig>) => {
  return new RateLimiter(config);
};

// API rate limiter (more restrictive)
export const apiRateLimiter = new RateLimiter({
  max: 100, // 100 requests per window
  window: 15 * 60 * 1000, // 15 minutes
  keyGenerator: (request: NextRequest) => {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
    const path = request.nextUrl.pathname;
    return `${ip}:${path}`;
  },
});

// Auth rate limiter (very restrictive)
export const authRateLimiter = new RateLimiter({
  max: 5, // 5 attempts per window
  window: 15 * 60 * 1000, // 15 minutes
  keyGenerator: (request: NextRequest) => {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
    return `auth:${ip}`;
  },
});

// Upload rate limiter
export const uploadRateLimiter = new RateLimiter({
  max: 10, // 10 uploads per window
  window: 60 * 60 * 1000, // 1 hour
  keyGenerator: (request: NextRequest) => {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
    return `upload:${ip}`;
  },
});

// Search rate limiter
export const searchRateLimiter = new RateLimiter({
  max: 30, // 30 searches per window
  window: 60 * 1000, // 1 minute
  keyGenerator: (request: NextRequest) => {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
    return `search:${ip}`;
  },
});

// Rate limit middleware factory
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return (request: NextRequest): NextResponse | null => {
    return limiter.middleware(request);
  };
}

// Rate limit decorator for API routes
export function withRateLimit(limiter: RateLimiter = rateLimiter) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (request: NextRequest, ...args: any[]) {
      const rateLimitResponse = limiter.middleware(request);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      return originalMethod.apply(this, [request, ...args]);
    };

    return descriptor;
  };
}

// Cleanup expired entries every 5 minutes
if (process.env.NEXT_RUNTIME !== 'edge') {
  setInterval(() => {
    rateLimiter.cleanup();
    apiRateLimiter.cleanup();
    authRateLimiter.cleanup();
    uploadRateLimiter.cleanup();
    searchRateLimiter.cleanup();
  }, 5 * 60 * 1000);
}

export default rateLimiter;