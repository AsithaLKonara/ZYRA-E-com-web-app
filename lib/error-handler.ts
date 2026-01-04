import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from './logger';
import { isDevelopment } from './env';

// Custom error classes
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, true, context);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context?: Record<string, any>) {
    super(message, 401, true, context);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: Record<string, any>) {
    super(message, 403, true, context);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', context?: Record<string, any>) {
    super(message, 404, true, context);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 409, true, context);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context?: Record<string, any>) {
    super(message, 429, true, context);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, context?: Record<string, any>) {
    super(`External service error (${service}): ${message}`, 502, true, context);
  }
}

// Error response interface
interface ErrorResponse {
  error: {
    message: string;
    code: string;
    statusCode: number;
    timestamp: string;
    path?: string;
    method?: string;
    requestId?: string;
    context?: Record<string, any>;
    stack?: string;
  };
}

// Generate error response
function generateErrorResponse(
  error: Error,
  statusCode: number,
  request?: NextRequest,
  requestId?: string
): ErrorResponse {
  const response: ErrorResponse = {
    error: {
      message: error.message,
      code: error.constructor.name,
      statusCode,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  if (request) {
    response.error.path = request.nextUrl.pathname;
    response.error.method = request.method;
  }

  // Add context if it's an AppError
  if (error instanceof AppError && error.context) {
    response.error.context = error.context;
  }

  // Add stack trace in development
  if (isDevelopment && error.stack) {
    response.error.stack = error.stack;
  }

  return response;
}

// Handle different error types
function handleError(error: Error, request?: NextRequest, requestId?: string): NextResponse {
  let statusCode = 500;
  let message = 'Internal server error';

  // Handle custom AppError
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }
  // Handle Zod validation errors
  else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation error';
    const validationErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));
    
    return NextResponse.json(
      generateErrorResponse(error, statusCode, request, requestId),
      { status: statusCode }
    );
  }
  // Handle Prisma errors
  else if (error.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    message = 'Database operation failed';
  }
  // Handle Prisma connection errors
  else if (error.name === 'PrismaClientInitializationError') {
    statusCode = 503;
    message = 'Database connection failed';
  }
  // Handle Prisma validation errors
  else if (error.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Database validation error';
  }
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  // Handle JWT expiration
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  // Handle Stripe errors
  else if (error.name === 'StripeError') {
    statusCode = 400;
    message = 'Payment processing error';
  }
  // Handle network errors
  else if (error.name === 'FetchError' || error.message.includes('fetch')) {
    statusCode = 502;
    message = 'External service unavailable';
  }
  // Handle timeout errors
  else if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
    statusCode = 504;
    message = 'Request timeout';
  }

  // Log the error
  logger.error(
    `Error ${statusCode}: ${message}`,
    {
      stack: error.stack,
      name: error.name,
    },
    error,
    requestId
  );

  // Generate error response
  const errorResponse = generateErrorResponse(error, statusCode, request, requestId);
  
  return NextResponse.json(errorResponse, { status: statusCode });
}

// Main error handler middleware
export function errorHandler(
  error: Error,
  request?: NextRequest,
  requestId?: string
): NextResponse {
  return handleError(error, request, requestId);
}

// Async error wrapper for API routes
export function asyncHandler<T extends any[]>(
  fn: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await fn(...args);
    } catch (error) {
      return errorHandler(error as Error, args[0] as NextRequest);
    }
  };
}

// Error boundary for React components
export class ErrorBoundary extends Error {
  constructor(message: string, componentStack?: string) {
    super(message);
    this.name = 'ErrorBoundary';
    if (componentStack) {
      this.stack = componentStack;
    }
  }
}

// Utility functions
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

export function getErrorStatusCode(error: Error): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  return 500;
}

export function getErrorMessage(error: Error): string {
  if (error instanceof AppError) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// Error codes
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// Default error handler for unhandled rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString(),
  });
});

// Default error handler for uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  
  // Exit the process in production
  if (!isDevelopment) {
    process.exit(1);
  }
});

export default errorHandler;