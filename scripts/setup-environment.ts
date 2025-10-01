#!/usr/bin/env tsx

import { writeFileSync } from 'fs'
import { join } from 'path'

const envTemplate = `# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/neoshop_ultra"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-change-in-production"

# Application Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Admin Configuration
ADMIN_EMAIL="admin@neoshop.com"
ADMIN_PASSWORD="admin123!@#"

# Security Configuration
JWT_SECRET="your-jwt-secret-key-change-in-production"
ENCRYPTION_KEY="your-32-character-encryption-key"

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Email Configuration
RESEND_API_KEY="re_your_resend_api_key"
EMAIL_FROM="noreply@neoshop.com"
EMAIL_FROM_NAME="NEOSHOP ULTRA"

# File Storage Configuration
BLOB_READ_WRITE_TOKEN="your_vercel_blob_token"

# Redis Configuration (for caching and job queues)
REDIS_URL="redis://localhost:6379"

# Meta API Configuration (for social features)
META_APP_ID="your_meta_app_id"
META_APP_SECRET="your_meta_app_secret"
META_ACCESS_TOKEN="your_meta_access_token"

# Video Processing Configuration
FFMPEG_PATH="/usr/bin/ffmpeg"
VIDEO_STORAGE_PATH="/tmp/videos"
MAX_VIDEO_SIZE="100MB"

# Monitoring Configuration
SENTRY_DSN="your_sentry_dsn"
GOOGLE_ANALYTICS_ID="GA-XXXXXXXXX"

# CDN Configuration
CLOUDFLARE_API_TOKEN="your_cloudflare_token"
CLOUDFLARE_ZONE_ID="your_zone_id"
`

async function setupEnvironment() {
  try {
    console.log('🚀 Setting up NEOSHOP ULTRA environment...')
    
    // Create .env.local file
    writeFileSync('.env.local', envTemplate)
    console.log('✅ Created .env.local template')
    
    // Create .env.example file
    writeFileSync('.env.example', envTemplate)
    console.log('✅ Created .env.example template')
    
    console.log('📝 Please update .env.local with your actual values')
    console.log('🔧 Run: npm run db:migrate to set up the database')
    console.log('🚀 Run: npm run dev to start the development server')
    
  } catch (error) {
    console.error('❌ Error setting up environment:', error)
    process.exit(1)
  }
}

setupEnvironment()


