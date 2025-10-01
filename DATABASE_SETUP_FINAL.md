# 🗄️ ZYRA Fashion - Final Database Setup for Demo

## ⚡ Quick Setup (5 Minutes)

### **Step 1: Go to Vercel Dashboard**

1. **Open:** https://vercel.com/asithalkonaras-projects/zyra
2. **Click:** "Storage" tab at the top

### **Step 2: Create Postgres Database**

1. Click **"Create Database"** button
2. Select **"Postgres"**
3. Name: **`zyra-db`**
4. Region: **Washington, D.C., USA (iad1)** (closest to your deployment)
5. Click **"Create"**

### **Step 3: Connect Database to Project**

1. After creation, click **"Connect to Project"**
2. Select: **`zyra`**
3. Click **"Connect"**
4. ✅ Done! Environment variables auto-added

### **Step 4: Add Required Environment Variables**

1. Go to: **Settings** → **Environment Variables**
2. Click **"Add New"**

**Add these 2 variables:**

**Variable 1:**
- Name: `NEXTAUTH_SECRET`
- Value: `zyra-production-secret-key-change-this-to-random-32-chars`
- Environments: ✅ Production ✅ Preview ✅ Development
- Click **"Save"**

**Variable 2:**
- Name: `NEXTAUTH_URL`  
- Value: `https://zyra.vercel.app`
- Environments: ✅ Production ✅ Preview
- Click **"Save"**

### **Step 5: Trigger New Deployment**

1. Go to **"Deployments"** tab
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. ✅ Wait for build to complete (~2-3 minutes)

---

## 🌐 **YOUR SITE WILL BE LIVE!**

**URL:** https://zyra.vercel.app

**What Will Work:**
- ✅ ZYRA branding and UI
- ✅ Navigation and layout
- ⚠️ Products (database empty - needs seeding)
- ⚠️ Authentication (needs database)

---

## 🌱 **Optional: Seed Database with Products**

If you want to add the 15+ fashion products:

**Method 1 - Using Vercel CLI:**
```bash
# In your local terminal:
vercel env pull .env.production
npx prisma generate
npx prisma db push
npx tsx lib/seed-zyra.ts
```

**Method 2 - Manual SQL (Quick):**
1. Go to Vercel → Storage → zyra-db → Query
2. Run SQL commands to create admin user manually
3. Add products through admin dashboard

---

## ✅ **Verification:**

After deployment completes:

1. **Visit:** https://zyra.vercel.app
2. **Check:**
   - ZYRA logo displays
   - Site loads without errors
   - Navigation works
   - Pages are accessible

---

## 🎯 **For Full Demo Functionality:**

**Add these later (optional):**

```env
# Stripe (for payments demo)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Resend (for email demo)
RESEND_API_KEY=re_...

# Vercel Blob (for image uploads)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

---

## 🎊 **DONE!**

Your ZYRA Fashion platform will be:
- ✅ Live on the internet
- ✅ Fully branded
- ✅ Ready for demo
- ✅ Accessible worldwide

**Next:** Wait for Vercel build to complete, then visit your site!

**Your women's fashion e-commerce platform is LAUNCHING! 🚀👗✨**

