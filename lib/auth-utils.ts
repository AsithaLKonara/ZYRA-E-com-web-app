import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logger } from './logger';
import { monitoring } from './monitoring';

// User roles
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

// Permission levels
export enum PermissionLevel {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  ADMIN = 'admin',
}

// Permission matrix
const PERMISSIONS: Record<UserRole, PermissionLevel[]> = {
  [UserRole.USER]: [PermissionLevel.READ],
  [UserRole.MODERATOR]: [PermissionLevel.READ, PermissionLevel.WRITE],
  [UserRole.ADMIN]: [PermissionLevel.READ, PermissionLevel.WRITE, PermissionLevel.DELETE, PermissionLevel.ADMIN],
};

// Session user interface
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  emailVerified?: Date;
}

// Authentication utilities class
export class AuthUtils {
  // Get current session
  static async getSession(): Promise<SessionUser | null> {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        return null;
      }

      return session.user as SessionUser;
    } catch (error) {
      logger.error('Failed to get session', {
        error: error.message,
        stack: error.stack,
      });
      return null;
  }
}

// Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return !!session;
}

// Check if user has specific role
  static async hasRole(role: UserRole): Promise<boolean> {
    const session = await this.getSession();
    return session?.role === role;
  }

  // Check if user has any of the specified roles
  static async hasAnyRole(roles: UserRole[]): Promise<boolean> {
    const session = await this.getSession();
    return session ? roles.includes(session.role) : false;
  }

  // Check if user has permission
  static async hasPermission(permission: PermissionLevel): Promise<boolean> {
    const session = await this.getSession();
    
    if (!session) {
      return false;
    }

    const userPermissions = PERMISSIONS[session.role] || [];
    return userPermissions.includes(permission);
}

// Check if user is admin
  static async isAdmin(): Promise<boolean> {
    return this.hasRole(UserRole.ADMIN);
  }

  // Check if user is moderator or admin
  static async isModeratorOrAdmin(): Promise<boolean> {
    return this.hasAnyRole([UserRole.MODERATOR, UserRole.ADMIN]);
  }

  // Get user ID from session
  static async getUserId(): Promise<string | null> {
    const session = await this.getSession();
    return session?.id || null;
  }

  // Get user email from session
  static async getUserEmail(): Promise<string | null> {
    const session = await this.getSession();
    return session?.email || null;
  }

  // Get user role from session
  static async getUserRole(): Promise<UserRole | null> {
    const session = await this.getSession();
    return session?.role || null;
  }

  // Check if user can access resource
  static async canAccessResource(
    resource: string,
    action: PermissionLevel
  ): Promise<boolean> {
    const session = await this.getSession();
    
    if (!session) {
      return false;
    }

    // Admin can access everything
    if (session.role === UserRole.ADMIN) {
      return true;
    }

    // Check specific permissions based on resource and action
    switch (resource) {
      case 'users':
        return session.role === UserRole.ADMIN;
      
      case 'products':
        return [PermissionLevel.READ, PermissionLevel.WRITE].includes(action) &&
               [UserRole.MODERATOR, UserRole.ADMIN].includes(session.role);
      
      case 'orders':
        return [PermissionLevel.READ, PermissionLevel.WRITE].includes(action) &&
               [UserRole.MODERATOR, UserRole.ADMIN].includes(session.role);
      
      case 'categories':
        return [PermissionLevel.READ, PermissionLevel.WRITE].includes(action) &&
               [UserRole.MODERATOR, UserRole.ADMIN].includes(session.role);
      
      case 'reviews':
        return action === PermissionLevel.READ || session.role === UserRole.ADMIN;
      
      default:
        return this.hasPermission(action);
    }
  }

  // Require authentication middleware
  static async requireAuth(): Promise<SessionUser> {
    const session = await this.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    return session;
  }

  // Require specific role middleware
  static async requireRole(role: UserRole): Promise<SessionUser> {
    const session = await this.requireAuth();
    
    if (session.role !== role) {
      throw new Error(`Role ${role} required`);
    }

    return session;
  }

  // Require any of the specified roles middleware
  static async requireAnyRole(roles: UserRole[]): Promise<SessionUser> {
    const session = await this.requireAuth();
    
    if (!roles.includes(session.role)) {
      throw new Error(`One of the following roles required: ${roles.join(', ')}`);
    }

    return session;
  }

  // Require permission middleware
  static async requirePermission(permission: PermissionLevel): Promise<SessionUser> {
    const session = await this.requireAuth();
    
    if (!(await this.hasPermission(permission))) {
      throw new Error(`Permission ${permission} required`);
    }

    return session;
  }

  // Require admin middleware
  static async requireAdmin(): Promise<SessionUser> {
    return this.requireRole(UserRole.ADMIN);
  }

  // Require moderator or admin middleware
  static async requireModeratorOrAdmin(): Promise<SessionUser> {
    return this.requireAnyRole([UserRole.MODERATOR, UserRole.ADMIN]);
  }

  // Check if user can access user resource
  static async canAccessUser(targetUserId: string): Promise<boolean> {
    const session = await this.getSession();
    
    if (!session) {
      return false;
    }

    // Admin can access any user
    if (session.role === UserRole.ADMIN) {
      return true;
    }

    // Users can only access their own data
    return session.id === targetUserId;
  }

  // Check if user can modify user resource
  static async canModifyUser(targetUserId: string): Promise<boolean> {
    const session = await this.getSession();
    
    if (!session) {
      return false;
    }

    // Admin can modify any user
    if (session.role === UserRole.ADMIN) {
      return true;
    }

    // Users can only modify their own data
    return session.id === targetUserId;
  }

  // Check if user can delete user resource
  static async canDeleteUser(targetUserId: string): Promise<boolean> {
    const session = await this.getSession();
    
    if (!session) {
      return false;
    }

    // Only admin can delete users
    return session.role === UserRole.ADMIN;
  }

  // Get user permissions
  static async getUserPermissions(): Promise<PermissionLevel[]> {
    const session = await this.getSession();
    
    if (!session) {
      return [];
    }

    return PERMISSIONS[session.role] || [];
  }

  // Check if user is email verified
  static async isEmailVerified(): Promise<boolean> {
    const session = await this.getSession();
    return !!session?.emailVerified;
  }

  // Require email verification
  static async requireEmailVerification(): Promise<SessionUser> {
    const session = await this.requireAuth();
    
    if (!session.emailVerified) {
      throw new Error('Email verification required');
    }

    return session;
  }

  // Get authentication context for logging
  static async getAuthContext(): Promise<{
    userId?: string;
    email?: string;
    role?: UserRole;
    isAuthenticated: boolean;
  }> {
    const session = await this.getSession();
    
    return {
      userId: session?.id,
      email: session?.email,
      role: session?.role,
      isAuthenticated: !!session,
    };
  }

  // Log authentication event
  static async logAuthEvent(
    event: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    const context = await this.getAuthContext();
    
    logger.info(`Auth event: ${event}`, {
      ...context,
      ...details,
    });

    monitoring.recordCounter('auth.event', 1, {
      event,
      userId: context.userId,
      role: context.role,
    });
  }

  // Validate session token
  static async validateSession(): Promise<{
    valid: boolean;
    user?: SessionUser;
    error?: string;
  }> {
    try {
      const session = await this.getSession();
      
      if (!session) {
        return {
          valid: false,
          error: 'No session found',
        };
      }

      // Additional validation can be added here
      // For example, check if user is still active in database
      
      return {
        valid: true,
        user: session,
      };
  } catch (error) {
      logger.error('Session validation failed', {
        error: error.message,
        stack: error.stack,
      });

      return {
        valid: false,
        error: error.message,
      };
    }
  }

  // Get user from request headers (for API routes)
  static getUserFromRequest(request: NextRequest): {
    userId?: string;
    email?: string;
    role?: UserRole;
  } {
    const userId = request.headers.get('x-user-id');
    const email = request.headers.get('x-user-email');
    const role = request.headers.get('x-user-role') as UserRole;

    return {
      userId: userId || undefined,
      email: email || undefined,
      role: role || undefined,
    };
  }

  // Set user headers for request (for API routes)
  static setUserHeaders(
    request: NextRequest,
    user: SessionUser
  ): Headers {
    const headers = new Headers(request.headers);
    
    headers.set('x-user-id', user.id);
    headers.set('x-user-email', user.email);
    headers.set('x-user-role', user.role);
    
    return headers;
  }
}

