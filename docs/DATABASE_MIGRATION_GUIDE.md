# Database Migration Guide - ZYRA Fashion

## Overview

ZYRA uses **Prisma Migrate** for database schema management. This provides version control for your database schema and ensures consistency across development, staging, and production environments.

## Migration Strategy

### 1. **Prisma Migrate** (Primary Method)
- **Development**: `prisma migrate dev` - Creates and applies migrations
- **Production**: `prisma migrate deploy` - Applies pending migrations only
- **Migration History**: Stored in `prisma/migrations/` directory
- **Database Tracking**: Uses `_prisma_migrations` table in database

### 2. **Prisma DB Push** (Rapid Prototyping)
- **When to use**: Local development only, rapid schema changes
- **Command**: `npx prisma db push`
- **Warning**: Does NOT create migration files, not for production!

## Migration Workflow

### Development Workflow

```bash
# 1. Modify schema.prisma
# Edit prisma/schema.prisma with your changes

# 2. Create and apply migration
npm run db:migrate
# OR
npx prisma migrate dev --name your_migration_name

# 3. Prisma will:
# - Generate migration SQL file
# - Apply migration to your database
# - Regenerate Prisma Client
```

### Production Workflow

```bash
# 1. Pull production environment variables
vercel env pull .env.production.local

# 2. Generate Prisma Client
npm run db:generate

# 3. Deploy migrations (safe, only applies pending)
npm run db:migrate:deploy
# OR
npx prisma migrate deploy

# 4. Verify migration status
npm run db:migrate:status
```

### Vercel Deployment Workflow

#### Option A: Automatic Migration (Recommended)

Add to `package.json` build script or use Vercel's `postinstall`:

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

#### Option B: Manual Migration (More Control)

1. **Before deploying code**:
   ```bash
   vercel env pull .env.production.local
   npx prisma migrate deploy
   ```

2. **Or via Vercel CLI after deployment**:
   ```bash
   vercel logs <deployment-url> --follow
   # Check for migration errors
   ```

## Available Commands

### Core Prisma Commands

```bash
# Generate Prisma Client (after schema changes)
npm run db:generate
npx prisma generate

# Create new migration (development)
npm run db:migrate
npx prisma migrate dev --name migration_name

# Deploy migrations (production)
npm run db:migrate:deploy
npx prisma migrate deploy

# Check migration status
npm run db:migrate:status
npx prisma migrate status

# Reset database (development only!)
npm run db:reset
npx prisma migrate reset

# Push schema changes (development only - no migration file)
npm run db:push
npx prisma db push

# Open Prisma Studio (database GUI)
npm run db:studio
npx prisma studio
```

### Custom Migration Scripts

```bash
# Run migrations with environment
npm run db:migrate:run [environment]
tsx scripts/database-migrate.ts migrate [development|staging|production]

# Create new migration
npm run db:migrate:create <name>
tsx scripts/database-migrate.ts create <name>

# Check status
npm run db:migrate:status
tsx scripts/database-migrate.ts status

# Deploy to production
tsx scripts/database-migrate.ts deploy

# Rollback (if supported)
tsx scripts/database-migrate.ts rollback
```

## Migration Best Practices

### 1. **Always Create Migrations in Development**

```bash
# ✅ Good: Create migration file
npx prisma migrate dev --name add_user_preferences

# ❌ Bad: Use db push in production
npx prisma db push  # Only for rapid prototyping
```

### 2. **Review Migration SQL Files**

Check generated SQL in `prisma/migrations/YYYYMMDDHHMMSS_migration_name/migration.sql`

```sql
-- Example migration file
ALTER TABLE "User" ADD COLUMN "preferences" JSONB;
CREATE INDEX "User_email_idx" ON "User"("email");
```

### 3. **Test Migrations Before Production**

```bash
# 1. Test locally with production-like data
npm run db:reset
npm run db:migrate
npm run db:seed

# 2. Test rollback (if needed)
# Review migration files for rollback scripts

# 3. Test on staging (if available)
NODE_ENV=staging npm run db:migrate:deploy
```

### 4. **Handle Schema Conflicts**

If migration fails due to conflicts:

```bash
# 1. Check what's pending
npx prisma migrate status

# 2. Resolve conflicts manually
# Edit migration SQL files if needed

# 3. Mark as resolved
npx prisma migrate resolve --applied <migration_name>
# OR
npx prisma migrate resolve --rolled-back <migration_name>
```

