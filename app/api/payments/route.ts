import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { errorHandler, asyncHandler, ValidationError, NotFoundError, AuthorizationError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { monitoring } from '@/lib/monitoring';
import { withApiVersioning } from '@/lib/api-versioning';
import { getCurrentUser, requireAuth, UserRole } from '@/lib/auth-utils';
import Stripe from 'stripe';
import { db as prisma } from '@/lib/database';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Payment schemas
const PaymentSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  userId: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED']),
  paymentMethod: z.string(),
  stripePaymentIntentId: z.string().optional(),
  stripeChargeId: z.string().optional(),
  refundId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const CreatePaymentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  returnUrl: z.string().url('Invalid return URL').optional(),
});

const RefundPaymentSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID'),
  amount: z.number().positive('Refund amount must be positive').optional(),
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).optional(),
});

// Create payment intent
const POSTHandler = asyncHandler(async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Check authentication
    const currentUser = await requireAuth();
    
    // Parse request body
    const body = await request.json();
    const paymentData = CreatePaymentSchema.parse(body);
    
    logger.info('Creating payment intent', {
      orderId: paymentData.orderId,
      userId: currentUser.id,
    });

    // Record metric
    monitoring.recordCounter('payments.create.requests', 1, {
      userId: currentUser.id,
    });

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: paymentData.orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check authorization - users can only pay for their own orders
    if (order.userId !== currentUser.id) {
      throw new AuthorizationError('Access denied');
    }

    // Check if order is in valid state for payment
    if (order.status !== 'PENDING') {
      throw new ValidationError('Order is not in a valid state for payment');
    }

    // Check if payment already exists for this order
    const existingPayment = await prisma.payment.findFirst({
      where: {
        orderId: paymentData.orderId,
        status: {
          in: ['PENDING', 'SUCCEEDED'],
        },
      },
    });

    if (existingPayment) {
      throw new ValidationError('A payment already exists for this order');
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order.id,
        userId: currentUser.id,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        userId: currentUser.id,
        amount: order.total,
        currency: 'usd',
        status: 'PENDING',
        paymentMethod: paymentData.paymentMethod,
        stripePaymentIntentId: paymentIntent.id,
        metadata: paymentData.returnUrl ? {
          returnUrl: paymentData.returnUrl,
        } : undefined,
      },
    });
    logger.debug('Created payment record', { paymentId: payment.id, orderId: payment.orderId });

    // Record success metric
    monitoring.recordCounter('payments.create.success', 1);
    monitoring.recordTimer('payments.create.duration', Date.now() - startTime);

    logger.info('Payment intent created successfully', {
      paymentId: payment.id,
      orderId: order.id,
      userId: currentUser.id,
      amount: order.total,
      duration: Date.now() - startTime,
    });

    return NextResponse.json({
      paymentId: payment.id,
      clientSecret: paymentIntent.client_secret,
      amount: order.total,
      currency: 'usd',
    }, { status: 201 });

  } catch (error) {
    logger.error('Failed to create payment intent', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('payments.create.errors', 1);

    throw error;
  }
});

// Confirm payment
const PUTHandler = asyncHandler(async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();
    const { paymentId, paymentIntentId } = z.object({
      paymentId: z.string().uuid('Invalid payment ID'),
      paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
    }).parse(body);
    
    logger.info('Confirming payment', {
      paymentId,
      paymentIntentId,
    });

    // Record metric
    monitoring.recordCounter('payments.confirm.requests', 1);

    // Get current user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new AuthorizationError('Authentication required');
    }

    // Get payment from database
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: true,
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // Check authorization - users can only confirm their own payments
    if (payment.userId !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
      throw new AuthorizationError('Access denied');
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update payment status in database
      logger.info('Payment succeeded, updating payment status', { paymentId });

      // Use transaction to update both payment and order atomically
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'SUCCEEDED',
            stripeChargeId: paymentIntent.latest_charge as string | undefined,
            updatedAt: new Date(),
          },
        }),
        prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status: 'PROCESSING',
            updatedAt: new Date(),
          },
        }),
      ]);

      // Record success metric
      monitoring.recordCounter('payments.confirm.success', 1);
      monitoring.recordTimer('payments.confirm.duration', Date.now() - startTime);

      logger.info('Payment confirmed successfully', {
        paymentId,
        orderId: payment.orderId,
        amount: payment.amount,
        duration: Date.now() - startTime,
      });

      return NextResponse.json({
        message: 'Payment confirmed successfully',
        status: 'SUCCEEDED',
      });
    } else {
      // Update payment status to failed in database
      logger.warn('Payment failed, updating payment status', { paymentId });

      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'FAILED',
          updatedAt: new Date(),
        },
      });

      // Record failure metric
      monitoring.recordCounter('payments.confirm.failed', 1);

      logger.warn('Payment confirmation failed', {
        paymentId,
        status: paymentIntent.status,
      });

      return NextResponse.json({
        message: 'Payment confirmation failed',
        status: 'FAILED',
      }, { status: 400 });
    }

  } catch (error) {
    logger.error('Failed to confirm payment', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('payments.confirm.errors', 1);

    throw error;
  }
});

