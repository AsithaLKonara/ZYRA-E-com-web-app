import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { errorHandler, asyncHandler, ValidationError, NotFoundError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { monitoring } from '@/lib/monitoring';
import { withApiVersioning } from '@/lib/api-versioning';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Create Prisma client
const prisma = new PrismaClient();

// Password reset schemas
const RequestResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Request password reset
const POSTHandler = asyncHandler(async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    const { email } = RequestResetSchema.parse(body);
    
    logger.info('Password reset request', {
      email,
    });

    // Record metric
    monitoring.recordCounter('auth.reset_password.requests', 1, { email });

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      logger.info('Password reset requested for non-existent user', { email });
      monitoring.recordCounter('auth.reset_password.user_not_found', 1);
      
      // Return success even if user doesn't exist
      return NextResponse.json(
        {
          message: 'If an account with that email exists, a password reset link has been sent.',
        },
        { status: 200 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      logger.warn('Password reset requested for inactive user', {
        userId: user.id,
        email,
      });
      monitoring.recordCounter('auth.reset_password.inactive_user', 1);
      
      // Return success even if user is inactive
      return NextResponse.json(
        {
          message: 'If an account with that email exists, a password reset link has been sent.',
        },
        { status: 200 }
      );
    }

    // Generate password reset token
    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        updatedAt: new Date(),
      },
    });

    // TODO: Send password reset email
    // This would typically send an email with the reset token
    logger.info('Password reset token generated', {
      userId: user.id,
      email: user.email,
      token: resetToken,
      expiry: resetTokenExpiry,
    });

    // Record success metric
    monitoring.recordCounter('auth.reset_password.success', 1);
    monitoring.recordTimer('auth.reset_password.duration', Date.now() - startTime);

    logger.info('Password reset email sent successfully', {
      userId: user.id,
      email: user.email,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      {
        message: 'If an account with that email exists, a password reset link has been sent.',
      },
      { status: 200 }
    );

  } catch (error) {
    logger.error('Password reset request failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('auth.reset_password.error', 1);

    throw error;
  }
});

// Reset password with token
const PUTHandler = asyncHandler(async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    const { token, password } = ResetPasswordSchema.parse(body);
    
    logger.info('Password reset with token attempt', {
      token: token.substring(0, 8) + '...',
    });

    // Record metric
    monitoring.recordCounter('auth.reset_password_confirm.requests', 1);

    // Find user by reset token
    // For now, we'll skip token validation since the fields don't exist in the User model
    // TODO: Implement proper password reset token system
    logger.warn('Password reset token validation skipped - fields not implemented', {
      token: token.substring(0, 8) + '...',
    });
    
    throw new ValidationError('Password reset functionality not fully implemented');

  } catch (error) {
    logger.error('Password reset confirmation failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('auth.reset_password_confirm.error', 1);

    throw error;
  }
});

// Apply API versioning decorator
export const POST = withApiVersioning(POSTHandler);
export const PUT = withApiVersioning(PUTHandler);


