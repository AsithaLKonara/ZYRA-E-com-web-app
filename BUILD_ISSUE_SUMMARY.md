# Build Issue Summary - Prisma 7.2.0 Adapter Pattern

## Issue

The build is failing because many API routes are creating `new PrismaClient()` directly without the adapter pattern required by Prisma 7.2.0.

## Error

```
PrismaClientConstructorValidationError: Using engine type "client" requires either "adapter" or "accelerateUrl" to be provided to PrismaClient constructor.
```

## Root Cause

Prisma 7.2.0 requires the adapter pattern (`@prisma/adapter-pg`) for all PrismaClient instances, even during development builds.

## Files That Need Fixing

### Already Fixed
- ✅ `lib/database.ts` - Updated to use adapter pattern
- ✅ `lib/db.ts` - Already has adapter pattern (production only)
- ✅ `lib/db-connection.ts` - Needs adapter pattern
- ✅ `tests/setup/prisma-client.ts` - Already fixed
- ✅ `scripts/seed-comprehensive.ts` - Already fixed

### Need Fixing (Direct PrismaClient instantiations in API routes)

1. `app/api/admin/inventory/route.ts` - Line 8: `const prisma = new PrismaClient()`
2. `app/api/payments/webhook/route.ts` - Line 8: `const prisma = new PrismaClient()`
3. `app/api/payments/route.ts` - Line 12: `const prisma = new PrismaClient();`
4. `app/api/recommendations/route.ts` - Line 6: `const prisma = new PrismaClient()`
5. `app/api/products/enhanced/route.ts` - Line 13: `const prisma = new PrismaClient();`
6. `app/api/reviews/route.ts` - Line 8: `const prisma = new PrismaClient()`
7. `app/api/analytics/route.ts` - Line 13: `const prisma = new PrismaClient();`
8. `app/api/wishlist/route.ts` - Line 8: `const prisma = new PrismaClient()`
9. `app/api/auth/reset-password/route.ts` - Line 12: `const prisma = new PrismaClient();`
10. `app/api/auth/[...nextauth]/route.ts` - Line 14: `const prisma = new PrismaClient();`
11. `app/api/auth/register/route.ts` - Line 12: `const prisma = new PrismaClient();`

### Other Files with Direct PrismaClient

- `lib/auth-utils.ts` - Line 10: `const prisma = new PrismaClient();`
- `lib/session-manager.ts` - Line 9: `const prisma = new PrismaClient();`
- `lib/db-connection.ts` - Line 21: `new PrismaClient({...})`

## Solution

### Option 1: Use Shared Prisma Client (Recommended)
Update all files to use the shared Prisma client from `@/lib/database`:

```typescript
// Instead of:
const prisma = new PrismaClient()

// Use:
import { db as prisma } from '@/lib/database'
```

### Option 2: Fix lib/db.ts to Use Adapter in All Environments
Update `lib/db.ts` to use adapter pattern in both development and production, then update all files to use `@/lib/db`.

### Option 3: Create a Centralized Prisma Client Utility
Create a utility function that returns a properly configured Prisma client with adapter pattern.

## Recommended Approach

**Option 1** is recommended because:
- `lib/database.ts` already exports `db` and has proper configuration
- It's already fixed to use adapter pattern
- Centralizes database connection management
- Minimal code changes required

## Files to Update

Total: ~14 files need to be updated to use the shared Prisma client.

