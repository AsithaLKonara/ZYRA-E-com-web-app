/**
 * Test Mocks Index
 * Centralized mock exports for testing
 */

export * from './prisma';
export * from './stripe';

// Mock environment variables
export const mockEnv = {
  STRIPE_SECRET_KEY: 'sk_test_mock_key',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_mock_key',
  STRIPE_WEBHOOK_SECRET: 'whsec_mock_webhook_secret',
  DATABASE_URL: 'postgresql://mock:mock@localhost:5432/mock_db',
  NEXTAUTH_SECRET: 'mock_nextauth_secret',
  NEXTAUTH_URL: 'http://localhost:3000',
};

// Setup function to configure all mocks
export const setupMocks = () => {
  // Mock environment variables
  process.env = {
    ...process.env,
    ...mockEnv,
  };
};

// Cleanup function to reset all mocks
export const cleanupMocks = () => {
  const { resetPrismaMocks } = require('./prisma');
  const { resetStripeMocks } = require('./stripe');
  resetPrismaMocks();
  resetStripeMocks();
};
