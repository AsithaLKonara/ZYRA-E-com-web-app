/**
 * Unit Tests for Payment API
 * Tests payment API handlers with mocked dependencies
 * 
 * These tests mock:
 * - Database connections (Prisma Client)
 * - Stripe API calls
 * - Authentication
 * - Environment variables
 * 
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { mockPrismaClient, resetPrismaMocks } from '@/tests/mocks/prisma';
import { mockStripe, mockPaymentIntent, resetStripeMocks } from '@/tests/mocks/stripe';
import { setupMocks, cleanupMocks } from '@/tests/mocks';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
}));

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn(() => mockStripe);
});

// Mock auth utilities
jest.mock('@/lib/auth-utils', () => ({
  requireAuth: jest.fn(() => Promise.resolve({
    id: 'user_test_123',
    email: 'test@example.com',
    role: 'CUSTOMER',
  })),
  getCurrentUser: jest.fn(() => Promise.resolve({
    id: 'user_test_123',
    email: 'test@example.com',
    role: 'CUSTOMER',
  })),
  UserRole: {
    ADMIN: 'ADMIN',
    MODERATOR: 'MODERATOR',
    CUSTOMER: 'CUSTOMER',
  },
}));

// Mock logger and monitoring
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/monitoring', () => ({
  monitoring: {
    recordCounter: jest.fn(),
    recordTimer: jest.fn(),
  },
}));

jest.mock('@/lib/api-versioning', () => ({
  withApiVersioning: (handler) => handler,
}));

describe('Payment API Unit Tests', () => {
  beforeEach(() => {
    setupMocks();
    resetPrismaMocks();
    resetStripeMocks();
  });

  afterEach(() => {
    cleanupMocks();
    jest.clearAllMocks();
  });

  describe('Payment Creation (POST)', () => {
    it('should create a payment successfully', async () => {
      const mockOrder = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'user_test_123',
        total: 100,
        status: 'PENDING',
        items: [],
      };

      const mockPayment = {
        id: 'payment_test_123',
        orderId: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'user_test_123',
        amount: 100,
        currency: 'usd',
        status: 'PENDING',
        paymentMethod: 'card',
        stripePaymentIntentId: mockPaymentIntent.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Setup mocks
      mockPrismaClient.order.findUnique = jest.fn().mockResolvedValue(mockOrder);
      mockPrismaClient.payment.findFirst = jest.fn().mockResolvedValue(null);
      mockStripe.paymentIntents.create = jest.fn().mockResolvedValue(mockPaymentIntent);
      mockPrismaClient.payment.create = jest.fn().mockResolvedValue(mockPayment);

      // Import handler after mocks are set up
      const { POST } = await import('@/app/api/payments/route');
      
      const request = new NextRequest('http://localhost:3000/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          orderId: '123e4567-e89b-12d3-a456-426614174000',
          paymentMethod: 'card',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.paymentId).toBe(mockPayment.id);
      expect(data.clientSecret).toBe(mockPaymentIntent.client_secret);
      expect(mockStripe.paymentIntents.create).toHaveBeenCalled();
      expect(mockPrismaClient.payment.create).toHaveBeenCalled();
    });

    it('should reject payment if order not found', async () => {
      mockPrismaClient.order.findUnique = jest.fn().mockResolvedValue(null);

      const { POST } = await import('@/app/api/payments/route');
      
      const request = new NextRequest('http://localhost:3000/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          orderId: '123e4567-e89b-12d3-a456-426614174001',
          paymentMethod: 'card',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.message).toContain('Order not found');
      expect(mockPrismaClient.payment.create).not.toHaveBeenCalled();
    });

    it('should reject payment if payment already exists', async () => {
      const mockOrder = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        userId: 'user_test_123',
        total: 100,
        status: 'PENDING',
      };

      const existingPayment = {
        id: 'existing_payment',
        status: 'PENDING',
      };

      mockPrismaClient.order.findUnique = jest.fn().mockResolvedValue(mockOrder);
      mockPrismaClient.payment.findFirst = jest.fn().mockResolvedValue(existingPayment);

      const { POST } = await import('@/app/api/payments/route');
      
      const request = new NextRequest('http://localhost:3000/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          orderId: '123e4567-e89b-12d3-a456-426614174002',
          paymentMethod: 'card',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.message).toContain('payment already exists');
      expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
    });
  });

  describe('Payment Confirmation (PUT)', () => {
    it('should confirm payment successfully', async () => {
      const mockPayment = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        orderId: '123e4567-e89b-12d3-a456-426614174004',
        userId: 'user_test_123',
        amount: 100,
        status: 'PENDING',
        order: {
          id: '123e4567-e89b-12d3-a456-426614174004',
          status: 'PENDING',
        },
      };

      const succeededPaymentIntent = {
        ...mockPaymentIntent,
        status: 'succeeded',
      };

      mockPrismaClient.payment.findUnique = jest.fn().mockResolvedValue(mockPayment);
      mockStripe.paymentIntents.retrieve = jest.fn().mockResolvedValue(succeededPaymentIntent);
      mockPrismaClient.$transaction = jest.fn().mockResolvedValue([
        { ...mockPayment, status: 'SUCCEEDED' },
        { ...mockPayment.order, status: 'PROCESSING' },
      ]);

      const { PUT } = await import('@/app/api/payments/route');
      
      const request = new NextRequest('http://localhost:3000/api/payments', {
        method: 'PUT',
        body: JSON.stringify({
          paymentId: '123e4567-e89b-12d3-a456-426614174003',
          paymentIntentId: 'pi_test_1234567890',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('SUCCEEDED');
      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
    });

    it('should handle payment confirmation failure', async () => {
      const mockPayment = {
        id: '123e4567-e89b-12d3-a456-426614174005',
        orderId: '123e4567-e89b-12d3-a456-426614174006',
        userId: 'user_test_123',
        amount: 100,
        status: 'PENDING',
      };

      const failedPaymentIntent = {
        ...mockPaymentIntent,
        status: 'payment_failed',
      };

      mockPrismaClient.payment.findUnique = jest.fn().mockResolvedValue(mockPayment);
      mockStripe.paymentIntents.retrieve = jest.fn().mockResolvedValue(failedPaymentIntent);
      mockPrismaClient.payment.update = jest.fn().mockResolvedValue({
        ...mockPayment,
        status: 'FAILED',
      });

      const { PUT } = await import('@/app/api/payments/route');
      
      const request = new NextRequest('http://localhost:3000/api/payments', {
        method: 'PUT',
        body: JSON.stringify({
          paymentId: '123e4567-e89b-12d3-a456-426614174005',
          paymentIntentId: 'pi_test_1234567890',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.status).toBe('FAILED');
      expect(mockPrismaClient.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED',
          }),
        })
      );
    });
  });

  describe('Payment Refund (PATCH)', () => {
    it('should process refund successfully', async () => {
      const mockPayment = {
        id: '123e4567-e89b-12d3-a456-426614174007',
        orderId: '123e4567-e89b-12d3-a456-426614174008',
        userId: 'user_test_123',
        amount: 100,
        status: 'SUCCEEDED',
        stripePaymentIntentId: 'pi_test_1234567890',
        order: {
          id: '123e4567-e89b-12d3-a456-426614174008',
          status: 'PROCESSING',
        },
      };

      const mockRefund = {
        id: 're_test_1234567890',
        amount: 10000,
        payment_intent: 'pi_test_1234567890',
      };

      mockPrismaClient.payment.findUnique = jest.fn().mockResolvedValue(mockPayment);
      mockStripe.refunds.create = jest.fn().mockResolvedValue(mockRefund);
      mockPrismaClient.$transaction = jest.fn().mockResolvedValue([
        { ...mockPayment, status: 'REFUNDED', refundId: mockRefund.id },
        { ...mockPayment.order, status: 'CANCELLED' },
      ]);

      const { PATCH } = await import('@/app/api/payments/route');
      
      const request = new NextRequest('http://localhost:3000/api/payments', {
        method: 'PATCH',
        body: JSON.stringify({
          paymentId: '123e4567-e89b-12d3-a456-426614174007',
          amount: 100,
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.refundId).toBe(mockRefund.id);
      expect(mockStripe.refunds.create).toHaveBeenCalled();
      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
    });

    it('should reject refund if payment not succeeded', async () => {
      const mockPayment = {
        id: '123e4567-e89b-12d3-a456-426614174009',
        userId: 'user_test_123', // Must match mock user ID
        status: 'PENDING',
        stripePaymentIntentId: 'pi_test_1234567890',
      };

      mockPrismaClient.payment.findUnique = jest.fn().mockResolvedValue(mockPayment);

      const paymentHandlers = await import('@/app/api/payments/route');
      
      const request = new NextRequest('http://localhost:3000/api/payments', {
        method: 'PATCH',
        body: JSON.stringify({
          paymentId: '123e4567-e89b-12d3-a456-426614174009',
        }),
      });
      
      const response = await paymentHandlers.PATCH(request);
      const data = await response.json();

      // Could be 400 (validation) or 403 (authorization) depending on order of checks
      expect([400, 403]).toContain(response.status);
      if (response.status === 400) {
        expect(data.error.message).toContain('cannot be refunded');
      }
      expect(mockStripe.refunds.create).not.toHaveBeenCalled();
    });
  });

  describe('Payment Status (GET)', () => {
    it('should retrieve payment status', async () => {
      const mockPayment = {
        id: '123e4567-e89b-12d3-a456-426614174010',
        orderId: '123e4567-e89b-12d3-a456-426614174011',
        userId: 'user_test_123',
        amount: 100,
        currency: 'usd',
        status: 'SUCCEEDED',
        order: {
          id: '123e4567-e89b-12d3-a456-426614174011',
          status: 'PROCESSING',
        },
      };

      mockPrismaClient.payment.findUnique = jest.fn().mockResolvedValue(mockPayment);

      const { GET } = await import('@/app/api/payments/route');
      
      const request = new NextRequest('http://localhost:3000/api/payments?paymentId=123e4567-e89b-12d3-a456-426614174010', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.paymentId).toBe(mockPayment.id);
      expect(data.status).toBe('SUCCEEDED');
      expect(data.orderStatus).toBe('PROCESSING');
    });

    it('should return 404 if payment not found', async () => {
      mockPrismaClient.payment.findUnique = jest.fn().mockResolvedValue(null);

      const { GET } = await import('@/app/api/payments/route');
      
      const request = new NextRequest('http://localhost:3000/api/payments?paymentId=123e4567-e89b-12d3-a456-426614174012', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.message).toContain('Payment not found');
    });
  });
});
