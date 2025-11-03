import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { errorHandler, asyncHandler, ValidationError, NotFoundError, AuthorizationError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { monitoring } from '@/lib/monitoring';
import { withApiVersioning } from '@/lib/api-versioning';
import { withCache } from '@/lib/cache';
import { apiCache } from '@/lib/cache';
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
  avatar: z.string().url().optional(),
  role: z.enum(['CUSTOMER', 'ADMIN', 'MODERATOR']),
  isActive: z.boolean(),
  emailVerified: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['CUSTOMER', 'ADMIN', 'MODERATOR']).default('CUSTOMER'),
  isActive: z.boolean().default(true),
});

const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
  role: z.enum(['CUSTOMER', 'ADMIN', 'MODERATOR']).optional(),
  isActive: z.boolean().optional(),
});

// Query parameters schema
const QuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  search: z.string().optional(),
  role: z.enum(['CUSTOMER', 'ADMIN', 'MODERATOR']).optional(),
  isActive: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['name', 'email', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Get all users
const GETHandler = asyncHandler(async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Check authentication and authorization
    const currentUser = await AuthUtils.requireModeratorOrAdmin();
    
    // Parse query parameters
    const { searchParams } = request.nextUrl;
    const query = QuerySchema.parse(Object.fromEntries(searchParams));
    
    logger.info('Fetching users', {
      query,
      userId: currentUser.id,
      path: request.nextUrl.pathname,
    });

    // Record metric
    monitoring.recordCounter('users.list.requests', 1, {
      userId: currentUser.id,
      role: currentUser.role,
    });

    // Check cache first
    const cacheKey = `users:${JSON.stringify(query)}`;
    const cachedUsers = apiCache.get(cacheKey);
    
    if (cachedUsers) {
      logger.debug('Users found in cache', { query });
      monitoring.recordCounter('users.list.cache_hits', 1);
      
      return NextResponse.json(cachedUsers);
    }

    // Build where clause
    const where: any = {};
    
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    
    if (query.role) {
      where.role = query.role;
    }
    
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate pagination
    const totalPages = Math.ceil(total / query.limit);
    
    // Build response
    const response = {
      users,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrev: query.page > 1,
      },
      filters: {
        search: query.search,
        role: query.role,
        isActive: query.isActive,
      },
      sort: {
        by: query.sortBy,
        order: query.sortOrder,
      },
    };

    // Cache the response
    apiCache.set(cacheKey, response, 300); // 5 minutes

    // Record success metric
    monitoring.recordCounter('users.list.success', 1);
    monitoring.recordTimer('users.list.duration', Date.now() - startTime);

    logger.info('Users fetched successfully', {
      count: users.length,
      total,
      page: query.page,
      userId: currentUser.id,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Failed to fetch users', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('users.list.errors', 1);

    throw error;
  }
});

// Create new user
const POSTHandler = asyncHandler(async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Check authentication and authorization
    const currentUser = await AuthUtils.requireAdmin();
    
    // Parse request body
    const body = await request.json();
    const userData = CreateUserSchema.parse(body);
    
    logger.info('Creating new user', {
      email: userData.email,
      name: userData.name,
      role: userData.role,
      userId: currentUser.id,
    });

    // Record metric
    monitoring.recordCounter('users.create.requests', 1, {
      userId: currentUser.id,
      role: currentUser.role,
    });

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      logger.warn('User already exists', { email: userData.email });
      monitoring.recordCounter('users.create.duplicate_email', 1);
      
      throw new ValidationError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        role: userData.role,
        isActive: userData.isActive,
        emailVerified: userData.role === 'ADMIN' ? new Date() : null,
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

    // Clear cache
    apiCache.clear();

    // Record success metric
    monitoring.recordCounter('users.create.success', 1);
    monitoring.recordTimer('users.create.duration', Date.now() - startTime);

    logger.info('User created successfully', {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      userId: currentUser.id,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(newUser, { status: 201 });

  } catch (error) {
    logger.error('Failed to create user', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('users.create.errors', 1);

    throw error;
  }
});

// Apply API versioning decorator
export const GET = withApiVersioning(GETHandler);
export const POST = withApiVersioning(POSTHandler);


