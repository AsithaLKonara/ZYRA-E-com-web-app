# ZYRA Fashion - Deployment Guide

This guide will help you deploy ZYRA Fashion to Vercel and other platforms.

## Prerequisites

- Node.js 18+ installed
- Git repository set up
- Vercel account
- PostgreSQL database (Vercel Postgres recommended)
- Stripe account
- Resend account
- Vercel Blob Storage account

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/zyra_ultra"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Stripe
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_your-token"

# Resend Email
RESEND_API_KEY="re_your-resend-api-key"
RESEND_FROM_EMAIL="noreply@zyra-ultra.com"
RESEND_FROM_NAME="ZYRA Fashion"
RESEND_REPLY_TO="support@zyra-ultra.com"

# App Configuration
APP_NAME="ZYRA Fashion"
APP_URL="https://zyra-ultra.vercel.app"
APP_DESCRIPTION="Ultimate e-commerce platform built with Next.js 14"

# Admin Configuration
ADMIN_EMAIL="admin@zyra-ultra.com"
ADMIN_IP_WHITELIST="127.0.0.1,::1"

# Security
CSRF_SECRET="your-csrf-secret-key"
ENCRYPTION_KEY="your-encryption-key-32-chars"

# Rate Limiting
RATE_LIMIT_REDIS_URL="redis://localhost:6379"

# Monitoring
SENTRY_DSN="your-sentry-dsn"
SENTRY_ORG="your-sentry-org"
SENTRY_PROJECT="your-sentry-project"
SENTRY_AUTH_TOKEN="your-sentry-auth-token"

# Analytics
GOOGLE_ANALYTICS_ID="GA-XXXXXXXXX"
GOOGLE_TAG_MANAGER_ID="GTM-XXXXXXX"

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_MONITORING=true
ENABLE_RATE_LIMITING=true
ENABLE_CACHING=true

# Development
NODE_ENV="development"
LOG_LEVEL="debug"
```

## Vercel Deployment

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy to Vercel

```bash
vercel
```

### 4. Set Environment Variables

In your Vercel dashboard, go to your project settings and add all the environment variables from your `.env.local` file.

### 5. Configure Custom Domain (Optional)

1. Go to your Vercel project dashboard
2. Navigate to Settings > Domains
3. Add your custom domain
4. Configure DNS settings as instructed

## Database Setup

### Using Vercel Postgres

1. Go to your Vercel dashboard
2. Navigate to Storage > Create Database
3. Select Postgres
4. Copy the connection string to your `DATABASE_URL` environment variable

### Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed the database
npm run db:seed
```

## Stripe Setup

### 1. Create Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create a new account
3. Get your API keys from the Developers section

### 2. Configure Webhooks

1. Go to Webhooks in your Stripe dashboard
2. Add endpoint: `https://your-domain.vercel.app/api/payments/webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy the webhook secret to your environment variables

## Resend Email Setup

### 1. Create Resend Account

1. Go to [Resend](https://resend.com)
2. Create a new account
3. Get your API key from the API Keys section

### 2. Configure Domain

1. Add your domain in Resend dashboard
2. Configure DNS records as instructed
3. Verify domain ownership

## Vercel Blob Storage Setup

### 1. Enable Blob Storage

1. Go to your Vercel project dashboard
2. Navigate to Storage > Create Database
3. Select Blob
4. Get your read/write token

### 2. Configure Environment Variables

Add the blob token to your environment variables.

## Monitoring Setup

### 1. Sentry Setup

1. Go to [Sentry](https://sentry.io)
2. Create a new project
3. Get your DSN and configure it in your environment variables

### 2. Google Analytics Setup

1. Go to [Google Analytics](https://analytics.google.com)
2. Create a new property
3. Get your tracking ID and configure it in your environment variables

## Build and Deploy

### 1. Build Locally

```bash
npm run build
```

### 2. Test Locally

```bash
npm run start
```

### 3. Deploy to Production

```bash
vercel --prod
```

## Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] Environment variables configured
- [ ] Stripe webhooks configured
- [ ] Email service working
- [ ] File uploads working
- [ ] Authentication working
- [ ] Payment processing working
- [ ] Admin dashboard accessible
- [ ] SSL certificate active
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring and analytics active
- [ ] Error tracking working
- [ ] Performance monitoring active

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Check database permissions
   - Ensure database is accessible

3. **Authentication Issues**
   - Verify NEXTAUTH_SECRET is set
   - Check OAuth provider configurations
   - Verify callback URLs

4. **Payment Issues**
   - Check Stripe API keys
   - Verify webhook configuration
   - Check Stripe account status

5. **Email Issues**
   - Verify Resend API key
   - Check domain configuration
   - Verify email templates

### Getting Help

- Check the logs in Vercel dashboard
- Review error messages in Sentry
- Check Stripe dashboard for payment issues
- Review Resend dashboard for email issues

## Security Considerations

1. **Environment Variables**
   - Never commit `.env.local` to version control
   - Use strong, unique secrets
   - Rotate secrets regularly

2. **Database Security**
   - Use connection pooling
   - Enable SSL connections
   - Regular backups

3. **API Security**
   - Rate limiting enabled
   - Input validation
   - CORS configured
   - CSRF protection

4. **Authentication**
   - Strong password policies
   - Session management
   - OAuth provider security

## Performance Optimization

1. **Caching**
   - Enable Vercel Edge Caching
   - Use Redis for session storage
   - Implement API response caching

2. **Image Optimization**
   - Use Next.js Image component
   - Enable WebP format
   - Implement lazy loading

3. **Code Splitting**
   - Dynamic imports
   - Route-based splitting
   - Component-based splitting

4. **Database Optimization**
   - Proper indexing
   - Query optimization
   - Connection pooling

## Backup Strategy

1. **Database Backups**
   - Automated daily backups
   - Point-in-time recovery
   - Cross-region replication

2. **File Backups**
   - Vercel Blob Storage backups
   - Regular file system backups
   - Disaster recovery plan

3. **Configuration Backups**
   - Environment variable backups
   - Configuration file backups
   - Infrastructure as Code

## Maintenance

1. **Regular Updates**
   - Dependencies updates
   - Security patches
   - Feature updates

2. **Monitoring**
   - Performance monitoring
   - Error tracking
   - Uptime monitoring

3. **Scaling**
   - Auto-scaling configuration
   - Load balancing
   - CDN optimization

## Support

For deployment support, please contact:
- Email: support@zyra-ultra.com
- Documentation: [Project Documentation](https://github.com/your-repo/docs)
- Issues: [GitHub Issues](https://github.com/your-repo/issues)




