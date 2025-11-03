import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { errorHandler, asyncHandler, NotFoundError, AuthorizationError, ValidationError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { monitoring } from '@/lib/monitoring';
import { withApiVersioning } from '@/lib/api-versioning';
import { withCache } from '@/lib/cache';
import { sessionCache } from '@/lib/cache';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthUtils, UserRole } from '@/lib/auth-utils';

// Create Prisma client
const prisma = new PrismaClient();

// User schema
const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  image: z.string().url().optional(),
  role: z.enum(['USER', 'ADMIN', 'MODERATOR']),
  isActive: z.boolean(),
  emailVerified: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
  role: z.enum(['CUSTOMER', 'ADMIN', 'MODERATOR']).optional(),
  isActive: z.boolean().optional(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// Get user by ID
const GETHandler = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
  const startTime = Date.now();
  const { id } = params;
  
  try {
    // Check authentication
    const currentUser = await AuthUtils.requireAuth();
    
    // Check authorization - users can only access their own data unless they're admin
    if (currentUser.id !== id && currentUser.role !== UserRole.ADMIN) {
      throw new AuthorizationError('Access denied');
    }
    
    logger.info('Fetching user by ID', {
      id,
      userId: currentUser.id,
      path: request.nextUrl.pathname,
    });

    // Record metric
    monitoring.recordCounter('users.get.requests', 1, { id, userId: currentUser.id });

    // Check cache first
    const cacheKey = `user:${id}`;
    const cachedUser = sessionCache.get(cacheKey);
    
    if (cachedUser) {
      logger.debug('User found in cache', { id });
      monitoring.recordCounter('users.get.cache_hits', 1, { id });
      
      return NextResponse.json(cachedUser);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id },
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
      logger.warn('User not found', { id });
      monitoring.recordCounter('users.get.not_found', 1, { id });
      
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    // Cache the user
    sessionCache.set(cacheKey, user, 1800); // 30 minutes

    // Record success metric
    monitoring.recordCounter('users.get.success', 1, { id });
    monitoring.recordTimer('users.get.duration', Date.now() - startTime);

    logger.info('User fetched successfully', {
      id,
      name: user.name,
      email: user.email,
      userId: currentUser.id,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(user);

  } catch (error) {
    logger.error('Failed to fetch user', {
      id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('users.get.errors', 1, { id });

    throw error;
  }
});

// Update user by ID
const PUTHandler = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
  const startTime = Date.now();
  const { id } = params;
  
  try {
    // Check authentication
    const currentUser = await AuthUtils.requireAuth();
    
    // Check authorization - users can only update their own data unless they're admin
    if (currentUser.id !== id && currentUser.role !== UserRole.ADMIN) {
      throw new AuthorizationError('Access denied');
    }
    
    // Parse request body
    const body = await request.json();
    const updateData = UpdateUserSchema.parse(body);
    
    logger.info('Updating user', {
      id,
      updates: Object.keys(updateData),
      userId: currentUser.id,
    });

    // Record metric
    monitoring.recordCounter('users.update.requests', 1, { id, userId: currentUser.id });

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });
    
    if (!existingUser) {
      logger.warn('User not found for update', { id });
      monitoring.recordCounter('users.update.not_found', 1, { id });
      
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    // Check if email is being changed and if it already exists
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: updateData.email },
      });
      
      if (emailExists) {
        throw new ValidationError('Email already exists');
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
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

    // Update cache
    const cacheKey = `user:${id}`;
    sessionCache.set(cacheKey, updatedUser, 1800); // 30 minutes

    // Record success metric
    monitoring.recordCounter('users.update.success', 1, { id });
    monitoring.recordTimer('users.update.duration', Date.now() - startTime);

    logger.info('User updated successfully', {
      id,
      name: updatedUser.name,
      email: updatedUser.email,
      userId: currentUser.id,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(updatedUser);

  } catch (error) {
    logger.error('Failed to update user', {
      id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('users.update.errors', 1, { id });

    throw error;
  }
});

// Delete user by ID
const DELETEHandler = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
  const startTime = Date.now();
  const { id } = params;
  
  try {
    // Check authentication and authorization
    const currentUser = await AuthUtils.requireAdmin();
    
    // Prevent self-deletion
    if (currentUser.id === id) {
      throw new ValidationError('Cannot delete your own account');
    }
    
    logger.info('Deleting user', {
      id,
      userId: currentUser.id,
      path: request.nextUrl.pathname,
    });

    // Record metric
    monitoring.recordCounter('users.delete.requests', 1, { id, userId: currentUser.id });

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });
    
    if (!existingUser) {
      logger.warn('User not found for deletion', { id });
      monitoring.recordCounter('users.delete.not_found', 1, { id });
      
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    // Delete user
    await prisma.user.delete({
      where: { id },
    });

    // Remove from cache
    const cacheKey = `user:${id}`;
    sessionCache.delete(cacheKey);

    // Record success metric
    monitoring.recordCounter('users.delete.success', 1, { id });
    monitoring.recordTimer('users.delete.duration', Date.now() - startTime);

    logger.info('User deleted successfully', {
      id,
      name: existingUser.name,
      email: existingUser.email,
      userId: currentUser.id,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      { message: 'User deleted successfully', id },
      { status: 200 }
    );

  } catch (error) {
    logger.error('Failed to delete user', {
      id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('users.delete.errors', 1, { id });

    throw error;
  }
});

// Change password
const PATCHHandler = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
  const startTime = Date.now();
  const { id } = params;
  
  try {
    // Check authentication
    const currentUser = await AuthUtils.requireAuth();
    
    // Check authorization - users can only change their own password
    if (currentUser.id !== id) {
      throw new AuthorizationError('Access denied');
    }
    
    // Parse request body
    const body = await request.json();
    const passwordData = ChangePasswordSchema.parse(body);
    
    logger.info('Changing user password', {
      id,
      userId: currentUser.id,
    });

    // Record metric
    monitoring.recordCounter('users.change_password.requests', 1, { id, userId: currentUser.id });

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        password: true,
      },
    });
    
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      passwordData.currentPassword,
      user.password || ''
    );

    if (!isValidPassword) {
      logger.warn('Invalid current password for password change', { id });
      monitoring.recordCounter('users.change_password.invalid_current', 1, { id });
      
      throw new ValidationError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(passwordData.newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    // Record success metric
    monitoring.recordCounter('users.change_password.success', 1, { id });
    monitoring.recordTimer('users.change_password.duration', Date.now() - startTime);

    logger.info('User password changed successfully', {
      id,
      userId: currentUser.id,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      { message: 'Password changed successfully' },
      { status: 200 }
    );

  } catch (error) {
    logger.error('Failed to change user password', {
      id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('users.change_password.errors', 1, { id });

    throw error;
  }
});

// Apply API versioning decorator
export const GET = withApiVersioning(GETHandler);
export const PUT = withApiVersioning(PUTHandler);
export const DELETE = withApiVersioning(DELETEHandler);
export const PATCH = withApiVersioning(PATCHHandler);


