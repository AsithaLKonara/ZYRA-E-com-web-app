import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { logger } from '@/lib/logger';
import { monitoring } from '@/lib/monitoring';
import { UserRole } from '@/lib/auth-utils';

// Protected routes configuration
const PROTECTED_ROUTES = {
  // User routes
  '/profile': { roles: [UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN] },
  '/orders': { roles: [UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN] },
  '/wishlist': { roles: [UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN] },
  '/cart': { roles: [UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN] },
  '/checkout': { roles: [UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN] },
  
  // Admin routes
  '/admin': { roles: [UserRole.ADMIN] },
  '/admin/dashboard': { roles: [UserRole.ADMIN] },
  '/admin/products': { roles: [UserRole.ADMIN, UserRole.MODERATOR] },
  '/admin/orders': { roles: [UserRole.ADMIN, UserRole.MODERATOR] },
  '/admin/users': { roles: [UserRole.ADMIN] },
  '/admin/categories': { roles: [UserRole.ADMIN, UserRole.MODERATOR] },
  '/admin/analytics': { roles: [UserRole.ADMIN] },
  '/admin/settings': { roles: [UserRole.ADMIN] },
  
  // Moderator routes
  '/moderator': { roles: [UserRole.MODERATOR, UserRole.ADMIN] },
  '/moderator/reviews': { roles: [UserRole.MODERATOR, UserRole.ADMIN] },
  '/moderator/content': { roles: [UserRole.MODERATOR, UserRole.ADMIN] },
} as const;

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/products',
  '/products/[id]',
  '/categories',
  '/categories/[id]',
  '/search',
  '/auth/signin',
  '/auth/signup',
  '/auth/error',
  '/auth/verify-request',
  '/auth/new-user',
  '/api/health',
  '/api/products',
  '/api/categories',
  '/api/search',
  '/api/public',
] as const;

// API routes that require authentication
const PROTECTED_API_ROUTES = [
  '/api/cart',
  '/api/orders',
  '/api/wishlist',
  '/api/reviews',
  '/api/users',
  '/api/admin',
  '/api/moderator',
] as const;

// Authentication middleware
export async function authMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  const startTime = Date.now();
  
  try {
    // Skip authentication for public routes
    if (isPublicRoute(pathname)) {
      return null;
    }

    // Get token from request
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Check if route requires authentication
    if (isProtectedRoute(pathname)) {
      if (!token) {
        logger.warn('Unauthenticated access attempt to protected route', {
          path: pathname,
          ip: request.headers.get('x-forwarded-for') || request.ip,
          userAgent: request.headers.get('user-agent'),
        });

        monitoring.recordCounter('auth.middleware.unauthorized', 1, {
          path: pathname,
        });

        // Redirect to sign in page
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }

      // Check role-based access
      const requiredRoles = getRequiredRoles(pathname);
      if (requiredRoles && !requiredRoles.includes(token.role as UserRole)) {
        logger.warn('Unauthorized access attempt - insufficient role', {
          path: pathname,
          userId: token.id,
          userRole: token.role,
          requiredRoles,
          ip: request.headers.get('x-forwarded-for') || request.ip,
        });

        monitoring.recordCounter('auth.middleware.forbidden', 1, {
          path: pathname,
          userRole: token.role,
          requiredRoles: requiredRoles.join(','),
        });

        // Redirect to unauthorized page
        return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
      }

      // Add user information to headers
      const response = NextResponse.next();
      response.headers.set('x-user-id', token.id as string);
      response.headers.set('x-user-email', token.email as string);
      response.headers.set('x-user-role', token.role as string);
      response.headers.set('x-user-name', token.name as string);

      // Record successful authentication
      monitoring.recordCounter('auth.middleware.authorized', 1, {
        path: pathname,
        userRole: token.role,
      });

      logger.debug('User authorized for protected route', {
        path: pathname,
        userId: token.id,
        userRole: token.role,
        duration: Date.now() - startTime,
      });

      return response;
    }

    // Check API routes
    if (isProtectedApiRoute(pathname)) {
      if (!token) {
        logger.warn('Unauthenticated API access attempt', {
          path: pathname,
          method: request.method,
          ip: request.headers.get('x-forwarded-for') || request.ip,
        });

        monitoring.recordCounter('auth.api.unauthorized', 1, {
          path: pathname,
          method: request.method,
        });

        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Check role-based access for API routes
      const requiredRoles = getRequiredRoles(pathname);
      if (requiredRoles && !requiredRoles.includes(token.role as UserRole)) {
        logger.warn('Unauthorized API access attempt - insufficient role', {
          path: pathname,
          method: request.method,
          userId: token.id,
          userRole: token.role,
          requiredRoles,
        });

        monitoring.recordCounter('auth.api.forbidden', 1, {
          path: pathname,
          method: request.method,
          userRole: token.role,
          requiredRoles: requiredRoles.join(','),
        });

        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Add user information to headers for API routes
      const response = NextResponse.next();
      response.headers.set('x-user-id', token.id as string);
      response.headers.set('x-user-email', token.email as string);
      response.headers.set('x-user-role', token.role as string);
      response.headers.set('x-user-name', token.name as string);

      // Record successful API authentication
      monitoring.recordCounter('auth.api.authorized', 1, {
        path: pathname,
        method: request.method,
        userRole: token.role,
      });

      logger.debug('User authorized for API route', {
        path: pathname,
        method: request.method,
        userId: token.id,
        userRole: token.role,
        duration: Date.now() - startTime,
      });

      return response;
    }

    // No authentication required
    return null;

  } catch (error) {
    logger.error('Authentication middleware error', {
      path: pathname,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime,
    });

    monitoring.recordCounter('auth.middleware.error', 1, {
      path: pathname,
    });

    // For API routes, return error response
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      );
    }

    // For page routes, redirect to error page
    return NextResponse.redirect(new URL('/auth/error', request.url));
  }
}

