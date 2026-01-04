# Testing Guide - Mocked Dependencies

This guide explains how to run tests with mocked database connections, Stripe API keys, and webhook configurations.

## Overview

All unit tests use comprehensive mocks that eliminate the need for:
- ✅ Database connections
- ✅ Stripe API keys
- ✅ Webhook endpoints
- ✅ External services

Tests can run completely offline and without any configuration!

## Quick Start

### Run All Unit Tests
```bash
npm run test
```

### Run Payment Tests Specifically
```bash
# Unit tests (mocked - no dependencies needed)
npm run test -- tests/unit/api/payments

# Integration tests (requires database)
npm run test -- tests/integration/api/payments
```

## Mock Architecture

### 1. Database Mocks (`tests/mocks/prisma.ts`)

Mocks all Prisma Client operations:

```typescript
import { mockPrismaClient } from '@/tests/mocks/prisma';

// In your test
mockPrismaClient.payment.findUnique = jest.fn().mockResolvedValue({
  id: 'payment_123',
  status: 'PENDING',
  // ... other fields
});

mockPrismaClient.payment.create = jest.fn().mockResolvedValue({
  id: 'payment_123',
  // ... created payment
});
```

**Available Mock Methods:**
- `payment.create()`
- `payment.findUnique()`
- `payment.findFirst()`
- `payment.findMany()`
- `payment.update()`
- `payment.delete()`
- `$transaction()`
- And more...

### 2. Stripe Mocks (`tests/mocks/stripe.ts`)

Mocks all Stripe API calls:

```typescript
import { mockStripe, mockPaymentIntent } from '@/tests/mocks/stripe';

// In your test
mockStripe.paymentIntents.create = jest.fn().mockResolvedValue(mockPaymentIntent);
mockStripe.paymentIntents.retrieve = jest.fn().mockResolvedValue({
  ...mockPaymentIntent,
  status: 'succeeded',
});
mockStripe.refunds.create = jest.fn().mockResolvedValue({
  id: 're_test_123',
  amount: 10000,
});
```

**Available Mock Services:**
- `paymentIntents.*` (create, retrieve, update, cancel, confirm)
- `refunds.*` (create, retrieve, list)
- `webhooks.*` (constructEvent)

### 3. Environment Variables (`tests/mocks/index.ts`)

Provides mock environment variables:

```typescript
import { mockEnv, setupMocks } from '@/tests/mocks';

// Automatically set in jest.setup.js
// Or manually:
setupMocks(); // Sets all env vars to mock values
```

**Mocked Variables:**
- `STRIPE_SECRET_KEY=sk_test_mock_key`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_mock_key`
- `STRIPE_WEBHOOK_SECRET=whsec_mock_webhook_secret`
- `DATABASE_URL=postgresql://mock:mock@localhost:5432/mock_db`
- And more...

## Example Test Files

### Payment API Unit Test

See: `tests/unit/api/payments.test.ts`

**Key Features:**
- ✅ No database connection needed
- ✅ No Stripe API keys needed
- ✅ Tests payment creation, confirmation, refunds
- ✅ Tests error handling
- ✅ Tests authorization

### Webhook Unit Test

See: `tests/unit/api/payments-webhook.test.ts`

**Key Features:**
- ✅ No webhook endpoint needed
- ✅ Mocks Stripe webhook events
- ✅ Tests signature validation
- ✅ Tests event processing

## Running Tests

### Unit Tests (Recommended - Fast & Isolated)

```bash
# All unit tests
npm run test

# Payment API tests only
npm run test -- tests/unit/api/payments.test.ts

# Webhook tests only
npm run test -- tests/unit/api/payments-webhook.test.ts

# Watch mode (auto-rerun on changes)
npm run test:watch
```

### Integration Tests (Requires Database)

```bash
# Run integration tests (requires DATABASE_URL)
npm run test -- tests/integration/api/payments.test.ts
```

### Coverage Report

```bash
npm run test:coverage
```

