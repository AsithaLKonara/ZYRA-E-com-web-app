# Test Documentation

This directory contains all tests for the ZYRA Fashion e-commerce platform.

## Test Structure

```
tests/
├── unit/              # Unit tests with mocked dependencies
│   ├── api/          # API route unit tests
│   ├── components/   # Component unit tests
│   └── lib/          # Library/utility unit tests
├── integration/      # Integration tests (may require database)
│   └── api/          # API integration tests
├── e2e/              # End-to-end tests (Playwright)
├── mocks/            # Shared mock implementations
│   ├── prisma.ts     # Prisma Client mocks
│   ├── stripe.ts     # Stripe API mocks
│   └── index.ts      # Mock utilities
└── README.md         # This file
```

## Running Tests

### All Tests
```bash
npm run test
```

### Unit Tests Only
```bash
npm run test -- tests/unit
```

### Integration Tests Only
```bash
npm run test -- tests/integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage
```bash
npm run test:coverage
```

## Mocked Dependencies

The test suite includes comprehensive mocks for:

### Database (Prisma)
- **Location**: `tests/mocks/prisma.ts`
- **Usage**: Mocks all Prisma Client operations
- **Benefits**: Tests run without database connection

### Stripe API
- **Location**: `tests/mocks/stripe.ts`
- **Usage**: Mocks Stripe payment operations
- **Benefits**: Tests run without Stripe API keys

### Environment Variables
- **Location**: `tests/mocks/index.ts`
- **Usage**: Provides mock environment variables
- **Benefits**: Tests run without configuration

## Payment API Tests

### Unit Tests (`tests/unit/api/payments.test.ts`)
Tests payment API handlers with all dependencies mocked:
- ✅ Payment creation
- ✅ Payment confirmation
- ✅ Payment refunds
- ✅ Payment status retrieval
- ✅ Error handling
- ✅ Authorization checks

**Dependencies Mocked:**
- Prisma Client (database)
- Stripe API
- Authentication
- Environment variables

**Run:**
```bash
npm run test -- tests/unit/api/payments.test.ts
```

### Webhook Tests (`tests/unit/api/payments-webhook.test.ts`)
Tests webhook handler with mocked Stripe:
- ✅ Payment success events
- ✅ Payment failure events
- ✅ Signature validation
- ✅ Error handling

**Run:**
```bash
npm run test -- tests/unit/api/payments-webhook.test.ts
```

### Integration Tests (`tests/integration/api/payments.test.ts`)
Tests payment functionality with real database (requires database setup):
- ✅ Database operations
- ✅ Payment model relationships
- ✅ Data validation

**Run (requires database):**
```bash
npm run test -- tests/integration/api/payments.test.ts
```

## Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockPrismaClient, resetPrismaMocks } from '@/tests/mocks/prisma';
import { mockStripe, resetStripeMocks } from '@/tests/mocks/stripe';
import { setupMocks, cleanupMocks } from '@/tests/mocks';

describe('Feature Tests', () => {
  beforeEach(() => {
    setupMocks();
    resetPrismaMocks();
    resetStripeMocks();
  });

  afterEach(() => {
    cleanupMocks();
    jest.clearAllMocks();
  });

  it('should do something', async () => {
    // Arrange
    mockPrismaClient.model.findUnique = jest.fn().mockResolvedValue(mockData);
    
    // Act
    const result = await functionUnderTest();
    
    // Assert
    expect(result).toBeDefined();
  });
});
```

## Test Best Practices

1. **Isolation**: Each test should be independent
2. **Mocking**: Mock external dependencies (DB, APIs)
3. **Cleanup**: Reset mocks between tests
4. **Naming**: Use descriptive test names
5. **Coverage**: Aim for 70%+ coverage
6. **Speed**: Unit tests should run quickly
7. **Reliability**: Tests should be deterministic

## Troubleshooting

### Tests failing with module not found
- Check `moduleNameMapper` in `jest.config.js`
- Ensure imports use `@/` prefix

### Mock not working
- Verify mock is imported correctly
- Check mock is reset in `beforeEach`
- Ensure mock is set up before importing module under test

### Database errors in unit tests
- Unit tests should not use real database
- Use `tests/mocks/prisma.ts` for database mocks
- Only integration tests use real database

### Stripe API errors in unit tests
- Unit tests should not call real Stripe API
- Use `tests/mocks/stripe.ts` for Stripe mocks
- Set up mocks before importing handlers

## Coverage Goals

- **Overall**: 70%+
- **API Routes**: 80%+
- **Components**: 70%+
- **Utilities**: 90%+

## CI/CD Integration

Tests run automatically in CI/CD:
- All unit tests (fast, no dependencies)
- Integration tests (with test database)
- E2E tests (in separate job)

---

For more information, see:
- [Testing Guide](../docs/TESTING_GUIDE.md)
- [Payment Setup Guide](../docs/PAYMENT_SETUP.md)
