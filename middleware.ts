import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter, authRateLimiter, apiRateLimiter } from './lib/rate-limiter';
import { corsHandler, apiCorsHandler, publicCorsHandler } from './lib/cors';
import { securityMiddleware } from './lib/security-middleware';
import { apiVersioning } from './lib/api-versioning';
import { logger } from './lib/logger';
import { monitoring } from './lib/monitoring';
import { authMiddleware } from './middleware/auth';

// Middleware configuration
const MIDDLEWARE_CONFIG = {
  // Rate limiting
  rateLimit: {
    enabled: true,
    skipPaths: ['/api/health', '/api/status'],
  },
  // CORS
  cors: {
    enabled: true,
    skipPaths: ['/api/health', '/api/status'],
  },
  // Security
  security: {
    enabled: true,
    skipPaths: ['/api/health', '/api/status'],
  },
  // API versioning
  apiVersioning: {
    enabled: true,
    skipPaths: ['/api/health', '/api/status'],
  },
  // Monitoring
  monitoring: {
    enabled: true,
    skipPaths: ['/api/health', '/api/status'],
  },
} as const;

// Check if path should be skipped
function shouldSkipPath(pathname: string, skipPaths: string[]): boolean {
  return skipPaths.some(skipPath => pathname.startsWith(skipPath));
}

// Main middleware function
export function middleware(request: NextRequest): NextResponse | null {
  const { pathname, method } = request.nextUrl;
  const startTime = Date.now();

  // Log request
  logger.info(`Incoming request: ${method} ${pathname}`, {
    method,
    pathname,
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || request.ip,
  });

  // Record request metric
  if (monitoring.getStatus().enabled) {
    monitoring.recordCounter('requests.total', 1, {
      method,
      path: pathname,
    });
  }

  // Security middleware
  if (MIDDLEWARE_CONFIG.security.enabled && !shouldSkipPath(pathname, MIDDLEWARE_CONFIG.security.skipPaths)) {
    const securityResponse = securityMiddleware.middleware(request);
    if (securityResponse) {
      logger.warn('Request blocked by security middleware', {
        pathname,
        method,
        reason: 'Security check failed',
      });
      return securityResponse;
    }
  }

  // CORS middleware
  if (MIDDLEWARE_CONFIG.cors.enabled && !shouldSkipPath(pathname, MIDDLEWARE_CONFIG.cors.skipPaths)) {
    let corsHandlerToUse = corsHandler;

    // Use specific CORS handler based on path
    if (pathname.startsWith('/api/admin')) {
      // Admin routes - very restrictive CORS
      corsHandlerToUse = corsHandler; // Use default for now
    } else if (pathname.startsWith('/api/public')) {
      // Public API routes - permissive CORS
      corsHandlerToUse = publicCorsHandler;
    } else if (pathname.startsWith('/api/')) {
      // Regular API routes - balanced CORS
      corsHandlerToUse = apiCorsHandler;
    }

    const corsResponse = corsHandlerToUse.middleware(request);
    if (corsResponse) {
      logger.debug('CORS preflight handled', {
        pathname,
        method,
      });
      return corsResponse;
    }
  }

  // Rate limiting middleware
  if (MIDDLEWARE_CONFIG.rateLimit.enabled && !shouldSkipPath(pathname, MIDDLEWARE_CONFIG.rateLimit.skipPaths)) {
    let rateLimiterToUse = rateLimiter;

    // Use specific rate limiter based on path
    if (pathname.startsWith('/api/auth/')) {
      // Auth routes - very restrictive rate limiting
      rateLimiterToUse = authRateLimiter;
    } else if (pathname.startsWith('/api/')) {
      // API routes - moderate rate limiting
      rateLimiterToUse = apiRateLimiter;
    }

    const rateLimitResponse = rateLimiterToUse.middleware(request);
    if (rateLimitResponse) {
      logger.warn('Request rate limited', {
        pathname,
        method,
        limit: rateLimiterToUse.getStatus('')?.remaining || 0,
      });
      return rateLimitResponse;
    }
  }

  // API versioning middleware
  if (MIDDLEWARE_CONFIG.apiVersioning.enabled && !shouldSkipPath(pathname, MIDDLEWARE_CONFIG.apiVersioning.skipPaths)) {
    if (pathname.startsWith('/api/')) {
      const { version, response } = apiVersioning.handleVersion(request);
      
      if (response) {
        logger.warn('API versioning issue', {
          pathname,
          method,
          version,
        });
        return response;
      }

      // Add version to request headers for downstream use
      request.headers.set('X-API-Version', version);
    }
  }

  // Create response
  const response = NextResponse.next();

  // Apply security headers
  if (MIDDLEWARE_CONFIG.security.enabled && !shouldSkipPath(pathname, MIDDLEWARE_CONFIG.security.skipPaths)) {
    securityMiddleware.applySecurityHeaders(response);
  }

  // Apply CORS headers
  if (MIDDLEWARE_CONFIG.cors.enabled && !shouldSkipPath(pathname, MIDDLEWARE_CONFIG.cors.skipPaths)) {
    let corsHandlerToUse = corsHandler;

    if (pathname.startsWith('/api/admin')) {
      corsHandlerToUse = corsHandler;
    } else if (pathname.startsWith('/api/public')) {
      corsHandlerToUse = publicCorsHandler;
    } else if (pathname.startsWith('/api/')) {
      corsHandlerToUse = apiCorsHandler;
    }

    corsHandlerToUse.handleRequest(request, response);
  }

  // Add API version headers
  if (MIDDLEWARE_CONFIG.apiVersioning.enabled && !shouldSkipPath(pathname, MIDDLEWARE_CONFIG.apiVersioning.skipPaths)) {
    if (pathname.startsWith('/api/')) {
      const version = request.headers.get('X-API-Version') || 'v1';
      apiVersioning.addVersionHeaders(response, version);
    }
  }

  // Add monitoring headers
  if (monitoring.getStatus().enabled) {
    const duration = Date.now() - startTime;
    response.headers.set('X-Response-Time', `${duration}ms`);
    response.headers.set('X-Request-ID', `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }

  // Log response
  logger.info(`Request processed: ${method} ${pathname}`, {
    method,
    pathname,
    statusCode: response.status,
    duration: Date.now() - startTime,
  });

  // Record response metric
  if (monitoring.getStatus().enabled) {
    const duration = Date.now() - startTime;
    monitoring.recordTimer('requests.duration', duration, {
      method,
      path: pathname,
    });
  }

  return response;
}

// Middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

// Export middleware utilities
export {
  shouldSkipPath,
  MIDDLEWARE_CONFIG,
};

export default middleware;