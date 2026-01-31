import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

// CORS configuration interface
interface CorsConfig {
  origin: string | string[] | ((origin: string) => boolean);
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

// Default CORS configuration
const defaultCorsConfig: CorsConfig = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'X-API-Key',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  credentials: false,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// CORS class
class CorsHandler {
  private config: CorsConfig;

  constructor(config: Partial<CorsConfig> = {}) {
    this.config = { ...defaultCorsConfig, ...config };
  }

  // Check if origin is allowed
  private isOriginAllowed(origin: string): boolean {
    const { origin: allowedOrigin } = this.config;

    if (typeof allowedOrigin === 'string') {
      return allowedOrigin === '*' || allowedOrigin === origin;
    }

    if (Array.isArray(allowedOrigin)) {
      return allowedOrigin.includes(origin);
    }

    if (typeof allowedOrigin === 'function') {
      return allowedOrigin(origin);
    }

    return false;
  }

  // Get allowed origins as array
  private getAllowedOrigins(): string[] {
    const { origin: allowedOrigin } = this.config;

    if (typeof allowedOrigin === 'string') {
      return [allowedOrigin];
    }

    if (Array.isArray(allowedOrigin)) {
      return allowedOrigin;
    }

    return ['*'];
  }

  // Set CORS headers on response
  private setCorsHeaders(response: NextResponse, origin: string): void {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', this.config.methods.join(', '));
    response.headers.set('Access-Control-Allow-Headers', this.config.allowedHeaders.join(', '));
    
    if (this.config.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    if (this.config.maxAge) {
      response.headers.set('Access-Control-Max-Age', this.config.maxAge.toString());
    }

    response.headers.set('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  }

  // Handle preflight request
  handlePreflight(request: NextRequest): NextResponse | null {
    const origin = request.headers.get('origin');
    const method = request.headers.get('access-control-request-method');
    const headers = request.headers.get('access-control-request-headers');

    if (!origin) {
      return null;
    }

    // Check if origin is allowed
    if (!this.isOriginAllowed(origin)) {
      logger.warn('CORS: Origin not allowed', {
        origin,
        allowedOrigins: this.getAllowedOrigins(),
        path: request.nextUrl.pathname,
      });

      return new NextResponse(null, { status: 403 });
    }

    // Check if method is allowed
    if (method && !this.config.methods.includes(method)) {
      logger.warn('CORS: Method not allowed', {
        origin,
        method,
        allowedMethods: this.config.methods,
        path: request.nextUrl.pathname,
      });

      return new NextResponse(null, { status: 405 });
    }

    // Check if headers are allowed
    if (headers) {
      const requestedHeaders = headers.split(',').map(h => h.trim());
      const disallowedHeaders = requestedHeaders.filter(h => !this.config.allowedHeaders.includes(h));
      
      if (disallowedHeaders.length > 0) {
        logger.warn('CORS: Headers not allowed', {
          origin,
          disallowedHeaders,
          allowedHeaders: this.config.allowedHeaders,
          path: request.nextUrl.pathname,
        });

        return new NextResponse(null, { status: 400 });
      }
    }

    // Create preflight response
    const response = new NextResponse(null, { 
      status: this.config.optionsSuccessStatus || 204 
    });

    this.setCorsHeaders(response, origin);

    logger.debug('CORS: Preflight request handled', {
      origin,
      method,
      headers,
      path: request.nextUrl.pathname,
    });

    return response;
  }

  // Handle actual request
  handleRequest(request: NextRequest, response: NextResponse): NextResponse {
    const origin = request.headers.get('origin');

    if (origin && this.isOriginAllowed(origin)) {
      this.setCorsHeaders(response, origin);
    }

    return response;
  }

  // Middleware function
  middleware(request: NextRequest): NextResponse | null {
    if (request.method === 'OPTIONS') {
      return this.handlePreflight(request);
    }
    return null;
  }
}

// Default CORS handler
export const corsHandler = new CorsHandler();

// API CORS handler (more permissive for API routes)
export const apiCorsHandler = new CorsHandler({
  origin: (origin: string) => {
    // Allow localhost for development
    if (origin?.includes('localhost') || origin?.includes('127.0.0.1')) {
      return true;
    }
    
    // Allow specific domains
    const allowedDomains = [
      'https://zyra-ultra.vercel.app',
      'https://www.zyra-ultra.vercel.app',
      'https://zyra-ultra.com',
      'https://www.zyra-ultra.com',
    ];
    
    return allowedDomains.includes(origin);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'X-API-Key',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  credentials: true,
});

// Public CORS handler (for public API endpoints)
export const publicCorsHandler = new CorsHandler({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
  ],
  credentials: false,
});

// CORS middleware function
export function createCorsMiddleware(handler: CorsHandler = corsHandler) {
  return (request: NextRequest): NextResponse | null => {
    return handler.middleware(request);
  };
}

// CORS wrapper function for API routes (decorator version)
export function withCORSDecorator(handler: CorsHandler = apiCorsHandler) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (request: NextRequest, ...args: any[]) {
      // Handle preflight requests
      const preflightResponse = handler.middleware(request);
      if (preflightResponse) {
        return preflightResponse;
      }

      // Execute original method
      const response = await originalMethod.apply(this, [request, ...args]);

      // Handle CORS for actual requests
      if (response instanceof NextResponse) {
        return handler.handleRequest(request, response);
      }

      return response;
    };

    return descriptor;
  };
}

// CORS wrapper function for API routes (function version)
export function withCORS(handler: Function, corsHandler: CorsHandler = apiCorsHandler) {
  return async (request: NextRequest, ...args: any[]) => {
    // Handle preflight requests
    const preflightResponse = corsHandler.middleware(request);
    if (preflightResponse) {
      return preflightResponse;
    }

    // Execute handler
    const response = await handler(request, ...args);

    // Handle CORS for actual requests
    if (response instanceof NextResponse) {
      return corsHandler.handleRequest(request, response);
    }

    return response;
  };
}

// Error handler wrapper
export function withErrorHandler(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      logger.error('API Error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        path: request.nextUrl.pathname,
        method: request.method,
      });

      return NextResponse.json(
        {
          success: false,
          message: error instanceof Error ? error.message : 'Internal server error',
          error: 'INTERNAL_ERROR'
        },
        { status: 500 }
      );
    }
  };
}

// Utility function to check if request is from allowed origin
export function isAllowedOrigin(origin: string, allowedOrigins: string[]): boolean {
  return allowedOrigins.includes(origin) || allowedOrigins.includes('*');
}