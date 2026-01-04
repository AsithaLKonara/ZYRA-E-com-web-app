import { NextRequest, NextResponse } from 'next/server';
import { securityConfig } from './config';
import { logger } from './logger';

// Security headers interface
interface SecurityHeaders {
  [key: string]: string | number | boolean;
}

// Security middleware class
class SecurityMiddleware {
  private headers: SecurityHeaders;

  constructor() {
    this.headers = {
      ...securityConfig.headers,
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Content-Security-Policy': this.generateCSP(),
      'X-XSS-Protection': '1; mode=block',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    };
  }

  // Generate Content Security Policy
  private generateCSP(): string {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.stripe.com https://www.google-analytics.com https://sentry.io",
      "frame-src 'self' https://js.stripe.com https://www.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ];

    if (isDevelopment) {
      directives.push("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    }

    return directives.join('; ');
  }

  // Set security headers
  setSecurityHeaders(response: NextResponse): NextResponse {
    Object.entries(this.headers).forEach(([key, value]) => {
      response.headers.set(key, value.toString());
    });

    return response;
  }

  // Set custom security headers
  setCustomHeaders(response: NextResponse, customHeaders: SecurityHeaders): NextResponse {
    Object.entries(customHeaders).forEach(([key, value]) => {
      response.headers.set(key, value.toString());
    });

    return response;
  }

  // Remove dangerous headers
  removeDangerousHeaders(response: NextResponse): NextResponse {
    const dangerousHeaders = [
      'Server',
      'X-Powered-By',
      'X-AspNet-Version',
      'X-AspNetMvc-Version',
    ];

    dangerousHeaders.forEach(header => {
      response.headers.delete(header);
    });

    return response;
  }

  // Add CSRF protection
  addCSRFProtection(response: NextResponse, token: string): NextResponse {
    response.headers.set('X-CSRF-Token', token);
    response.cookies.set('csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600, // 1 hour
    });

    return response;
  }

  // Add API key validation
  validateAPIKey(request: NextRequest): boolean {
    const apiKey = request.headers.get('X-API-Key');
    const validAPIKey = process.env.API_KEY;

    if (!validAPIKey) {
      logger.warn('API key validation failed: No API key configured');
      return false;
    }

    if (!apiKey) {
      logger.warn('API key validation failed: No API key provided');
      return false;
    }

    if (apiKey !== validAPIKey) {
      logger.warn('API key validation failed: Invalid API key', {
        providedKey: apiKey.substring(0, 8) + '...',
        path: request.nextUrl.pathname,
      });
      return false;
    }

    return true;
  }

  // Add request validation
  validateRequest(request: NextRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /expression\s*\(/i,
      /vbscript:/i,
      /data:text\/html/i,
    ];

    const url = request.nextUrl.toString();
    const userAgent = request.headers.get('user-agent') || '';

    suspiciousPatterns.forEach(pattern => {
      if (pattern.test(url) || pattern.test(userAgent)) {
        errors.push(`Suspicious pattern detected: ${pattern.source}`);
      }
    });

    // Check for SQL injection patterns
    const sqlPatterns = [
      /union\s+select/i,
      /drop\s+table/i,
      /delete\s+from/i,
      /insert\s+into/i,
      /update\s+set/i,
      /or\s+1\s*=\s*1/i,
      /and\s+1\s*=\s*1/i,
    ];

    sqlPatterns.forEach(pattern => {
      if (pattern.test(url)) {
        errors.push(`SQL injection pattern detected: ${pattern.source}`);
      }
    });

    // Check for path traversal
    if (url.includes('../') || url.includes('..\\')) {
      errors.push('Path traversal attempt detected');
    }

    // Check for null bytes
    if (url.includes('%00') || url.includes('\0')) {
      errors.push('Null byte injection attempt detected');
    }

    // Check for oversized requests
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB
      errors.push('Request too large');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Log security events
  logSecurityEvent(event: string, request: NextRequest, details?: Record<string, any>): void {
    logger.warn(`Security event: ${event}`, {
      event,
      path: request.nextUrl.pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.ip,
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  // Main middleware function
  middleware(request: NextRequest): NextResponse | null {
    // Validate request
    const validation = this.validateRequest(request);
    if (!validation.valid) {
      this.logSecurityEvent('Request validation failed', request, {
        errors: validation.errors,
      });

      return new NextResponse('Bad Request', { status: 400 });
    }

    // Check for API key if required
    if (request.nextUrl.pathname.startsWith('/api/admin')) {
      if (!this.validateAPIKey(request)) {
        this.logSecurityEvent('API key validation failed', request);
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    return null;
  }

  // Apply security headers to response
  applySecurityHeaders(response: NextResponse): NextResponse {
    let securedResponse = this.setSecurityHeaders(response);
    securedResponse = this.removeDangerousHeaders(securedResponse);
    
    return securedResponse;
  }
}

// Create security middleware instance
export const securityMiddleware = new SecurityMiddleware();

// Security middleware factory
export function createSecurityMiddleware(customHeaders?: SecurityHeaders) {
  const middleware = new SecurityMiddleware();
  
  if (customHeaders) {
    middleware.setCustomHeaders = (response: NextResponse) => {
      return middleware.setCustomHeaders(response, customHeaders);
    };
  }
  
  return middleware;
}

// Security middleware decorator
export function withSecurity(handler: SecurityMiddleware = securityMiddleware) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (request: NextRequest, ...args: any[]) {
      // Apply security middleware
      const securityResponse = handler.middleware(request);
      if (securityResponse) {
        return securityResponse;
      }

      // Execute original method
      const response = await originalMethod.apply(this, [request, ...args]);

      // Apply security headers to response
      if (response instanceof NextResponse) {
        return handler.applySecurityHeaders(response);
      }

      return response;
    };

    return descriptor;
  };
}

// Utility functions
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

export function generateCSRFToken(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken;
}

export function isSecureRequest(request: NextRequest): boolean {
  const protocol = request.nextUrl.protocol;
  const host = request.headers.get('host');
  
  return protocol === 'https:' || (host ? host.includes('localhost') : false);
}

export default securityMiddleware;