// Refund payment
const PATCHHandler = asyncHandler(async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Check authentication and authorization
    const currentUser = await requireAuth(); // Changed from requireModeratorOrAdmin to requireAuth
    
    // Parse request body
    const body = await request.json();
    const refundData = RefundPaymentSchema.parse(body);
    
    logger.info('Processing refund', {
      paymentId: refundData.paymentId,
      userId: currentUser.id,
    });

    // Record metric
    monitoring.recordCounter('payments.refund.requests', 1, {
      userId: currentUser.id,
    });

    // Get payment from database
    const payment = await prisma.payment.findUnique({
      where: { id: refundData.paymentId },
      include: {
        order: true,
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // Check authorization - users can only refund their own payments, admins can refund any
    if (payment.userId !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
      throw new AuthorizationError('Access denied');
    }

    // Check if payment can be refunded
    if (payment.status !== 'SUCCEEDED') {
      throw new ValidationError('Payment cannot be refunded. Only succeeded payments can be refunded.');
    }

    if (!payment.stripePaymentIntentId) {
      throw new ValidationError('Payment does not have a Stripe payment intent ID');
    }

    // Create Stripe refund
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      amount: refundData.amount ? Math.round(refundData.amount * 100) : undefined,
      reason: refundData.reason,
    });

    // Update payment status in database
    logger.info('Payment refunded, updating payment status', { paymentId: payment.id });

    // Use transaction to update both payment and order atomically
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: refundData.paymentId },
        data: {
          status: 'REFUNDED',
          refundId: refund.id,
          updatedAt: new Date(),
        },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date(),
        },
      }),
    ]);

    // Record success metric
    monitoring.recordCounter('payments.refund.success', 1);
    monitoring.recordTimer('payments.refund.duration', Date.now() - startTime);

    logger.info('Refund processed successfully', {
      paymentId: payment.id,
      orderId: payment.orderId,
      refundId: refund.id,
      amount: refund.amount / 100,
      userId: currentUser.id,
      duration: Date.now() - startTime,
    });

    return NextResponse.json({
      message: 'Refund processed successfully',
      refundId: refund.id,
      amount: refund.amount / 100,
    });

  } catch (error) {
    logger.error('Failed to process refund', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('payments.refund.errors', 1);

    throw error;
  }
});

// Get payment status
const GETHandler = asyncHandler(async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();
  
  try {
    // Check authentication
    const currentUser = await requireAuth();
    
    const { searchParams } = request.nextUrl;
    const paymentId = searchParams.get('paymentId');
    
    if (!paymentId) {
      throw new ValidationError('Payment ID is required');
    }
    
    logger.info('Getting payment status', {
      paymentId,
      userId: currentUser.id,
    });

    // Record metric
    monitoring.recordCounter('payments.status.requests', 1, {
      userId: currentUser.id,
    });

    // Get payment from database
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: true,
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // Check authorization - users can only view their own payments
    if (payment.userId !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
      throw new AuthorizationError('Access denied');
    }

    // Record success metric
    monitoring.recordCounter('payments.status.success', 1);
    monitoring.recordTimer('payments.status.duration', Date.now() - startTime);

    logger.info('Payment status retrieved successfully', {
      paymentId,
      status: payment.status,
      userId: currentUser.id,
      duration: Date.now() - startTime,
    });

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      orderId: payment.orderId,
      orderStatus: payment.order.status,
    });

  } catch (error) {
    logger.error('Failed to get payment status', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
    });

    // Record error metric
    monitoring.recordCounter('payments.status.errors', 1);

    throw error;
  }
});

// Apply API versioning decorator
export const POST = withApiVersioning(POSTHandler);
export const PUT = withApiVersioning(PUTHandler);
export const PATCH = withApiVersioning(PATCHHandler);
export const GET = withApiVersioning(GETHandler);


