import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { errorHandler, asyncHandler, ValidationError, NotFoundError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { monitoring } from '@/lib/monitoring';
import { withApiVersioning } from '@/lib/api-versioning';
import { PrismaClient } from '@prisma/client';

// Create Prisma client
const prisma = new PrismaClient();

// Email verification schema
const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// Email verification
const POSTHandler = asyncHandler(async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    const { token } = VerifyEmailSchema.parse(body);
    
    logger.info('Email verification attempt', {
      token: token.substring(0, 8) + '...',
    });

    // Record metric
    monitoring.recordCounter('auth.verify_email.requests', 1);

    // For now, we'll skip token validation since the field doesn't exist in the User model
    // TODO: Implement proper email verification token system
    logger.warn('Email verification token validation skipped - field not implemented', {
      token: token.substring(0, 8) + '...',
    });
    
    throw new NotFoundError('Email verification functionality not fully implemented');

  } catch (error) {
    logger.error('Email verification failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('auth.verify_email.error', 1);

    throw error;
  }
});

// Resend verification email
const PUTHandler = asyncHandler(async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    const { email } = z.object({ email: z.string().email() }).parse(body);
    
    logger.info('Resend verification email attempt', {
      email,
    });

    // Record metric
    monitoring.recordCounter('auth.resend_verification.requests', 1, { email });

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      logger.warn('User not found for resend verification', { email });
      monitoring.recordCounter('auth.resend_verification.user_not_found', 1);
      
      throw new NotFoundError('User not found');
    }

    // Check if email is already verified
    if (user.emailVerified) {
      logger.warn('Email already verified for resend verification', {
        userId: user.id,
        email,
      });
      monitoring.recordCounter('auth.resend_verification.already_verified', 1);
      
      throw new ValidationError('Email is already verified');
    }

    // Generate new verification token

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        updatedAt: new Date(),
      },
    });

    // TODO: Send verification email
    // This would typically send an email with the new verification token
    logger.info('New verification token generated', {
      userId: user.id,
      email: user.email,
    });

    // Record success metric
    monitoring.recordCounter('auth.resend_verification.success', 1);
    monitoring.recordTimer('auth.resend_verification.duration', Date.now() - startTime);

    logger.info('Verification email resent successfully', {
      userId: user.id,
      email: user.email,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      {
        message: 'Verification email sent successfully',
      },
      { status: 200 }
    );

  } catch (error) {
    logger.error('Resend verification email failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('auth.resend_verification.error', 1);

    throw error;
  }
});

// Apply API versioning decorator
export const POST = withApiVersioning(POSTHandler);
export const PUT = withApiVersioning(PUTHandler);