### 5. **Backup Before Production Migrations**

```bash
# Create backup before migration
npm run db:backup:full

# Then deploy
npm run db:migrate:deploy
```

## Common Scenarios

### Scenario 1: Adding a New Field

```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  phone     String?  // New field
  createdAt DateTime @default(now())
}
```

```bash
# Create migration
npx prisma migrate dev --name add_user_phone

# Migration will:
# 1. Add phone column (nullable)
# 2. Generate Prisma Client
# 3. Update types
```

### Scenario 2: Renaming a Field

```prisma
// Before
model Product {
  price Decimal
}

// After
model Product {
  priceAmount Decimal @map("price")  // Map to existing column
}
```

```bash
# Prisma will handle column mapping
npx prisma migrate dev --name rename_price_to_priceAmount
```

### Scenario 3: Adding Indexes

```prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  categoryId  String
  createdAt   DateTime @default(now())
  
  @@index([categoryId, createdAt])  // Composite index
  @@index([name])                    // Single column index
}
```

```bash
npx prisma migrate dev --name add_product_indexes
```

### Scenario 4: Production Migration Failure

```bash
# 1. Check error in logs
vercel logs <deployment-url> | grep -i migration

# 2. Verify migration status
vercel env pull .env.production.local
npx prisma migrate status

# 3. If migration partially applied, resolve it
npx prisma migrate resolve --applied <migration_name>

# 4. Fix schema and create new migration
# Edit schema.prisma, then:
npx prisma migrate dev --name fix_previous_migration
npx prisma migrate deploy
```

## Vercel-Specific Considerations

### 1. **Build-Time Migrations**

Add to `package.json`:

```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

**Pros**: Automatic, no manual steps  
**Cons**: Slower builds, migration failures block deployment

### 2. **Post-Deploy Migrations** (Recommended)

**Option A: Use Vercel Cron Jobs**

Create `app/api/cron/migrate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  // Verify it's a cron job request
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
    return NextResponse.json({ 
      success: true, 
      output: stdout,
      errors: stderr 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
```

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/migrate",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Option B: Manual Migration After Deploy**

```bash
# After code deployment
vercel env pull .env.production.local
npx prisma migrate deploy
```

### 3. **Environment Variables**

Ensure `DATABASE_URL` is set in Vercel:

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add `DATABASE_URL` for Production
3. Format for Vercel Postgres:
   ```
   postgres://user:password@host:5432/dbname?sslmode=require
   ```

### 4. **Migration Logs in Vercel**

Check migration status:

```bash
# View logs
vercel logs <deployment-url> --follow

# Look for:
# ✅ "Prisma Client generated"
# ✅ "Migration applied successfully"
# ❌ "Migration failed"
```

Or check health endpoint:
```bash
curl https://your-app.vercel.app/api/health | jq '.services.database'
```

## Troubleshooting

### Migration Stuck

```bash
# Check migration status
npx prisma migrate status

# If stuck, resolve manually
npx prisma migrate resolve --applied <migration_name>
```

### Migration Conflicts

```bash
# Reset migrations (development only!)
npx prisma migrate reset

# Then create fresh migration
npx prisma migrate dev --name fresh_start
```

### Prisma Client Out of Sync

```bash
# Regenerate client
npx prisma generate

# Or full reset (development)
npx prisma migrate reset
npx prisma migrate dev
```

### Production Database Schema Drift

```bash
# 1. Pull current production schema
npx prisma db pull

# 2. Compare with local schema
git diff prisma/schema.prisma

# 3. Create migration to align
npx prisma migrate dev --name align_production_schema
```

## Migration Checklist

### Before Deploying to Production

- [ ] All migrations tested locally
- [ ] Migration SQL files reviewed
- [ ] Database backup created
- [ ] Rollback plan prepared
- [ ] Migration script tested on staging (if available)
- [ ] `DATABASE_URL` configured in Vercel
- [ ] Migration command in build script (if using build-time migrations)

### After Deployment

- [ ] Verify migration applied: `npx prisma migrate status`
- [ ] Check application logs for errors
- [ ] Test critical database operations
- [ ] Monitor application health: `/api/health`
- [ ] Verify Prisma Client generated correctly

## Additional Resources

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Migration Workflows](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)