// Export utility functions
export const getCurrentUser = AuthUtils.getSession;
export const getUserId = AuthUtils.getUserId;
export const getUserById = AuthUtils.getUserById;
export const getUserStats = AuthUtils.getUserStats;
export const activateUser = AuthUtils.activateUser;
export const deactivateUser = AuthUtils.deactivateUser;
export const updateUserProfile = AuthUtils.updateUserProfile;
export const changePassword = AuthUtils.changePassword;
export const getSession = AuthUtils.getSession;
export const isAuthenticated = AuthUtils.isAuthenticated;
export const hasRole = AuthUtils.hasRole;
export const hasAnyRole = AuthUtils.hasAnyRole;
export const hasPermission = AuthUtils.hasPermission;
export const isAdmin = AuthUtils.isAdmin;
export const isModeratorOrAdmin = AuthUtils.isModeratorOrAdmin;
export const getUserEmail = AuthUtils.getUserEmail;
export const getUserRole = AuthUtils.getUserRole;
export const canAccessResource = AuthUtils.canAccessResource;
export const requireAuth = AuthUtils.requireAuth;
export const requireRole = AuthUtils.requireRole;
export const requireAnyRole = AuthUtils.requireAnyRole;
export const requirePermission = AuthUtils.requirePermission;
export const requireAdmin = AuthUtils.requireAdmin;
export const requireModeratorOrAdmin = AuthUtils.requireModeratorOrAdmin;
export const canAccessUser = AuthUtils.canAccessUser;
export const canModifyUser = AuthUtils.canModifyUser;
export const canDeleteUser = AuthUtils.canDeleteUser;
export const getUserPermissions = AuthUtils.getUserPermissions;
export const isEmailVerified = AuthUtils.isEmailVerified;
export const requireEmailVerification = AuthUtils.requireEmailVerification;
export const getAuthContext = AuthUtils.getAuthContext;
export const logAuthEvent = AuthUtils.logAuthEvent;
export const validateSession = AuthUtils.validateSession;
export const getUserFromRequest = AuthUtils.getUserFromRequest;
export const setUserHeaders = AuthUtils.setUserHeaders;

export default AuthUtils;