Opens coverage report showing which code is tested.

## Writing New Tests

### Step 1: Import Mocks

```typescript
import { mockPrismaClient, resetPrismaMocks } from '@/tests/mocks/prisma';
import { mockStripe, resetStripeMocks } from '@/tests/mocks/stripe';
import { setupMocks } from '@/tests/mocks';
```

### Step 2: Set Up Test

```typescript
describe('My Feature Tests', () => {
  beforeEach(() => {
    setupMocks();
    resetPrismaMocks();
    resetStripeMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
```

### Step 3: Mock Dependencies

```typescript
it('should do something', async () => {
  // Mock database response
  mockPrismaClient.payment.findUnique = jest.fn().mockResolvedValue({
    id: 'payment_123',
    status: 'PENDING',
  });

  // Mock Stripe response
  mockStripe.paymentIntents.create = jest.fn().mockResolvedValue({
    id: 'pi_test_123',
    client_secret: 'pi_test_123_secret',
  });

  // Import and test your handler
  const { POST } = await import('@/app/api/payments/route');
  const request = new NextRequest('http://localhost:3000/api/payments', {
    method: 'POST',
    body: JSON.stringify({ orderId: 'order_123' }),
  });

  const response = await POST(request);
  const data = await response.json();

  // Assertions
  expect(response.status).toBe(201);
  expect(data.paymentId).toBeDefined();
  expect(mockPrismaClient.payment.create).toHaveBeenCalled();
});
```

## Mock Reset Functions

Always reset mocks between tests:

```typescript
beforeEach(() => {
  resetPrismaMocks();  // Reset all Prisma mocks
  resetStripeMocks();  // Reset all Stripe mocks
  jest.clearAllMocks(); // Clear all Jest mocks
});
```

## Common Patterns

### Testing Success Cases

```typescript
mockPrismaClient.payment.create = jest.fn().mockResolvedValue(mockPayment);
mockStripe.paymentIntents.create = jest.fn().mockResolvedValue(mockPaymentIntent);

// Test should pass
```

### Testing Error Cases

```typescript
mockPrismaClient.payment.findUnique = jest.fn().mockResolvedValue(null);

// Test should throw NotFoundError
await expect(handler(request)).rejects.toThrow();
```

### Testing Transactions

```typescript
mockPrismaClient.$transaction = jest.fn().mockImplementation(async (callback) => {
  return await callback(mockPrismaClient);
});

// Test transaction logic
```

## Troubleshooting

### Mock Not Working

**Problem**: Mock isn't being used

**Solution**: 
- Ensure mock is set up BEFORE importing the module under test
- Use `jest.mock()` at the top level
- Reset mocks in `beforeEach`

### Module Not Found

**Problem**: Import errors

**Solution**:
- Check `moduleNameMapper` in `jest.config.js`
- Use `@/` prefix for imports
- Ensure path aliases are configured

### Tests Hanging

**Problem**: Tests never complete

**Solution**:
- Check for unresolved promises
- Ensure all mocks return promises when needed
- Add timeouts to tests if needed

### Type Errors

**Problem**: TypeScript errors in tests

**Solution**:
- Install `@types/jest`
- Check type definitions for mocks
- Use `as any` sparingly for complex mocks

## Benefits of Mocked Tests

1. **Speed**: Tests run instantly (no network/database calls)
2. **Reliability**: No flaky tests from external services
3. **Isolation**: Each test is completely independent
4. **No Configuration**: Run anywhere without setup
5. **CI/CD Friendly**: Works in any environment
6. **Cost**: No API usage costs
7. **Offline**: Works without internet connection

## When to Use Integration Tests

Use integration tests (with real database) for:
- Complex database queries
- Transaction behavior
- Relationship validation
- Migration testing
- Performance testing

Use unit tests (with mocks) for:
- Business logic
- Error handling
- Authorization
- API contract validation
- Fast feedback during development

---

**All payment tests can run without any external dependencies!** 🎉

