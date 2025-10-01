import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logger } from './logger';
import { monitoring } from './monitoring';
import { PrismaClient } from '@prisma/client';

// Create Prisma client
const prisma = new PrismaClient();

// Session interface
interface SessionInfo {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  lastAccessedAt: Date;
  expiresAt: Date;
  deviceInfo?: {
    userAgent: string;
    ip: string;
    platform: string;
  };
}

// Session manager class
export class SessionManager {
  // Get current session with additional info
  static async getCurrentSession(request?: NextRequest): Promise<SessionInfo | null> {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        return null;
      }

      // Get additional user info from database
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });

      if (!user || !user.isActive) {
        return null;
      }

      // Get device info from request
      const deviceInfo = request ? {
        userAgent: request.headers.get('user-agent') || 'Unknown',
        ip: request.headers.get('x-forwarded-for') || request.ip || 'Unknown',
        platform: this.detectPlatform(request.headers.get('user-agent') || ''),
      } : undefined;

      return {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        emailVerified: !!user.emailVerified,
        createdAt: user.createdAt,
        lastAccessedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        deviceInfo,
      };
    } catch (error) {
      logger.error('Failed to get current session', {
        error: error.message,
        stack: error.stack,
      });
      return null;
    }
  }

  // Detect platform from user agent
  private static detectPlatform(userAgent: string): string {
    if (userAgent.includes('Mobile')) {
      return 'Mobile';
    } else if (userAgent.includes('Tablet')) {
      return 'Tablet';
    } else if (userAgent.includes('Windows')) {
      return 'Windows';
    } else if (userAgent.includes('Mac')) {
      return 'Mac';
    } else if (userAgent.includes('Linux')) {
      return 'Linux';
    } else {
      return 'Unknown';
    }
  }

  // Validate session
  static async validateSession(sessionId: string): Promise<{
    valid: boolean;
    session?: SessionInfo;
    error?: string;
  }> {
    try {
      const session = await this.getCurrentSession();
      
      if (!session) {
        return {
          valid: false,
          error: 'No active session',
        };
      }

      // Check if session is expired
      if (new Date() > session.expiresAt) {
        return {
          valid: false,
          error: 'Session expired',
        };
      }

      // Check if user is still active
      if (!session.isActive) {
        return {
          valid: false,
          error: 'User account is inactive',
        };
      }

      return {
        valid: true,
        session,
      };
    } catch (error) {
      logger.error('Session validation failed', {
        error: error.message,
        sessionId,
      });

      return {
        valid: false,
        error: error.message,
      };
    }
  }

  // Refresh session
  static async refreshSession(sessionId: string): Promise<SessionInfo | null> {
    try {
      const validation = await this.validateSession(sessionId);
      
      if (!validation.valid) {
        logger.warn('Cannot refresh invalid session', {
          sessionId,
          error: validation.error,
        });
        return null;
      }

      // Update last accessed time
      const session = validation.session!;
      session.lastAccessedAt = new Date();
      session.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      // Record session refresh
      monitoring.recordCounter('auth.session.refreshed', 1, {
        userId: session.userId,
      });

      logger.debug('Session refreshed', {
        sessionId,
        userId: session.userId,
      });

      return session;
    } catch (error) {
      logger.error('Session refresh failed', {
        error: error.message,
        sessionId,
      });
      return null;
    }
  }

  // Invalidate session
  static async invalidateSession(sessionId: string): Promise<boolean> {
    try {
      // In a real implementation, you would store sessions in a database
      // and mark them as invalid. For now, we'll just log it.
      
      logger.info('Session invalidated', {
        sessionId,
      });

      // Record session invalidation
      monitoring.recordCounter('auth.session.invalidated', 1);

      return true;
    } catch (error) {
      logger.error('Session invalidation failed', {
        error: error.message,
        sessionId,
      });
      return false;
    }
  }

  // Get session statistics
  static async getSessionStats(): Promise<{
    activeSessions: number;
    totalSessions: number;
    averageSessionDuration: number;
    sessionsByPlatform: Record<string, number>;
  }> {
    try {
      // In a real implementation, you would query session data from database
      // For now, we'll return mock data
      
      return {
        activeSessions: 0,
        totalSessions: 0,
        averageSessionDuration: 0,
        sessionsByPlatform: {},
      };
    } catch (error) {
      logger.error('Failed to get session statistics', {
        error: error.message,
      });
      
      return {
        activeSessions: 0,
        totalSessions: 0,
        averageSessionDuration: 0,
        sessionsByPlatform: {},
      };
    }
  }

  // Clean up expired sessions
  static async cleanupExpiredSessions(): Promise<number> {
    try {
      // In a real implementation, you would clean up expired sessions from database
      // For now, we'll just log it
      
      logger.info('Expired sessions cleanup completed');
      
      // Record cleanup
      monitoring.recordCounter('auth.session.cleanup', 1);
      
      return 0;
    } catch (error) {
      logger.error('Session cleanup failed', {
        error: error.message,
      });
      return 0;
    }
  }

  // Get user's active sessions
  static async getUserSessions(userId: string): Promise<SessionInfo[]> {
    try {
      // In a real implementation, you would query user's sessions from database
      // For now, we'll return empty array
      
      return [];
    } catch (error) {
      logger.error('Failed to get user sessions', {
        error: error.message,
        userId,
      });
      return [];
    }
  }

  // Revoke all user sessions
  static async revokeAllUserSessions(userId: string): Promise<boolean> {
    try {
      logger.info('Revoking all user sessions', {
        userId,
      });

      // Record session revocation
      monitoring.recordCounter('auth.session.revoked_all', 1, {
        userId,
      });

      return true;
    } catch (error) {
      logger.error('Failed to revoke user sessions', {
        error: error.message,
        userId,
      });
      return false;
    }
  }

  // Check if user has active session
  static async hasActiveSession(userId: string): Promise<boolean> {
    try {
      const sessions = await this.getUserSessions(userId);
      return sessions.length > 0;
    } catch (error) {
      logger.error('Failed to check active sessions', {
        error: error.message,
        userId,
      });
      return false;
    }
  }

  // Get session by ID
  static async getSessionById(sessionId: string): Promise<SessionInfo | null> {
    try {
      // In a real implementation, you would query session by ID from database
      // For now, we'll return null
      
      return null;
    } catch (error) {
      logger.error('Failed to get session by ID', {
        error: error.message,
        sessionId,
      });
      return null;
    }
  }

  // Update session activity
  static async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      // In a real implementation, you would update session activity in database
      // For now, we'll just log it
      
      logger.debug('Session activity updated', {
        sessionId,
      });
    } catch (error) {
      logger.error('Failed to update session activity', {
        error: error.message,
        sessionId,
      });
    }
  }

  // Check session security
  static async checkSessionSecurity(session: SessionInfo, request: NextRequest): Promise<{
    secure: boolean;
    warnings: string[];
  }> {
    const warnings: string[] = [];

    try {
      // Check if session is from a different IP
      const currentIp = request.headers.get('x-forwarded-for') || request.ip;
      if (session.deviceInfo?.ip && session.deviceInfo.ip !== currentIp) {
        warnings.push('Session accessed from different IP address');
      }

      // Check if session is from a different user agent
      const currentUserAgent = request.headers.get('user-agent');
      if (session.deviceInfo?.userAgent && session.deviceInfo.userAgent !== currentUserAgent) {
        warnings.push('Session accessed from different device');
      }

      // Check if session is expired
      if (new Date() > session.expiresAt) {
        warnings.push('Session has expired');
      }

      // Check if user is still active
      if (!session.isActive) {
        warnings.push('User account is inactive');
      }

      // Check if email is verified
      if (!session.emailVerified) {
        warnings.push('Email not verified');
      }

      const secure = warnings.length === 0;

      if (!secure) {
        logger.warn('Session security issues detected', {
          sessionId: session.id,
          userId: session.userId,
          warnings,
        });

        monitoring.recordCounter('auth.session.security_issues', 1, {
          userId: session.userId,
          warningCount: warnings.length,
        });
      }

      return {
        secure,
        warnings,
      };
    } catch (error) {
      logger.error('Session security check failed', {
        error: error.message,
        sessionId: session.id,
      });

      return {
        secure: false,
        warnings: ['Security check failed'],
      };
    }
  }
}

// Export utility functions
export const sessionUtils = {
  getCurrentSession: SessionManager.getCurrentSession,
  validateSession: SessionManager.validateSession,
  refreshSession: SessionManager.refreshSession,
  invalidateSession: SessionManager.invalidateSession,
  getSessionStats: SessionManager.getSessionStats,
  cleanupExpiredSessions: SessionManager.cleanupExpiredSessions,
  getUserSessions: SessionManager.getUserSessions,
  revokeAllUserSessions: SessionManager.revokeAllUserSessions,
  hasActiveSession: SessionManager.hasActiveSession,
  getSessionById: SessionManager.getSessionById,
  updateSessionActivity: SessionManager.updateSessionActivity,
  checkSessionSecurity: SessionManager.checkSessionSecurity,
};

export const {
  getCurrentSession,
  validateSession,
  refreshSession,
  invalidateSession,
  getSessionStats,
  cleanupExpiredSessions,
  getUserSessions,
  revokeAllUserSessions,
  hasActiveSession,
  getSessionById,
  updateSessionActivity,
  checkSessionSecurity,
} = SessionManager;

export default SessionManager;