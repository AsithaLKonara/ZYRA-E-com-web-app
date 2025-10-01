# 🔧 ZYRA Fashion - Environment Setup Guide

This guide will help you set up all the required environment variables for the ZYRA Fashion e-commerce platform.

## 📋 Quick Setup Checklist

- [ ] Create `.env.local` file
- [ ] Set up PostgreSQL database
- [ ] Configure NextAuth.js
- [ ] Set up Stripe (optional for testing)
- [ ] Configure Resend email (optional for testing)
- [ ] Set up Vercel Blob Storage (optional for testing)

---

## 🚀 Step-by-Step Setup

### Step 1: Create `.env.local` File

Create a file named `.env.local` in the root directory of the project.

```bash
# In project root
touch .env.local
```

### Step 2: Minimum Required Configuration

For basic local development, you need:

```env
# Application
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000

# Authentication Secret (Generate: openssl rand -base64 32)
NEXTAUTH_SECRET=your-secret-key-here-at-least-32-characters-long

# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/zyra_fashion"
```

---

## 🗄️ Database Setup

### Option 1: Local PostgreSQL (Recommended for Development)

1. **Install PostgreSQL**
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - Mac: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. **Create Database**
   ```sql
   CREATE DATABASE zyra_fashion;
   CREATE USER zyra_user WITH ENCRYPTED PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE zyra_fashion TO zyra_user;
   ```

3. **Update .env.local**
   ```env
   DATABASE_URL="postgresql://zyra_user:your_password@localhost:5432/zyra_fashion"
   ```

4. **Run Migrations**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

### Option 2: Vercel Postgres (Production)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project → Storage → Create Database → Postgres
3. Copy all the environment variables provided
4. Add to your `.env.local`:
   ```env
   POSTGRES_URL="..."
   POSTGRES_PRISMA_URL="..."
   POSTGRES_URL_NON_POOLING="..."
   POSTGRES_USER="..."
   POSTGRES_HOST="..."
   POSTGRES_PASSWORD="..."
   POSTGRES_DATABASE="..."
   ```

---

## 🔐 Authentication Setup

### NextAuth.js Secret

Generate a secure secret:

```bash
# On Mac/Linux
openssl rand -base64 32

# On Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Add to `.env.local`:
```env
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=http://localhost:3000
```

### Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

Add to `.env.local`:
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### GitHub OAuth (Optional)

1. Go to [GitHub Settings](https://github.com/settings/developers)
2. OAuth Apps → New OAuth App
3. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

Add to `.env.local`:
```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

---

## 💳 Payment Setup (Stripe)

### Test Mode (Development)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get your test API keys
3. Add to `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Webhook Setup (Local Testing)

1. Install Stripe CLI:
   ```bash
   # Windows
   scoop install stripe
   
   # Mac
   brew install stripe/stripe-cli/stripe
   ```

2. Login and forward webhooks:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```

3. Copy the webhook secret and add to `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## 📧 Email Setup (Resend)

1. Go to [Resend](https://resend.com/)
2. Create account and verify domain
3. Get API key from dashboard

Add to `.env.local`:
```env
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@yourdomain.com
CONTACT_EMAIL=hello@yourdomain.com
```

**Note:** For development, you can skip this and emails will be logged to console instead.

---

## 📦 File Storage (Vercel Blob)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select project → Storage → Create Store → Blob
3. Copy the token

Add to `.env.local`:
```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

**Note:** For development, you can skip this and use local file storage.

---

## 📊 Monitoring & Analytics (Optional)

### Sentry (Error Tracking)

1. Go to [Sentry.io](https://sentry.io/)
2. Create project
3. Copy DSN

```env
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

### Google Analytics

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create property
3. Get Measurement ID

```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## 🎯 Complete `.env.local` Template

Here's a complete template with all options:

```env
# ===========================================
# REQUIRED FOR BASIC FUNCTIONALITY
# ===========================================
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here-32-chars-minimum
DATABASE_URL="postgresql://username:password@localhost:5432/zyra_fashion"

# ===========================================
# OPTIONAL - OAuth Providers
# ===========================================
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-secret

# ===========================================
# OPTIONAL - Payment Processing
# ===========================================
STRIPE_SECRET_KEY=sk_test_your-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-secret

# ===========================================
# OPTIONAL - Email Service
# ===========================================
RESEND_API_KEY=re_your-key
FROM_EMAIL=noreply@yourdomain.com

# ===========================================
# OPTIONAL - File Storage
# ===========================================
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_your-token

# ===========================================
# OPTIONAL - Monitoring
# ===========================================
SENTRY_DSN=https://your-sentry-dsn
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# ===========================================
# OPTIONAL - Caching
# ===========================================
REDIS_URL=redis://localhost:6379

# ===========================================
# FEATURE FLAGS
# ===========================================
ENABLE_ANALYTICS=true
ENABLE_MONITORING=false
ENABLE_CACHING=false
```

---

## ✅ Verify Setup

After configuration, verify everything works:

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Push database schema
npx prisma db push

# 4. Seed database with sample data
npm run db:seed

# 5. Start development server
npm run dev

# 6. Open browser
# Visit: http://localhost:3000
```

---

## 🔍 Troubleshooting

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -U username -d zyra_fashion -h localhost

# Check if PostgreSQL is running
# Mac/Linux
pg_isready

# Windows
pg_ctl status
```

### Prisma Issues

```bash
# Clear Prisma cache
npx prisma generate --force

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset --force
```

### Port Already in Use

```bash
# Kill process on port 3000
# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 📚 Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Stripe Documentation](https://stripe.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

---

## 🆘 Need Help?

- Check [Troubleshooting Guide](docs/TROUBLESHOOTING_GUIDE.md)
- Open an issue on [GitHub](https://github.com/AsithaLKonara/ZYRA-E-com-web-app/issues)
- Contact: hello@zyra-fashion.com

---

**Ready to start developing ZYRA Fashion! 🚀**

