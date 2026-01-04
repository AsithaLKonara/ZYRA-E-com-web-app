import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { getTestPrisma, verifyTestDatabaseConnection } from '@/tests/setup/prisma-client';

/**
 * Integration Tests for Payment API
 * 
 * NOTE: These tests require a valid test database connection.
 * Set DATABASE_URL environment variable to point to your test database.
 * 
 * These tests are automatically skipped if DATABASE_URL indicates database is not available.
 * To run integration tests:
 * 1. Set up a test database
 * 2. Set DATABASE_URL to point to your test database
 * 3. Run: npm test -- tests/integration
 */

// Check if we should skip integration tests
const shouldSkipTests = !process.env.DATABASE_URL || 
                       process.env.DATABASE_URL.includes('not available') ||
                       !process.env.DATABASE_URL.startsWith('postgresql://');

const testDescribe = shouldSkipTests ? describe.skip : describe;

testDescribe('Payment API Integration Tests', () => {
  let prisma: ReturnType<typeof getTestPrisma>;
  let testUserId: string;
  let testOrderId: string;
  let testPaymentId: string;

  beforeAll(async () => {
    // Get test Prisma client instance
    prisma = getTestPrisma();
    
    // Verify database connection
    const isConnected = await verifyTestDatabaseConnection();
    if (!isConnected) {
      throw new Error('Test database connection failed. Check DATABASE_URL environment variable.');
    }
    
    // Use unique identifiers to avoid conflicts with seeded data
    const uniqueId = Date.now();
    const testEmail = `test-payment-${uniqueId}@example.com`;
    const testCategorySlug = `test-category-${uniqueId}`;
    const testProductSlug = `test-product-${uniqueId}`;
    const testSku = `TEST-${uniqueId}`;
    
    // Create or get test user (handle case where user might already exist)
    let user = await prisma.user.findUnique({ where: { email: testEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: testEmail,
          name: 'Test Payment User',
          role: 'CUSTOMER',
        },
      });
    }
    testUserId = user.id;

    // Create or get test category
    let category = await prisma.category.findUnique({ where: { slug: testCategorySlug } });
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Test Category',
          slug: testCategorySlug,
        },
      });
    }

    // Create or get test product
    let product = await prisma.product.findUnique({ where: { slug: testProductSlug } });
    if (!product) {
      product = await prisma.product.create({
        data: {
          name: 'Test Product',
          slug: testProductSlug,
          price: 100,
          sku: testSku,
          categoryId: category.id,
          stock: 10,
        },
      });
    }

    // Create test order
    const orderNumber = `TEST-${uniqueId}`;
    let order = await prisma.order.findUnique({ where: { orderNumber } });
    if (!order) {
      order = await prisma.order.create({
        data: {
          orderNumber,
          userId: testUserId,
          status: 'PENDING',
          total: 100,
          subtotal: 100,
          tax: 0,
          shipping: 0,
          shippingAddress: {},
          billingAddress: {},
          items: {
            create: {
              productId: product.id,
              quantity: 1,
              price: 100,
            },
          },
        },
      });
    }
    testOrderId = order.id;
  });

  afterAll(async () => {
    // Cleanup test data in correct order (respecting foreign key constraints)
    try {
      // Get test category and product IDs first
      const testCategory = await prisma.category.findUnique({ where: { slug: 'test-category' } });
      const testProduct = testCategory ? await prisma.product.findFirst({ where: { categoryId: testCategory.id } }) : null;
      
      // Delete payments first (they reference orders)
      if (testPaymentId) {
        await prisma.payment.deleteMany({ where: { id: testPaymentId } });
      }
      await prisma.payment.deleteMany({ where: { orderId: testOrderId } });
      
      // Delete order items before orders (order items reference orders and products)
      await prisma.orderItem.deleteMany({ where: { orderId: testOrderId } });
      
      // Delete orders (orders reference users)
      await prisma.order.deleteMany({ where: { userId: testUserId } });
      
      // Delete reviews before products (reviews reference products)
      if (testProduct) {
        await prisma.review.deleteMany({ where: { productId: testProduct.id } });
      }
      
      // Delete products (they reference categories)
      if (testProduct) {
        await prisma.product.deleteMany({ where: { id: testProduct.id } });
      }
      
      // Delete test category
      if (testCategory) {
        await prisma.category.deleteMany({ where: { id: testCategory.id } });
      }
      
      // Delete user last (users are referenced by orders, payments, etc.)
      await prisma.user.deleteMany({ where: { id: testUserId } });
    } catch (error) {
      console.error('Error during test cleanup:', error);
    } finally {
      await prisma.$disconnect();
    }
  });

  beforeEach(async () => {
    // Clean up payments before each test
    await prisma.payment.deleteMany({ where: { orderId: testOrderId } });
  });

  describe('Payment Creation', () => {
    it('should create a payment record', async () => {
      const payment = await prisma.payment.create({
        data: {
          orderId: testOrderId,
          userId: testUserId,
          amount: 100,
          currency: 'usd',
          status: 'PENDING',
          paymentMethod: 'card',
          stripePaymentIntentId: 'pi_test_123',
        },
      });

      expect(payment).toBeDefined();
      expect(payment.orderId).toBe(testOrderId);
      expect(payment.userId).toBe(testUserId);
      expect(payment.amount).toBe(100);
      expect(payment.status).toBe('PENDING');
      expect(payment.stripePaymentIntentId).toBe('pi_test_123');

      testPaymentId = payment.id;
    });

    it('should not allow duplicate payments for the same order', async () => {
      await prisma.payment.create({
        data: {
          orderId: testOrderId,
          userId: testUserId,
          amount: 100,
          currency: 'usd',
          status: 'PENDING',
          paymentMethod: 'card',
          stripePaymentIntentId: 'pi_test_unique',
        },
      });

      // Try to create another payment with same stripePaymentIntentId should fail
      await expect(
        prisma.payment.create({
          data: {
            orderId: testOrderId,
            userId: testUserId,
            amount: 100,
            currency: 'usd',
            status: 'PENDING',
            paymentMethod: 'card',
            stripePaymentIntentId: 'pi_test_unique',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Payment Status Updates', () => {
    it('should update payment status to SUCCEEDED', async () => {
      const payment = await prisma.payment.create({
        data: {
          orderId: testOrderId,
          userId: testUserId,
          amount: 100,
          currency: 'usd',
          status: 'PENDING',
          paymentMethod: 'card',
          stripePaymentIntentId: 'pi_test_succeed',
        },
      });

      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCEEDED',
          stripeChargeId: 'ch_test_123',
        },
      });

      expect(updatedPayment.status).toBe('SUCCEEDED');
      expect(updatedPayment.stripeChargeId).toBe('ch_test_123');
    });

    it('should update payment status to FAILED', async () => {
      const payment = await prisma.payment.create({
        data: {
          orderId: testOrderId,
          userId: testUserId,
          amount: 100,
          currency: 'usd',
          status: 'PENDING',
          paymentMethod: 'card',
          stripePaymentIntentId: 'pi_test_fail',
        },
      });

      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      expect(updatedPayment.status).toBe('FAILED');
    });

    it('should update payment status to REFUNDED', async () => {
      const payment = await prisma.payment.create({
        data: {
          orderId: testOrderId,
          userId: testUserId,
          amount: 100,
          currency: 'usd',
          status: 'SUCCEEDED',
          paymentMethod: 'card',
          stripePaymentIntentId: 'pi_test_refund',
        },
      });

      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED',
          refundId: 're_test_123',
        },
      });

      expect(updatedPayment.status).toBe('REFUNDED');
      expect(updatedPayment.refundId).toBe('re_test_123');
    });
  });

  describe('Payment-Order Relationship', () => {
    it('should retrieve payment with order relationship', async () => {
      const payment = await prisma.payment.create({
        data: {
          orderId: testOrderId,
          userId: testUserId,
          amount: 100,
          currency: 'usd',
          status: 'PENDING',
          paymentMethod: 'card',
          stripePaymentIntentId: 'pi_test_relation',
        },
        include: {
          order: true,
        },
      });

      expect(payment.order).toBeDefined();
      expect(payment.order.id).toBe(testOrderId);
      expect(payment.order.total).toBe(100);
    });

    it('should retrieve order with payments relationship', async () => {
      await prisma.payment.create({
        data: {
          orderId: testOrderId,
          userId: testUserId,
          amount: 100,
          currency: 'usd',
          status: 'PENDING',
          paymentMethod: 'card',
          stripePaymentIntentId: 'pi_test_order_relation',
        },
      });

      const order = await prisma.order.findUnique({
        where: { id: testOrderId },
        include: {
          payments: true,
        },
      });

      expect(order).toBeDefined();
      if (!order) {
        throw new Error('Order not found');
      }
      expect(order.payments).toBeDefined();
      expect(order.payments.length).toBeGreaterThan(0);
    });
  });

  describe('Payment-User Relationship', () => {
    it('should retrieve payment with user relationship', async () => {
      const payment = await prisma.payment.create({
        data: {
          orderId: testOrderId,
          userId: testUserId,
          amount: 100,
          currency: 'usd',
          status: 'PENDING',
          paymentMethod: 'card',
          stripePaymentIntentId: 'pi_test_user_relation',
        },
        include: {
          user: true,
        },
      });

      expect(payment.user).toBeDefined();
      expect(payment.user.id).toBe(testUserId);
    });
  });

  describe('Payment Queries', () => {
    it('should find payment by stripePaymentIntentId', async () => {
      const payment = await prisma.payment.create({
        data: {
          orderId: testOrderId,
          userId: testUserId,
          amount: 100,
          currency: 'usd',
          status: 'PENDING',
          paymentMethod: 'card',
          stripePaymentIntentId: 'pi_test_find',
        },
      });

      const foundPayment = await prisma.payment.findUnique({
        where: { stripePaymentIntentId: 'pi_test_find' },
      });

      expect(foundPayment).toBeDefined();
      expect(foundPayment?.id).toBe(payment.id);
    });

    it('should find payments by orderId', async () => {
      await prisma.payment.create({
        data: {
          orderId: testOrderId,
          userId: testUserId,
          amount: 100,
          currency: 'usd',
          status: 'PENDING',
          paymentMethod: 'card',
          stripePaymentIntentId: 'pi_test_find_order_1',
        },
      });

      const payments = await prisma.payment.findMany({
        where: { orderId: testOrderId },
      });

      expect(payments.length).toBeGreaterThan(0);
      expect(payments[0]?.orderId).toBe(testOrderId);
    });

    it('should find payments by userId', async () => {
      const payments = await prisma.payment.findMany({
        where: { userId: testUserId },
      });

      expect(Array.isArray(payments)).toBe(true);
      payments.forEach((payment) => {
        expect(payment.userId).toBe(testUserId);
      });
    });
  });

  describe('Payment Validation', () => {
    it('should enforce required fields', async () => {
      await expect(
        prisma.payment.create({
          data: {
            orderId: testOrderId,
            userId: testUserId,
            // Missing required fields: amount, paymentMethod
          } as any,
        })
      ).rejects.toThrow();
    });

    it('should enforce foreign key constraints for orderId', async () => {
      await expect(
        prisma.payment.create({
          data: {
            orderId: 'non-existent-order-id',
            userId: testUserId,
            amount: 100,
            currency: 'usd',
            status: 'PENDING',
            paymentMethod: 'card',
          },
        })
      ).rejects.toThrow();
    });

    it('should enforce foreign key constraints for userId', async () => {
      await expect(
        prisma.payment.create({
          data: {
            orderId: testOrderId,
            userId: 'non-existent-user-id',
            amount: 100,
            currency: 'usd',
            status: 'PENDING',
            paymentMethod: 'card',
          },
        })
      ).rejects.toThrow();
    });
  });
});
