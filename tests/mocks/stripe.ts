/**
 * Stripe API Mock
 * Provides mocked Stripe client for testing without actual Stripe API calls
 */

export const mockStripe = {
  paymentIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
    cancel: jest.fn(),
    confirm: jest.fn(),
  },
  refunds: {
    create: jest.fn(),
    retrieve: jest.fn(),
    list: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

export const resetStripeMocks = () => {
  Object.values(mockStripe).forEach((service) => {
    Object.values(service).forEach((method) => {
      if (jest.isMockFunction(method)) {
        method.mockReset();
      }
    });
  });
};

// Mock Stripe payment intent responses
export const mockPaymentIntent = {
  id: 'pi_test_1234567890',
  object: 'payment_intent',
  amount: 10000,
  currency: 'usd',
  status: 'succeeded',
  client_secret: 'pi_test_1234567890_secret_test',
  metadata: {
    orderId: 'order_test_123',
    userId: 'user_test_123',
  },
  latest_charge: 'ch_test_1234567890',
};

export const mockPaymentIntentPending = {
  ...mockPaymentIntent,
  status: 'requires_payment_method',
};

export const mockPaymentIntentFailed = {
  ...mockPaymentIntent,
  status: 'payment_failed',
};

export const mockRefund = {
  id: 're_test_1234567890',
  object: 'refund',
  amount: 10000,
  currency: 'usd',
  payment_intent: 'pi_test_1234567890',
  status: 'succeeded',
  reason: 'requested_by_customer',
};

export default mockStripe;
