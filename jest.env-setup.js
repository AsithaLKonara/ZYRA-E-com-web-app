// Setup environment variables BEFORE any modules are imported
// This file runs before setupFilesAfterEnv

process.env.NODE_ENV = 'test';
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-purposes-only-minimum-32-characters-long';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Set DATABASE_URL if not already set (don't override if explicitly provided)
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://asithalakmal@localhost:5432/zyra_fashion?schema=public';
}

// Log DATABASE_URL for debugging (only in test environment)
if (process.env.DEBUG === 'true') {
  console.log('[jest.env-setup] DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Missing');
}

process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key';
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_mock_key';
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock_webhook_secret';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.RESEND_API_KEY = 'test-resend-key';
process.env.BLOB_READ_WRITE_TOKEN = 'test-blob-token';

