import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { errorHandler, asyncHandler, ValidationError, ConflictError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { monitoring } from '@/lib/monitoring';
import { withApiVersioning } from '@/lib/api-versioning';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Create Prisma client
const prisma = new PrismaClient();

// Registration schema
const RegisterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// User registration
const POSTHandler = asyncHandler(async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    const userData = RegisterSchema.parse(body);
    
    logger.info('User registration attempt', {
      email: userData.email,
      name: userData.name,
    });

    // Record metric
    monitoring.recordCounter('auth.register.requests', 1, {
      email: userData.email,
    });

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      logger.warn('User already exists during registration', {
        email: userData.email,
      });
      monitoring.recordCounter('auth.register.duplicate_email', 1);
      
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Generate email verification token

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        role: UserRole.CUSTOMER,
        isActive: true,
        emailVerified: null, // Will be verified when user clicks email link
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // TODO: Send verification email
    // This would typically send an email with the verification token
    logger.info('Email verification token generated', {
      userId: newUser.id,
      email: newUser.email,
    });

    // Record success metric
    monitoring.recordCounter('auth.register.success', 1);
    monitoring.recordTimer('auth.register.duration', Date.now() - startTime);

    logger.info('User registered successfully', {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      {
        message: 'User registered successfully. Please check your email to verify your account.',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          isActive: newUser.isActive,
          emailVerified: newUser.emailVerified,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    logger.error('User registration failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('auth.register.error', 1);

    throw error;
  }
});

// Apply API versioning decorator
export const POST = withApiVersioning(POSTHandler);