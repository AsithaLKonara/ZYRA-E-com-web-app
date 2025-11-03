# How to Check Vercel Database Logs

## Method 1: Via Vercel Dashboard (Easiest)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click on the latest deployment
4. Go to the "Runtime Logs" tab
5. Look for:
   - ✅ Database connection success messages
   - ❌ Connection errors
   - ⚠️ SSL/TLS errors
   - 🔄 Migration errors

## Method 2: Via Vercel CLI

```bash
# Get deployment URL/ID first
vercel ls --yes

# Then check logs for a specific deployment
vercel logs <deployment-url> --follow

# Or check logs in JSON format
vercel logs <deployment-url> --json | jq 'select(.level == "error")'
```

## Common Database Errors to Look For

### 1. Missing DATABASE_URL
```
Error: Environment variable DATABASE_URL is not set
```

**Solution**: Add DATABASE_URL in Vercel project settings → Environment Variables

### 2. SSL Connection Required
```
Error: SSL connection required
Error: self signed certificate
```

**Solution**: Vercel Postgres requires SSL. Ensure connection string includes:
```
?sslmode=require
```

### 3. Connection Timeout
```
Error: Connection timeout
Error: Unable to reach database server
```

**Solution**: Check:
- Database is running
- Connection string is correct
- Network/firewall allows connections

### 4. Migration Not Run
```
Error: Table does not exist
Error: Relation does not exist
```

**Solution**: Run migrations after database setup:
```bash
vercel env pull .env.local
npx prisma migrate deploy
```

### 5. Prisma Client Not Generated
```
Error: Cannot find module '@prisma/client'
Error: Prisma Client has not been generated yet
```

**Solution**: Ensure `postinstall` script runs:
```json
"postinstall": "prisma generate"
```

## Testing Database Connection Locally

Test with Vercel environment variables:

```bash
# Pull Vercel environment variables
vercel env pull .env.local

# Test database connection
npx prisma db pull

# Check connection with health endpoint
curl http://localhost:3000/api/health | jq '.services.database'
```

## What Success Looks Like

In the logs, you should see:
```
✅ Database connected (45ms response time, 2 active connections)
✅ Prisma Client generated successfully
✅ Database migrations completed
✅ Health check passed
```

## Quick Health Check

Visit your deployed site's health endpoint:
```
https://your-app.vercel.app/api/health
```

Check the `services.database.status` field - it should be `"healthy"`

