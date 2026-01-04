# NEOSHOP ULTRA - Troubleshooting Guide

## Overview

This comprehensive troubleshooting guide helps you diagnose and resolve common issues with NEOSHOP ULTRA. It covers installation problems, runtime errors, configuration issues, and performance problems.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Configuration Problems](#configuration-problems)
3. [Runtime Errors](#runtime-errors)
4. [Database Issues](#database-issues)
5. [Authentication Problems](#authentication-problems)
6. [Payment Issues](#payment-issues)
7. [File Upload Problems](#file-upload-problems)
8. [Email Issues](#email-issues)
9. [Performance Problems](#performance-problems)
10. [Deployment Issues](#deployment-issues)
11. [Debugging Tools](#debugging-tools)
12. [Log Analysis](#log-analysis)

## Installation Issues

### Node.js Version Problems

#### Problem: Unsupported Node.js Version

**Symptoms**:
- Error: "Node.js version X is not supported"
- Build failures
- Runtime errors

**Solution**:
```bash
# Check current Node.js version
node --version

# Install Node.js 18+ using nvm
nvm install 18
nvm use 18

# Or download from nodejs.org
# https://nodejs.org/en/download/
```

#### Problem: Multiple Node.js Versions

**Symptoms**:
- Inconsistent behavior
- Different versions in different terminals
- Permission errors

**Solution**:
```bash
# Use nvm to manage versions
nvm install 18
nvm use 18
nvm alias default 18

# Verify version
node --version
npm --version
```

### Dependency Installation Failures

#### Problem: npm install Fails

**Symptoms**:
- Package installation errors
- Network timeouts
- Permission denied errors

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# If still failing, try with different registry
npm install --registry https://registry.npmjs.org/

# Or use yarn instead
yarn install
```

#### Problem: Native Module Compilation Errors

**Symptoms**:
- Sharp installation fails
- Prisma client generation errors
- Native module compilation errors

**Solution**:
```bash
# Install build tools (Windows)
npm install --global windows-build-tools

# Install build tools (macOS)
xcode-select --install

# Install build tools (Linux)
sudo apt-get install build-essential

# Reinstall problematic packages
npm uninstall sharp
npm install sharp

# Or use prebuilt binaries
npm install --platform=linux --arch=x64 sharp
```

#### Problem: Permission Errors

**Symptoms**:
- EACCES errors
- Permission denied when installing packages
- Cannot write to directories

**Solution**:
```bash
# Fix npm permissions (macOS/Linux)
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

# Or use a Node version manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install node
nvm use node
```

### Git Issues

#### Problem: Repository Clone Fails

**Symptoms**:
- Git clone errors
- Authentication failures
- Network timeouts

**Solution**:
```bash
# Clone with SSH instead of HTTPS
git clone git@github.com:neoshop-ultra/neoshop-ultra.git

# Or configure Git credentials
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Test SSH connection
ssh -T git@github.com
```

## Configuration Problems

### Environment Variables

#### Problem: Missing Environment Variables

**Symptoms**:
- Application won't start
- Database connection errors
- Authentication failures

**Solution**:
```bash
# Check if .env.local exists
ls -la .env.local

# Copy from example
cp .env.example .env.local

# Verify required variables
grep -E "^(DATABASE_URL|NEXTAUTH_SECRET|STRIPE_SECRET_KEY)" .env.local
```

#### Problem: Invalid Environment Variables

**Symptoms**:
- Configuration errors
- Invalid format errors
- Connection failures

**Solution**:
```bash
# Check variable format
echo $DATABASE_URL
# Should be: postgresql://username:password@localhost:5432/database

# Validate JSON in environment variables
node -e "console.log(JSON.parse(process.env.SOME_JSON_VAR))"

# Check for special characters
grep -P '[^\x00-\x7F]' .env.local
```

### Database Configuration

#### Problem: Database Connection String Format

**Symptoms**:
- Database connection errors
- Invalid URL format errors

**Solution**:
```bash
# Correct format
DATABASE_URL="postgresql://username:password@localhost:5432/neoshop_ultra"

# Check connection
psql $DATABASE_URL -c "SELECT 1;"

# Test with different formats
DATABASE_URL="postgresql://username:password@localhost:5432/neoshop_ultra?sslmode=require"
```

#### Problem: Database Permissions

**Symptoms**:
- Permission denied errors
- Cannot create tables
- Access denied errors

**Solution**:
```sql
-- Grant permissions to user
GRANT ALL PRIVILEGES ON DATABASE neoshop_ultra TO username;
GRANT ALL PRIVILEGES ON SCHEMA public TO username;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO username;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO username;
```

## Runtime Errors

### Application Startup Issues

#### Problem: Port Already in Use

**Symptoms**:
- Error: "Port 3000 is already in use"
- Application won't start

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev

# Or configure in .env.local
PORT=3001
```

#### Problem: Memory Issues

**Symptoms**:
- Out of memory errors
- Application crashes
- Slow performance

**Solution**:
```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 npm run dev

# Or set in package.json
"scripts": {
  "dev": "node --max-old-space-size=4096 next dev"
}

# Monitor memory usage
node --inspect npm run dev
# Open chrome://inspect in Chrome
```

#### Problem: Module Not Found Errors

**Symptoms**:
- Cannot find module errors
- Import/export errors
- TypeScript errors

**Solution**:
```bash
# Check if modules are installed
npm list <module-name>

# Reinstall missing modules
npm install <module-name>

# Check TypeScript configuration
npx tsc --noEmit

# Verify import paths
grep -r "import.*from" src/
```

### Build Issues

#### Problem: Build Failures

**Symptoms**:
- npm run build fails
- TypeScript errors
- Webpack errors

**Solution**:
```bash
# Check TypeScript errors
npx tsc --noEmit

# Check ESLint errors
npm run lint

# Fix import issues
npm run lint -- --fix

# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

#### Problem: Bundle Size Issues

**Symptoms**:
- Large bundle sizes
- Slow loading times
- Memory issues

**Solution**:
```bash
# Analyze bundle
npm run analyze

# Check for large dependencies
npm ls --depth=0

# Use dynamic imports
const Component = dynamic(() => import('./Component'))

# Enable tree shaking
// Use named imports instead of default imports
import { specificFunction } from 'large-library'
```

## Database Issues

### Connection Problems

#### Problem: Database Connection Refused

**Symptoms**:
- Connection refused errors
- Cannot connect to database
- Timeout errors

**Solution**:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check port
netstat -tlnp | grep 5432

# Test connection
psql -h localhost -U username -d neoshop_ultra
```

#### Problem: Authentication Failures

**Symptoms**:
- Authentication failed errors
- Invalid credentials
- Permission denied

**Solution**:
```bash
# Check user exists
psql -c "\du"

# Create user if needed
createuser -s username

# Set password
psql -c "ALTER USER username PASSWORD 'password';"

# Test connection
psql -h localhost -U username -d neoshop_ultra
```

### Migration Issues

#### Problem: Migration Failures

**Symptoms**:
- Migration errors
- Schema conflicts
- Data loss

**Solution**:
```bash
# Check migration status
npx prisma migrate status

# Reset database (WARNING: Data loss)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database
npm run db:seed
```

#### Problem: Schema Conflicts

**Symptoms**:
- Schema drift errors
- Migration conflicts
- Data type mismatches

**Solution**:
```bash
# Check schema drift
npx prisma db pull

# Compare with current schema
npx prisma migrate diff

# Resolve conflicts manually
# Edit prisma/schema.prisma

# Apply changes
npx prisma db push
```

### Performance Issues

#### Problem: Slow Queries

**Symptoms**:
- Slow page loads
- Database timeouts
- High CPU usage

**Solution**:
```bash
# Check slow queries
npx prisma studio

# Analyze query performance
EXPLAIN ANALYZE SELECT * FROM products WHERE category_id = 'uuid';

# Add indexes
CREATE INDEX idx_products_category ON products(category_id);

# Use connection pooling
// In prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pooling
}
```

## Authentication Problems

### OAuth Issues

#### Problem: OAuth Provider Errors

**Symptoms**:
- OAuth redirect errors
- Invalid client errors
- Authentication failures

**Solution**:
```bash
# Check OAuth configuration
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET

# Verify redirect URLs
# Google: http://localhost:3000/api/auth/callback/google
# GitHub: http://localhost:3000/api/auth/callback/github

# Check OAuth provider settings
# Ensure redirect URLs are configured correctly
# Verify client secrets are correct
```

#### Problem: Session Issues

**Symptoms**:
- Sessions not persisting
- Frequent logouts
- Authentication state issues

**Solution**:
```bash
# Check session configuration
# In lib/auth.ts
session: {
  strategy: 'jwt',
  maxAge: 30 * 24 * 60 * 60, // 30 days
}

# Check Redis connection (if using)
redis-cli ping

# Clear sessions
npx prisma studio
# Delete sessions from database
```

### JWT Issues

#### Problem: JWT Token Errors

**Symptoms**:
- Invalid token errors
- Token expiration errors
- Signature verification errors

**Solution**:
```bash
# Check NEXTAUTH_SECRET
echo $NEXTAUTH_SECRET

# Generate new secret
openssl rand -base64 32

# Update .env.local
NEXTAUTH_SECRET="your-new-secret"

# Restart application
npm run dev
```

## Payment Issues

### Stripe Integration

#### Problem: Stripe API Errors

**Symptoms**:
- Payment processing failures
- Invalid API key errors
- Webhook errors

**Solution**:
```bash
# Check Stripe keys
echo $STRIPE_SECRET_KEY
echo $STRIPE_PUBLISHABLE_KEY

# Test Stripe connection
curl -u $STRIPE_SECRET_KEY: https://api.stripe.com/v1/charges

# Check webhook configuration
# Verify webhook URL is correct
# Ensure webhook secret is set
# Test webhook endpoint
```

#### Problem: Payment Method Issues

**Symptoms**:
- Payment declined errors
- Invalid payment method errors
- 3D Secure failures

**Solution**:
```bash
# Test with Stripe test cards
# 4242424242424242 - Visa
# 4000000000000002 - Declined card
# 4000000000009995 - Insufficient funds

# Check payment method validation
# Verify card details are correct
# Ensure sufficient funds
# Check card expiration date
```

### Webhook Issues

#### Problem: Webhook Not Receiving Events

**Symptoms**:
- Webhook events not processed
- Order status not updating
- Payment confirmations missing

**Solution**:
```bash
# Check webhook endpoint
curl -X POST https://your-domain.com/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Verify webhook secret
echo $STRIPE_WEBHOOK_SECRET

# Check webhook logs
# In Stripe dashboard, check webhook delivery logs
# Verify endpoint is responding correctly
```

## File Upload Problems

### Blob Storage Issues

#### Problem: Upload Failures

**Symptoms**:
- File upload errors
- Storage connection errors
- Permission denied errors

**Solution**:
```bash
# Check Blob Storage token
echo $BLOB_READ_WRITE_TOKEN

# Test Blob Storage connection
curl -X POST \
  -H "Authorization: Bearer $BLOB_READ_WRITE_TOKEN" \
  -F "file=@test.jpg" \
  https://blob.vercel-storage.com

# Check file size limits
# Ensure files are under 10MB
# Check file type restrictions
# Verify file format support
```

#### Problem: Image Optimization Issues

**Symptoms**:
- Image optimization errors
- Sharp installation failures
- Image format errors

**Solution**:
```bash
# Check Sharp installation
npm list sharp

# Reinstall Sharp
npm uninstall sharp
npm install sharp

# Check image formats
# Ensure supported formats (JPEG, PNG, WebP, AVIF)
# Verify image quality settings
# Check image dimensions
```

### File Validation Issues

#### Problem: File Type Validation Errors

**Symptoms**:
- Invalid file type errors
- File size limit errors
- Security scan failures

**Solution**:
```bash
# Check file validation rules
# In lib/file-security.ts
ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  document: ['application/pdf', 'text/plain'],
  archive: ['application/zip', 'application/x-rar-compressed'],
}

# Check file size limits
MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

# Test file upload
curl -X POST \
  -F "file=@test.jpg" \
  -F "filename=test.jpg" \
  http://localhost:3000/api/upload/image
```

## Email Issues

### Resend Integration

#### Problem: Email Not Sending

**Symptoms**:
- Email sending failures
- SMTP errors
- Delivery failures

**Solution**:
```bash
# Check Resend API key
echo $RESEND_API_KEY

# Test Resend connection
curl -H "Authorization: Bearer $RESEND_API_KEY" \
  https://api.resend.com/emails

# Check email configuration
# Verify from email address
# Check email templates
# Ensure domain is verified
```

#### Problem: Email Template Issues

**Symptoms**:
- Template rendering errors
- Missing variables
- Formatting issues

**Solution**:
```bash
# Check email templates
# In lib/email-templates.ts
# Verify template syntax
# Check variable substitution
# Test template rendering

# Test email sending
curl -X POST \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@neoshop-ultra.com",
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Test Email</h1>"
  }' \
  https://api.resend.com/emails
```

## Performance Problems

### Slow Page Loads

#### Problem: Large Bundle Sizes

**Symptoms**:
- Slow initial page loads
- High memory usage
- Network timeouts

**Solution**:
```bash
# Analyze bundle size
npm run analyze

# Check for large dependencies
npm ls --depth=0

# Use dynamic imports
const Component = dynamic(() => import('./Component'))

# Enable code splitting
// In next.config.js
experimental: {
  optimizeCss: true,
  optimizePackageImports: ['@radix-ui/react-icons'],
}
```

#### Problem: Database Query Performance

**Symptoms**:
- Slow database queries
- High database CPU usage
- Query timeouts

**Solution**:
```bash
# Check slow queries
npx prisma studio

# Analyze query performance
EXPLAIN ANALYZE SELECT * FROM products WHERE category_id = 'uuid';

# Add indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at);

# Use connection pooling
// In prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pooling
}
```

### Memory Issues

#### Problem: High Memory Usage

**Symptoms**:
- Out of memory errors
- Application crashes
- Slow performance

**Solution**:
```bash
# Monitor memory usage
node --inspect npm run dev
# Open chrome://inspect in Chrome

# Increase memory limit
node --max-old-space-size=4096 npm run dev

# Check for memory leaks
# Use heap snapshots
# Monitor garbage collection
# Check for circular references
```

#### Problem: Memory Leaks

**Symptoms**:
- Increasing memory usage over time
- Application slowdown
- Eventually crashes

**Solution**:
```bash
# Check for memory leaks
# Use heap snapshots
# Monitor garbage collection
# Check for circular references
# Use memory profiling tools

# Common causes:
# - Event listeners not removed
# - Timers not cleared
# - Circular references
# - Large objects not garbage collected
```

## Deployment Issues

### Vercel Deployment

#### Problem: Build Failures on Vercel

**Symptoms**:
- Build errors on Vercel
- Deployment failures
- Environment variable issues

**Solution**:
```bash
# Check build logs on Vercel
# Verify environment variables
# Check Node.js version
# Verify build command

# Common fixes:
# - Update Node.js version in vercel.json
# - Add missing environment variables
# - Fix build command
# - Check for TypeScript errors
```

#### Problem: Environment Variable Issues

**Symptoms**:
- Missing environment variables
- Invalid configuration
- Runtime errors

**Solution**:
```bash
# Check environment variables in Vercel dashboard
# Verify all required variables are set
# Check variable names and values
# Ensure proper formatting

# Common issues:
# - Missing NEXTAUTH_SECRET
# - Invalid DATABASE_URL
# - Missing Stripe keys
# - Incorrect API URLs
```

### Database Migration Issues

#### Problem: Migration Failures in Production

**Symptoms**:
- Migration errors in production
- Schema conflicts
- Data loss

**Solution**:
```bash
# Check migration status
npx prisma migrate status

# Run migrations manually
npx prisma migrate deploy

# Check database connection
npx prisma db pull

# Verify schema
npx prisma generate
```

## Debugging Tools

### Development Tools

#### Chrome DevTools

```bash
# Enable debugging
node --inspect npm run dev

# Open Chrome DevTools
# Go to chrome://inspect
# Click "Open dedicated DevTools for Node"

# Use debugging features:
# - Breakpoints
# - Step through code
# - Inspect variables
# - Call stack
# - Memory profiling
```

#### VS Code Debugging

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "env": {
        "NODE_OPTIONS": "--inspect"
      }
    }
  ]
}
```

### Logging Tools

#### Application Logging

```typescript
// lib/logger.ts
import { logger } from './logger'

// Use structured logging
logger.info('User logged in', { userId: user.id })
logger.error('Database error', { error: error.message })
logger.warn('Rate limit exceeded', { ip: request.ip })
```

#### Database Logging

```bash
# Enable PostgreSQL logging
# In postgresql.conf
log_statement = 'all'
log_duration = on
log_min_duration_statement = 1000

# Check logs
tail -f /var/log/postgresql/postgresql.log
```

### Performance Monitoring

#### Core Web Vitals

```typescript
// lib/performance.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

getCLS(console.log)
getFID(console.log)
getFCP(console.log)
getLCP(console.log)
getTTFB(console.log)
```

#### Application Performance

```bash
# Use lighthouse for performance testing
npm install -g lighthouse
lighthouse http://localhost:3000

# Use webpack-bundle-analyzer
npm run analyze

# Monitor memory usage
node --inspect npm run dev
```

## Log Analysis

### Application Logs

#### Next.js Logs

```bash
# Check Next.js logs
npm run dev 2>&1 | tee logs/app.log

# Filter for errors
grep -i error logs/app.log

# Filter for warnings
grep -i warning logs/app.log

# Monitor logs in real-time
tail -f logs/app.log
```

#### Database Logs

```bash
# Check PostgreSQL logs
tail -f /var/log/postgresql/postgresql.log

# Filter for slow queries
grep "slow query" /var/log/postgresql/postgresql.log

# Filter for errors
grep -i error /var/log/postgresql/postgresql.log
```

### System Logs

#### System Logs

```bash
# Check system logs
journalctl -u neoshop-ultra -f

# Check for errors
journalctl -u neoshop-ultra --priority=err

# Check for warnings
journalctl -u neoshop-ultra --priority=warning
```

#### Process Monitoring

```bash
# Monitor processes
htop

# Check memory usage
free -h

# Check disk usage
df -h

# Check network connections
netstat -tlnp
```

### Error Tracking

#### Sentry Integration

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})

// Capture errors
try {
  // Risky operation
} catch (error) {
  Sentry.captureException(error)
}
```

#### Custom Error Tracking

```typescript
// lib/error-tracking.ts
export function trackError(error: Error, context?: any) {
  console.error('Error:', error.message, context)
  
  // Send to external service
  fetch('/api/errors', {
    method: 'POST',
    body: JSON.stringify({ error: error.message, context })
  })
}
```

## Getting Help

### When to Seek Help

Seek help when:
- You've tried all troubleshooting steps
- The issue is not documented
- You need expert guidance
- The problem is blocking your progress

### How to Get Help

1. **Search existing issues** on GitHub
2. **Check the documentation** for solutions
3. **Ask on Discord** for quick help
4. **Create a GitHub issue** for bugs
5. **Email support** for complex issues

### Information to Provide

When seeking help, provide:
- **Clear description** of the problem
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Environment details** (OS, Node.js version, etc.)
- **Error messages** and logs
- **Screenshots** if applicable
- **What you've already tried**

---

**Last Updated**: January 2024  
**Version**: 1.0

This troubleshooting guide should help you resolve most common issues with NEOSHOP ULTRA. If you're still having problems, don't hesitate to reach out for help! 🔧




