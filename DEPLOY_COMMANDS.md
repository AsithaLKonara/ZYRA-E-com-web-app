# 🚀 ZYRA Deployment - Exact Commands

## After Vercel Login Completes:

### 1. Deploy the Project:
```bash
vercel
```

When prompted:
- **Set up and deploy?** → Y (yes)
- **Which scope?** → Your account
- **Link to existing project?** → N (no)
- **What's your project's name?** → zyra-fashion
- **In which directory is your code located?** → ./ (press ENTER)
- **Want to override the settings?** → N (no)

### 2. Create Production Deployment:
```bash
vercel --prod
```

### 3. Open Your Deployed Site:
```bash
vercel open
```

---

## After Deployment:

### 4. Set Up Database (In Vercel Dashboard):

1. Go to: https://vercel.com/dashboard
2. Select `zyra-fashion` project
3. Click "Storage" tab
4. Click "Create Database"
5. Select "Postgres"
6. Name: `zyra-fashion-db`
7. Click "Create"
8. Click "Connect to Project" → Select `zyra-fashion`

### 5. Add Required Environment Variable:

1. In Vercel Dashboard → Project Settings → Environment Variables
2. Add:
   - **Name:** `NEXTAUTH_SECRET`
   - **Value:** (Generate with: `openssl rand -base64 32`)
   - **Environment:** Production, Preview, Development
3. Click "Save"

### 6. Run Database Migrations:

**Option A - Using Vercel CLI:**
```bash
# Pull environment variables
vercel env pull .env.production

# Run migrations
npx prisma generate
npx prisma db push

# Seed database
npx tsx lib/seed-zyra.ts
```

**Option B - Redeploy (Automatic):**
```bash
# Trigger a new deployment
vercel --prod
```

---

## ✅ Your Site Will Be Live!

**URL:** https://zyra-fashion.vercel.app (or your custom domain)

**Test:**
- Browse products
- Sign up/Sign in
- Add to cart
- Complete checkout

**Admin Access:**
- Email: admin@zyra-fashion.com
- Password: admin123

---

## 🎉 Deployment Complete!

Your ZYRA Women's Fashion platform is now LIVE on the internet! 🌐👗✨