// Check if route is public
function isPublicRoute(pathname: string): boolean {
  // Exact matches
  if (PUBLIC_ROUTES.includes(pathname as any)) {
    return true;
  }

  // Dynamic route matches
  for (const route of PUBLIC_ROUTES) {
    if (route.includes('[') && route.includes(']')) {
      const pattern = route
        .replace(/\[.*?\]/g, '[^/]+')
        .replace(/\//g, '\\/');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(pathname)) {
        return true;
      }
    }
  }

  return false;
}

// Check if route is protected
function isProtectedRoute(pathname: string): boolean {
  return Object.keys(PROTECTED_ROUTES).some(route => {
    if (route.includes('[') && route.includes(']')) {
      const pattern = route
        .replace(/\[.*?\]/g, '[^/]+')
        .replace(/\//g, '\\/');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(pathname);
    }
    return pathname.startsWith(route);
  });
}

// Check if API route is protected
function isProtectedApiRoute(pathname: string): boolean {
  return PROTECTED_API_ROUTES.some(route => pathname.startsWith(route));
}

// Get required roles for route
function getRequiredRoles(pathname: string): UserRole[] | null {
  for (const [route, config] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      return config.roles;
    }
  }
  return null;
}

// Check if user has required role
function hasRequiredRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

// Get user role from token
function getUserRole(token: any): UserRole | null {
  return token?.role as UserRole || null;
}

// Check if user is admin
function isAdmin(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN;
}

// Check if user is moderator or admin
function isModeratorOrAdmin(userRole: UserRole): boolean {
  return userRole === UserRole.MODERATOR || userRole === UserRole.ADMIN;
}

// Check if user is authenticated
function isAuthenticated(token: any): boolean {
  return !!token;
}

// Get authentication context
function getAuthContext(token: any): {
  userId?: string;
  email?: string;
  role?: UserRole;
  isAuthenticated: boolean;
} {
  return {
    userId: token?.id,
    email: token?.email,
    role: token?.role as UserRole,
    isAuthenticated: !!token,
  };
}

// Export utility functions
export {
  isPublicRoute,
  isProtectedRoute,
  isProtectedApiRoute,
  getRequiredRoles,
  hasRequiredRole,
  getUserRole,
  isAdmin,
  isModeratorOrAdmin,
  isAuthenticated,
  getAuthContext,
};

export default authMiddleware;




