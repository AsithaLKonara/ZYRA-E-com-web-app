import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { logger } from './logger'
import { rateLimiter } from './rate-limiter'
import { config } from './config'
import { env } from './env'

// Auth middleware for API routes
export function withAuth(
  handler: (...args: any[]) => Promise<NextResponse>,
  options: {
    requireAdmin?: boolean
    requireActive?: boolean
    rateLimit?: boolean
  } = {}
) {
  return async (...args: any[]): Promise<NextResponse> => {
    const request = args[0] as NextRequest

    try {
      // Apply rate limiting if enabled
      if (options.rateLimit !== false) {
        const rateLimitResponse = rateLimiter.middleware(request)
        if (rateLimitResponse) {
          return rateLimitResponse
        }
      }

      // Get token from request
      const token = await getToken({ 
        req: request, 
        secret: env.NEXTAUTH_SECRET 
      })

      if (!token) {
        logger.warn('Unauthenticated API request', {
          url: request.url,
          method: request.method,
        })
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Check if user is active
      if (options.requireActive !== false) {
        if (!token.isActive) {
          logger.warn('Inactive user attempted API access', {
            userId: token.id,
            url: request.url,
          })
          return NextResponse.json(
            { success: false, error: 'Account is deactivated' },
            { status: 403 }
          )
        }
      }

      // Check admin requirement
      if (options.requireAdmin) {
        if (token.role !== 'ADMIN') {
          logger.warn('Non-admin user attempted admin API access', {
            userId: token.id,
            role: token.role,
            url: request.url,
          })
          return NextResponse.json(
            { success: false, error: 'Admin access required' },
            { status: 403 }
          )
        }
      }

      // Add user info to request
      const requestWithUser = {
        ...request,
        user: {
          id: token.id,
          email: token.email,
          name: token.name,
          role: token.role,
          isActive: token.isActive,
        },
      }

      // Execute handler with authenticated request
      return await handler(requestWithUser as any, ...args.slice(1) as any)

    } catch (error) {
      logger.error('Auth middleware error:', {}, error instanceof Error ? error : new Error(String(error)))
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}

// Admin-only middleware
export function withAdminAuth(
  handler: (...args: any[]) => Promise<NextResponse>
) {
  return withAuth(handler, { requireAdmin: true })
}

// Customer-only middleware
export function withCustomerAuth(
  handler: (...args: any[]) => Promise<NextResponse>
) {
  return withAuth(handler, { requireAdmin: false })
}

// Optional auth middleware (doesn't require authentication)
export function withOptionalAuth(
  handler: (...args: any[]) => Promise<NextResponse>
) {
  return async (...args: any[]): Promise<NextResponse> => {
    const request = args[0] as NextRequest

    try {
      // Get token from request
      const token = await getToken({ 
        req: request, 
        secret: env.NEXTAUTH_SECRET 
      })

      // Add user info to request if authenticated
      const requestWithUser = {
        ...request,
        user: token ? {
          id: token.id,
          email: token.email,
          name: token.name,
          role: token.role,
          isActive: token.isActive,
        } : null,
      }

      // Execute handler
      return await handler(requestWithUser as any, ...args.slice(1))

    } catch (error) {
      logger.error('Optional auth middleware error:', {}, error instanceof Error ? error : new Error(String(error)))
      return await handler(request as any, ...args.slice(1))
    }
  }
}

// Rate limit middleware
export function withRateLimit(
  handler: (...args: any[]) => Promise<NextResponse>,
  customRateLimit?: {
    windowMs: number
    max: number
  }
) {
  return async (...args: any[]): Promise<NextResponse> => {
    const request = args[0] as NextRequest

    try {
      // Apply custom rate limit if provided
      if (customRateLimit) {
        const { RateLimiter: RateLimiterClass } = require('./rate-limiter');
        const customLimiter = new RateLimiterClass({
          window: customRateLimit.windowMs,
          max: customRateLimit.max,
        });
        const rateLimitResponse = customLimiter.middleware(request);
        if (rateLimitResponse) {
          return rateLimitResponse;
        }
      } else {
        // Apply default rate limit
        const rateLimitResponse = rateLimiter.middleware(request);
        if (rateLimitResponse) {
          return rateLimitResponse;
        }
      }

      // Execute handler
      return await handler(...args)

    } catch (error) {
      logger.error('Rate limit middleware error:', {}, error instanceof Error ? error : new Error(String(error)))
      return NextResponse.json(
        { success: false, error: 'Rate limit check failed' },
        { status: 500 }
      )
    }
  }
}

// Combined middleware
export function withAuthAndRateLimit(
  handler: (...args: any[]) => Promise<NextResponse>,
  options: {
    requireAdmin?: boolean
    requireActive?: boolean
    rateLimit?: {
      windowMs: number
      max: number
    }
  } = {}
) {
  return withAuth(
    withRateLimit(handler, options.rateLimit),
    {
      requireAdmin: options.requireAdmin,
      requireActive: options.requireActive,
      rateLimit: false, // Already handled by withRateLimit
    }
  )
}

