# Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### Database
```env
DATABASE_URL="file:./dev.db"
```

### NextAuth.js
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### OAuth Providers
```env
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

### Stripe
```env
STRIPE_PUBLISHABLE_KEY=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
```

### Vercel Blob Storage
```env
BLOB_READ_WRITE_TOKEN=""
```

### Resend Email
```env
RESEND_API_KEY=""
```

### App Configuration
```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
```

### Admin Configuration
```env
ADMIN_EMAIL="admin@zyra.com"
ADMIN_PASSWORD="admin123"
```

### Security
```env
JWT_SECRET="your-jwt-secret-here"
ENCRYPTION_KEY="your-encryption-key-here"
```

## Setup Instructions

1. Copy this file to `.env.local`
2. Fill in the actual values for each variable
3. Never commit `.env.local` to version control
4. Use `.env.example` as a template for team members

## Production Environment

For production deployment on Vercel:
1. Add all environment variables in Vercel dashboard
2. Use production database URL
3. Use production API keys and secrets
4. Update NEXT_PUBLIC_APP_URL to your domain




