import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logger } from './logger';
import { monitoring } from './monitoring';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { db as prisma } from './database';

// Permission levels
export enum PermissionLevel {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  ADMIN = 'admin',
}

// Permission matrix
const PERMISSIONS: Record<UserRole, PermissionLevel[]> = {
  [UserRole.CUSTOMER]: [PermissionLevel.READ],
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
      logger.error('Failed to get session', {}, error instanceof Error ? error : new Error(String(error)));
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
      case 'products':
        return [PermissionLevel.READ, PermissionLevel.WRITE].includes(action) &&
               session.role === UserRole.MODERATOR;
      
      case 'orders':
        return [PermissionLevel.READ, PermissionLevel.WRITE].includes(action) &&
               session.role === UserRole.MODERATOR;
      
      case 'categories':
        return [PermissionLevel.READ, PermissionLevel.WRITE].includes(action) &&
               session.role === UserRole.MODERATOR;
      
      case 'reviews':
        return action === PermissionLevel.READ;
      
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
      ...(context.userId && { userId: context.userId }),
      ...(context.role && { role: context.role }),
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
      logger.error('Session validation failed', {}, error instanceof Error ? error : new Error(String(error)));

      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
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

  // Get user by ID from database
  static async getUserById(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        logger.warn('User not found', { userId });
        return null;
      }

      logger.debug('User fetched by ID', { userId });
      return user;
    } catch (error) {
      logger.error('Failed to get user by ID', {
        userId,
      }, error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  // Get user statistics (for a specific user or overall admin stats)
  static async getUserStats(userId?: string) {
    try {
      if (userId) {
        // Get stats for a specific user
        const [ordersCount, reviewsCount, wishlistCount] = await Promise.all([
          prisma.order.count({ where: { userId } }),
          prisma.review.count({ where: { userId } }),
          prisma.wishlistItem.count({ where: { userId } }),
        ]);

        return {
          ordersCount,
          reviewsCount,
          wishlistCount,
        };
      } else {
        // Get overall admin statistics
        const [
          totalUsers,
          activeUsers,
          totalOrders,
          totalProducts,
          totalRevenue,
        ] = await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { isActive: true } }),
          prisma.order.count(),
          prisma.product.count(),
          prisma.order.aggregate({
            _sum: { total: true },
            where: { status: 'DELIVERED' },
          }),
        ]);

        return {
          totalUsers,
          activeUsers,
          totalOrders,
          totalProducts,
          totalRevenue: totalRevenue._sum.total || 0,
        };
      }
    } catch (error) {
      logger.error('Failed to get user stats', {
        userId,
      }, error instanceof Error ? error : new Error(String(error)));
      return userId ? {
        ordersCount: 0,
        reviewsCount: 0,
        wishlistCount: 0,
      } : {
        totalUsers: 0,
        activeUsers: 0,
        totalOrders: 0,
        totalProducts: 0,
        totalRevenue: 0,
      };
    }
  }

  // Activate user
  static async activateUser(userId: string): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: true },
      });

      logger.info('User activated', { userId });
      monitoring.recordCounter('user.activated', 1, { userId });

      return true;
    } catch (error) {
      logger.error('Failed to activate user', {
        userId,
      }, error instanceof Error ? error : new Error(String(error)));

      monitoring.recordCounter('user.activation_failed', 1, { userId });
      return false;
    }
  }

  // Deactivate user
  static async deactivateUser(userId: string): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      logger.info('User deactivated', { userId });
      monitoring.recordCounter('user.deactivated', 1, { userId });

      return true;
    } catch (error) {
      logger.error('Failed to deactivate user', {
        userId,
      }, error instanceof Error ? error : new Error(String(error)));

      monitoring.recordCounter('user.deactivation_failed', 1, { userId });
      return false;
    }
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: {
    name?: string;
    email?: string;
    avatar?: string;
  }): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: updates,
      });

      logger.info('User profile updated', { userId, updates: Object.keys(updates) });
      monitoring.recordCounter('user.profile_updated', 1, { userId });

      return true;
    } catch (error) {
      logger.error('Failed to update user profile', {
        userId,
      }, error instanceof Error ? error : new Error(String(error)));

      monitoring.recordCounter('user.profile_update_failed', 1, { userId });
      return false;
    }
  }

  // Change user password
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Get user from database to verify current password
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
      });

      if (!user || !user.password) {
        return {
          success: false,
          error: 'User not found or password not set',
        };
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);

      if (!isValidPassword) {
        logger.warn('Invalid current password for password change', { userId });
        monitoring.recordCounter('user.password_change_invalid', 1, { userId });

        return {
          success: false,
          error: 'Current password is incorrect',
        };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      logger.info('Password changed successfully', { userId });
      monitoring.recordCounter('user.password_changed', 1, { userId });

      return {
        success: true,
      };
    } catch (error) {
      logger.error('Failed to change password', {
        userId,
      }, error instanceof Error ? error : new Error(String(error)));

      monitoring.recordCounter('user.password_change_failed', 1, { userId });

      return {
        success: false,
        error: 'Failed to change password',
      };
    }
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

// Re-export UserRole from Prisma for convenience
export { UserRole };

export default AuthUtils;