/**
 * Unit Tests for Payment Webhook
 * Tests webhook handler with mocked Stripe and database
 * 
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { mockPrismaClient, resetPrismaMocks } from '@/tests/mocks/prisma';
import { mockStripe, mockPaymentIntent, mockPaymentIntentFailed, resetStripeMocks } from '@/tests/mocks/stripe';
import { setupMocks, cleanupMocks } from '@/tests/mocks';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
}));

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn(() => mockStripe);
});

// Mock Next.js headers - will be overridden in individual tests
let mockHeadersGet: jest.Mock;

jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({
    get: jest.fn((key: string) => {
      if (mockHeadersGet) {
        return mockHeadersGet(key);
      }
      if (key === 'stripe-signature') {
        return 'mock_signature';
      }
      return null;
    }),
  })),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock payment security
jest.mock('@/lib/payment-security', () => ({
  paymentSecurity: {
    logSecurityEvent: jest.fn(),
  },
}));

describe('Payment Webhook Unit Tests', () => {
  beforeEach(() => {
    setupMocks();
    resetPrismaMocks();
    resetStripeMocks();
  });

  afterEach(() => {
    cleanupMocks();
    jest.clearAllMocks();
  });

  describe('Webhook Event Processing', () => {
    beforeEach(() => {
      // Reset mock headers get function
      mockHeadersGet = jest.fn((key: string) => {
        if (key === 'stripe-signature') {
          return 'mock_signature';
        }
        return null;
      });
    });

    it('should process payment_intent.succeeded event', async () => {
      const mockPayment = {
        id: 'payment_test_123',
        orderId: 'order_test_123',
        userId: 'user_test_123',
        status: 'PENDING',
        order: {
          id: 'order_test_123',
          status: 'PENDING',
        },
      };

      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: mockPaymentIntent,
        },
      };

      mockStripe.webhooks.constructEvent = jest.fn().mockReturnValue(mockEvent);
      mockPrismaClient.payment.findUnique = jest.fn().mockResolvedValue(mockPayment);
      mockPrismaClient.$transaction = jest.fn().mockResolvedValue([
        { ...mockPayment, status: 'SUCCEEDED' },
        { ...mockPayment.order, status: 'PROCESSING' },
      ]);

      const { POST } = await import('@/app/api/payments/webhook/route');
      
      const request = new NextRequest('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
    });

    it('should process payment_intent.payment_failed event', async () => {
      const mockPayment = {
        id: 'payment_test_123',
        status: 'PENDING',
      };

      const mockEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: mockPaymentIntentFailed,
        },
      };

      mockStripe.webhooks.constructEvent = jest.fn().mockReturnValue(mockEvent);
      mockPrismaClient.payment.findUnique = jest.fn().mockResolvedValue(mockPayment);
      mockPrismaClient.payment.update = jest.fn().mockResolvedValue({
        ...mockPayment,
        status: 'FAILED',
      });

      const { POST } = await import('@/app/api/payments/webhook/route');
      
      const request = new NextRequest('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(mockPrismaClient.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED',
          }),
        })
      );
    });

    it('should reject webhook without signature', async () => {
      // Mock headers to return null for stripe-signature
      mockHeadersGet = jest.fn((key: string) => {
        if (key === 'stripe-signature') {
          return null;
        }
        return null;
      });

      const { POST } = await import('@/app/api/payments/webhook/route');
      
      const request = new NextRequest('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body: JSON.stringify({ type: 'payment_intent.succeeded' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No signature provided');
    });

    it('should reject webhook with invalid signature', async () => {
      mockStripe.webhooks.constructEvent = jest.fn().mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const { POST } = await import('@/app/api/payments/webhook/route');
      
      const request = new NextRequest('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body: JSON.stringify({ type: 'payment_intent.succeeded' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid signature');
    });

    it('should handle unhandled event types', async () => {
      const mockEvent = {
        type: 'customer.subscription.created',
        data: {
          object: { id: 'sub_test_123' },
        },
      };

      mockStripe.webhooks.constructEvent = jest.fn().mockReturnValue(mockEvent);

      const { POST } = await import('@/app/api/payments/webhook/route');
      
      const request = new NextRequest('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
    });
  });
});
