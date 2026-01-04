# Fix Plan: Test Environment & Prisma Issues

## Overview

This document outlines the plan to fix all remaining test failures and Prisma 7.2.0 issues.

## Issues Summary

### 1. NEXTAUTH_SECRET Validation Timing
**Problem:** Environment validation runs at module import time, before `jest.env-setup.js` can set variables.

**Root Cause:** `lib/env.ts` exports `export const env = validateEnv();` at module load time. When API routes import `lib/env.ts` (directly or indirectly), validation happens immediately.

**Solution:**
1. Make validation lazy in test environment
2. Ensure test environment defaults are applied before validation
3. Mock `lib/env` module in unit tests if needed

### 2. Prisma 7.2.0 Integration Tests
**Problem:** Integration tests create `new PrismaClient()` directly, which fails in Prisma 7.2.0.

**Root Cause:** Prisma 7.2.0 requires either `adapter` or `accelerateUrl` when creating PrismaClient in standalone scripts/test environments.

**Solution:**
1. Use centralized `lib/db.ts` pattern that handles adapters
2. Create test-specific Prisma client setup with adapter
3. Update integration tests to use the test client

## Implementation Plan

### Phase 1: Fix Environment Validation Timing

**Files to modify:**
- `lib/env.ts` - Make validation lazy or handle test environment
- `tests/mocks/env.ts` - Create mock for env module (if needed)
- `jest.config.js` - Verify setupFiles order

**Changes:**
1. Modify `lib/env.ts` to check if variables are set before strict validation
2. Provide sensible test defaults in validation function
3. Ensure `jest.env-setup.js` runs before any module imports

### Phase 2: Fix Prisma Client in Tests

**Files to modify:**
- `tests/integration/api/payments.test.ts` - Use test Prisma client
- `lib/db.ts` - Verify adapter pattern works for tests
- `tests/setup/prisma-client.ts` - Create test-specific client (new file)

**Changes:**
1. Create `tests/setup/prisma-client.ts` with adapter pattern for test environment
2. Update integration tests to import from test client
3. Ensure test client handles cleanup properly

### Phase 3: Verify & Document

**Actions:**
1. Run all tests to verify fixes
2. Document solutions in `TEST_FIXES_COMPLETE.md`
3. Update test setup documentation

## Detailed Implementation

### Fix 1: Environment Validation

**Strategy:** Make validation more forgiving in test environment by checking `NODE_ENV` first and providing defaults.

```typescript
// lib/env.ts - Update validateEnv function
function validateEnv() {
  // In test environment, provide defaults before strict validation
  if (process.env.NODE_ENV === 'test') {
    // Ensure required vars have defaults
    process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret-key-for-testing-purposes-only-minimum-32-characters-long';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/test';
    process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  }
  
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    // ... existing error handling
  }
}
```

### Fix 2: Prisma Client for Tests

**Strategy:** Create a test-specific Prisma client that uses adapter pattern.

```typescript
// tests/setup/prisma-client.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/test';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const testPrisma = new PrismaClient({
  adapter,
  log: process.env.DEBUG ? ['query', 'error', 'warn'] : ['error'],
});
```

## Testing Strategy

1. Run unit tests: `npm test -- tests/unit`
2. Run integration tests: `npm test -- tests/integration`
3. Run all tests: `npm test`
4. Verify no regression in passing tests

## Success Criteria

- ✅ All unit API tests pass (NEXTAUTH_SECRET issue resolved)
- ✅ All integration tests pass (Prisma 7.2.0 issue resolved)
- ✅ No regression in existing passing tests
- ✅ Test setup is documented

## Timeline

- Phase 1: ~15 minutes
- Phase 2: ~15 minutes
- Phase 3: ~10 minutes
- **Total: ~40 minutes**

