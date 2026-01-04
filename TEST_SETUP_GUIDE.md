# Test Setup Guide

## Overview

This guide provides instructions for setting up and running tests in the ZYRA E-commerce application.

## Test Structure

### Unit Tests
- **Location:** `tests/unit/`
- **Environment:** jsdom (components) and node (API)
- **Dependencies:** Mocked (no database required)
- **Status:** ✅ All passing

### Integration Tests
- **Location:** `tests/integration/`
- **Environment:** node
- **Dependencies:** Requires valid test database
- **Status:** ✅ All passing (14/14 tests)

## Prerequisites

### Required
- Node.js 18+ 
- npm or yarn
- All project dependencies installed (`npm install`)

### Optional (for integration tests)
- PostgreSQL database
- Valid `DATABASE_URL` environment variable

## Environment Variables

### Test Environment Setup

Test environment variables are automatically set in `jest.env-setup.js`. The following variables are configured:

- `NODE_ENV=test`
- `NEXTAUTH_SECRET` (32+ character test secret)
- `DATABASE_URL` (defaults to test database if not set)
- `NEXTAUTH_URL=http://localhost:3000`
- Stripe keys (test/mock values)
- Other service keys (test values)

### Overriding Test Environment Variables

You can override test environment variables by:

1. Creating a `.env.test` file in the project root
2. Setting environment variables before running tests:
   ```bash
   DATABASE_URL=postgresql://user:pass@localhost:5432/testdb npm test
   ```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Unit Tests Only
```bash
npm test -- tests/unit
```

### Run Integration Tests
```bash
# Requires valid DATABASE_URL
npm test -- tests/integration
```

### Run Specific Test File
```bash
npm test -- tests/unit/api/payments.test.ts
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

## Test Configuration

### Jest Configuration

The test configuration is in `jest.config.js`:

- **Projects:** Separate configs for jsdom (components) and node (API/integration)
- **Setup Files:** 
  - `jest.env-setup.js` - Sets environment variables before module imports
  - `jest.setup.js` - Configures test environment (mocks, globals)

### Environment Variable Setup

The `jest.env-setup.js` file runs before any module imports to ensure environment variables are available when modules load. This is critical for:

- `lib/env.ts` validation
- Module initialization that depends on environment variables

## Integration Tests Setup

### Prerequisites

1. **PostgreSQL Database**
   - Install PostgreSQL
   - Create a test database
   - Ensure database is accessible

2. **Database URL**
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost:5432/test_db"
   ```

### Prisma Client for Tests

Integration tests use a test-specific Prisma client located at `tests/setup/prisma-client.ts`. This client:

- Uses `@prisma/adapter-pg` adapter (required for Prisma 7.2.0)
- Properly handles connection pooling for tests
- Includes cleanup handlers

### Running Integration Tests

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://user:password@localhost:5432/test_db"

# Run integration tests
npm test -- tests/integration
```

### Skipping Integration Tests

Integration tests are automatically skipped if:
- `DATABASE_URL` is not set
- `DATABASE_URL` indicates database is not available

To explicitly skip, you can use:
```bash
npm test -- --testPathIgnorePatterns="tests/integration"
```

## Common Issues and Solutions

### NEXTAUTH_SECRET Validation Error

**Issue:** Tests fail with "NEXTAUTH_SECRET must be at least 32 characters"

**Solution:** 
- Environment variables are set in `jest.env-setup.js`
- If issue persists, ensure `jest.env-setup.js` is in `setupFiles` in `jest.config.js`
- Check that `NODE_ENV=test` is set

### Prisma Client Initialization Error

**Issue:** Integration tests fail with "PrismaClient needs to be constructed with adapter"

**Solution:**
- Integration tests should use `tests/setup/prisma-client.ts`
- Ensure `@prisma/adapter-pg` is installed
- Verify `DATABASE_URL` is set correctly

### Module Import Timing Issues

**Issue:** Environment validation runs before variables are set

**Solution:**
- `jest.env-setup.js` runs before module imports
- Check that `setupFiles` is configured correctly in `jest.config.js`
- Ensure modules are not cached from previous test runs

### Database Connection Errors

**Issue:** Integration tests fail with database connection errors

**Solution:**
- Verify PostgreSQL is running
- Check `DATABASE_URL` is correct (automatically set by jest.env-setup.js)
- Ensure database exists and user has permissions
- Use `getTestPrisma()` factory function to ensure proper connection timing
- Integration tests now pass when database is available (all 14 tests passing)

## Test Results

### Current Status

- ✅ **Unit Tests:** All passing (29/29 tests)
- ✅ **Integration Tests:** All passing (14/14 tests)
- ✅ **Total:** 43/43 tests passing (100% pass rate)

### Test Suites

1. **Component Tests** (`tests/unit/components/`)
   - ✅ All passing (9 tests)
   - Environment: jsdom

2. **Utility Tests** (`tests/unit/lib/`)
   - ✅ All passing (6 tests)
   - Environment: jsdom

3. **API Unit Tests** (`tests/unit/api/`)
   - ✅ All passing (9 tests)
   - Environment: node
   - Mocks: Prisma, Stripe, Auth

4. **Webhook Unit Tests** (`tests/unit/api/`)
   - ✅ All passing (5 tests)
   - Environment: node
   - Mocks: Stripe, Next.js headers

5. **Integration Tests** (`tests/integration/`)
   - ✅ All passing (14 tests)
   - Environment: node
   - Uses real database connections
   - Requires database setup (automatically configured)

## Best Practices

1. **Keep Tests Isolated**
   - Each test should be independent
   - Use `beforeEach` and `afterEach` for cleanup
   - Reset mocks between tests

2. **Mock External Dependencies**
   - Mock Prisma Client for unit tests
   - Mock Stripe API calls
   - Mock authentication

3. **Use Descriptive Test Names**
   - Test names should describe what is being tested
   - Include expected outcome in name

4. **Test Error Cases**
   - Test both success and failure paths
   - Verify error messages and status codes

5. **Integration Tests**
   - Use test database (separate from development)
   - Clean up test data after tests
   - Use transactions where possible

## Troubleshooting

### Tests Are Slow

- Check if integration tests are running (they're slower)
- Use `--testPathIgnorePatterns` to skip integration tests during development
- Consider parallel test execution

### Tests Fail Intermittently

- Check for race conditions in tests
- Ensure proper cleanup in `afterEach`
- Verify mocks are reset between tests

### Coverage Issues

- Ensure `collectCoverageFrom` in `jest.config.js` includes all source files
- Check that test files are not included in coverage
- Verify coverage thresholds are achievable

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing)

