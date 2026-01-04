# ZYRA Fashion - Automated Setup Script for Windows
# This script will help you set up the ZYRA Fashion e-commerce platform

Write-Host "👗 ZYRA Fashion - Automated Setup" -ForegroundColor Magenta
Write-Host "=================================" -ForegroundColor Magenta
Write-Host ""

# Step 1: Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "✅ .env.local file already exists" -ForegroundColor Green
} else {
    Write-Host "📝 Creating .env.local file..." -ForegroundColor Yellow
    
    # Create minimal .env.local
    @"
# ZYRA Fashion - Environment Configuration
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=zyra-fashion-dev-secret-key-change-in-production-min-32-chars
DATABASE_URL=postgresql://postgres:password@localhost:5432/zyra_fashion

# Optional - Add these when you set up services:
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_PUBLISHABLE_KEY=pk_test_...
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
# RESEND_API_KEY=re_...
# BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
"@ | Out-File -FilePath ".env.local" -Encoding utf8
    
    Write-Host "✅ Created .env.local file" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🗄️  Setting up database..." -ForegroundColor Yellow
Write-Host ""

# Generate Prisma Client
Write-Host "   Generating Prisma Client..." -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Prisma Client generated" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Prisma generation failed (you may need to set up database first)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Set up your PostgreSQL database:" -ForegroundColor White
Write-Host "   Option A: Use Vercel Postgres (Recommended)" -ForegroundColor Gray
Write-Host "   Option B: Install PostgreSQL locally" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Update .env.local with your database connection string" -ForegroundColor White
Write-Host ""
Write-Host "3. Run database migrations:" -ForegroundColor White
Write-Host "   npx prisma db push" -ForegroundColor Gray
Write-Host "   npx tsx lib/seed-zyra.ts" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Start the development server:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Open your browser:" -ForegroundColor White
Write-Host "   http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 For detailed instructions, see:" -ForegroundColor Cyan
Write-Host "   - VERCEL_POSTGRES_SETUP.md (Quick 5-min setup)" -ForegroundColor Gray
Write-Host "   - ENVIRONMENT_SETUP_ZYRA.md (Complete guide)" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Need help? Check WHATS_NEXT_ZYRA.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Your ZYRA Fashion platform is ready!" -ForegroundColor Magenta

