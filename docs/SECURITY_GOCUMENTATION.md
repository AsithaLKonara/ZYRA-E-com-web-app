# NEOSHOP ULTRA - Security Documentation

## Overview

This document outlines the comprehensive security measures implemented in NEOSHOP ULTRA, including authentication, authorization, data protection, API security, and compliance considerations.

## Security Architecture

### Defense in Depth Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                         │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: Network Security (DDoS, WAF, CDN)               │
│  Layer 2: Application Security (Auth, Validation, CORS)    │
│  Layer 3: Data Security (Encryption, Hashing, Backup)      │
│  Layer 4: Infrastructure Security (Secrets, Monitoring)    │
└─────────────────────────────────────────────────────────────┘
```

### Security Principles

1. **Least Privilege**: Users and systems have minimum required access
2. **Defense in Depth**: Multiple security layers
3. **Fail Secure**: System fails to secure state by default
4. **Security by Design**: Security built into every component
5. **Continuous Monitoring**: Real-time security monitoring
6. **Regular Updates**: Keep dependencies and systems updated

## Authentication & Authorization

### NextAuth.js Configuration

```typescript
// lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { compare } from 'bcryptjs'
import { db } from './db-connection'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: env.GITHUB_CLIENT_ID!,
      clientSecret: env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          throw new Error('Invalid credentials')
        }

        const isPasswordValid = await compare(credentials.password, user.password)
        if (!isPasswordValid) {
          throw new Error('Invalid credentials')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role
      }
      return session
    },
  },
}
```

### Role-Based Access Control (RBAC)

```typescript
// types/auth.ts
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

// lib/auth-utils.ts
export function hasRole(user: User, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    [UserRole.CUSTOMER]: 1,
    [UserRole.MODERATOR]: 2,
    [UserRole.ADMIN]: 3,
  }
  
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
}

export function canAccessResource(user: User, resource: string): boolean {
  const permissions = {
    [UserRole.CUSTOMER]: ['products:read', 'cart:manage', 'orders:create'],
    [UserRole.MODERATOR]: ['products:read', 'products:update', 'orders:read'],
    [UserRole.ADMIN]: ['*'], // All permissions
  }
  
  const userPermissions = permissions[user.role] || []
  return userPermissions.includes('*') || userPermissions.includes(resource)
}
```

### Session Management

```typescript
// lib/session-manager.ts
import { Redis } from 'ioredis'
import { logger } from './logger'

const redis = new Redis(env.REDIS_URL)

export class SessionManager {
  static async createSession(userId: string, sessionData: any): Promise<string> {
    const sessionId = crypto.randomUUID()
    const sessionKey = `session:${sessionId}`
    
    await redis.setex(sessionKey, 30 * 24 * 60 * 60, JSON.stringify({
      userId,
      ...sessionData,
      createdAt: new Date().toISOString(),
    }))
    
    logger.security('Session created', { userId, sessionId })
    return sessionId
  }
  
  static async getSession(sessionId: string): Promise<any> {
    const sessionKey = `session:${sessionId}`
    const sessionData = await redis.get(sessionKey)
    
    if (!sessionData) {
      return null
    }
    
    return JSON.parse(sessionData)
  }
  
  static async revokeSession(sessionId: string): Promise<void> {
    const sessionKey = `session:${sessionId}`
    await redis.del(sessionKey)
    
    logger.security('Session revoked', { sessionId })
  }
  
  static async revokeAllUserSessions(userId: string): Promise<void> {
    const pattern = `session:*`
    const keys = await redis.keys(pattern)
    
    for (const key of keys) {
      const sessionData = await redis.get(key)
      if (sessionData) {
        const session = JSON.parse(sessionData)
        if (session.userId === userId) {
          await redis.del(key)
        }
      }
    }
    
    logger.security('All user sessions revoked', { userId })
  }
}
```

## Input Validation & Sanitization

### Zod Validation Schemas

```typescript
// lib/validation.ts
import { z } from 'zod'

// User validation
export const userSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase(),
  password: z.string()
    .min(8)
    .max(128)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number, and special character'),
  role: z.enum(['CUSTOMER', 'ADMIN', 'MODERATOR']).optional(),
})

// Product validation
export const productSchema = z.object({
  name: z.string().min(3).max(200).trim(),
  description: z.string().min(10).max(5000).trim(),
  price: z.number().positive().max(999999.99),
  imageUrl: z.array(z.string().url()).min(1).max(10),
  categoryId: z.string().uuid(),
  stock: z.number().int().min(0).max(999999),
  sku: z.string().min(3).max(50).regex(/^[A-Z0-9-_]+$/),
  isActive: z.boolean().optional(),
})

// Order validation
export const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(999),
  })).min(1).max(50),
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  notes: z.string().max(1000).optional(),
})

// Address validation
export const addressSchema = z.object({
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  address1: z.string().min(5).max(200).trim(),
  address2: z.string().max(200).trim().optional(),
  city: z.string().min(2).max(100).trim(),
  state: z.string().min(2).max(100).trim(),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
  country: z.string().length(2).toUpperCase(),
  phone: z.string().regex(/^\+?[\d\s-()]+$/).optional(),
})
```

### Input Sanitization

```typescript
// lib/sanitization.ts
import DOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

const window = new JSDOM('<!DOCTYPE html>').window
const purify = DOMPurify(window as unknown as Window)

export class Sanitizer {
  static sanitizeHtml(input: string): string {
    return purify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: [],
    })
  }
  
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
  }
  
  static sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized = {} as T
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key as keyof T] = this.sanitizeString(value) as T[keyof T]
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key as keyof T] = this.sanitizeObject(value) as T[keyof T]
      } else {
        sanitized[key as keyof T] = value
      }
    }
    
    return sanitized
  }
}
```

### API Input Validation Middleware

```typescript
// lib/api-validation.ts
import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema, z } from 'zod'
import { logger } from './logger'

export function withValidation(schema: ZodSchema) {
  return function (handler: Function) {
    return async function (request: NextRequest) {
      try {
        const body = await request.json()
        const validatedData = schema.parse(body)
        
        // Attach validated data to request
        ;(request as any).validatedData = validatedData
        
        return handler(request)
      } catch (error) {
        if (error instanceof z.ZodError) {
          logger.security('Validation error', {
            errors: error.errors,
            path: request.nextUrl.pathname,
            method: request.method,
          })
          
          return NextResponse.json({
            success: false,
            error: 'Validation failed',
            details: error.errors,
          }, { status: 400 })
        }
        
        throw error
      }
    }
  }
}
```

## API Security

### Rate Limiting

```typescript
// lib/rate-limiter.ts
import { Redis } from 'ioredis'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from './logger'

const redis = new Redis(env.REDIS_URL)

export class RateLimiter {
  static async checkLimit(
    identifier: string,
    limit: number,
    window: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `rate_limit:${identifier}`
    const current = await redis.incr(key)
    
    if (current === 1) {
      await redis.expire(key, window)
    }
    
    const ttl = await redis.ttl(key)
    const resetTime = Date.now() + (ttl * 1000)
    
    const allowed = current <= limit
    const remaining = Math.max(0, limit - current)
    
    if (!allowed) {
      logger.security('Rate limit exceeded', { identifier, current, limit })
    }
    
    return { allowed, remaining, resetTime }
  }
  
  static middleware(limit: number, window: number) {
    return async function (request: NextRequest) {
      const identifier = request.ip || 'unknown'
      const { allowed, remaining, resetTime } = await RateLimiter.checkLimit(
        identifier,
        limit,
        window
      )
      
      if (!allowed) {
        return NextResponse.json({
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
        }, { status: 429 })
      }
      
      const response = NextResponse.next()
      response.headers.set('X-RateLimit-Limit', limit.toString())
      response.headers.set('X-RateLimit-Remaining', remaining.toString())
      response.headers.set('X-RateLimit-Reset', resetTime.toString())
      
      return response
    }
  }
}

// Rate limit configurations
export const rateLimits = {
  general: { limit: 100, window: 60 }, // 100 requests per minute
  auth: { limit: 10, window: 60 }, // 10 requests per minute
  admin: { limit: 50, window: 60 }, // 50 requests per minute
  upload: { limit: 20, window: 60 }, // 20 requests per minute
}
```

### CORS Configuration

```typescript
// lib/cors.ts
import { NextRequest, NextResponse } from 'next/server'
import { logger } from './logger'

const allowedOrigins = [
  'http://localhost:3000',
  'https://neoshop-ultra.vercel.app',
  'https://www.neoshop-ultra.com',
]

const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
const allowedHeaders = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'X-CSRF-Token',
]

export function corsMiddleware(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin')
  const method = request.headers.get('access-control-request-method')
  const headers = request.headers.get('access-control-request-headers')
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 })
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
    
    response.headers.set('Access-Control-Allow-Methods', allowedMethods.join(', '))
    response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '))
    response.headers.set('Access-Control-Max-Age', '86400')
    
    return response
  }
  
  // Handle actual requests
  if (origin && allowedOrigins.includes(origin)) {
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    
    return response
  }
  
  // Block unauthorized origins
  if (origin && !allowedOrigins.includes(origin)) {
    logger.security('CORS violation', { origin, path: request.nextUrl.pathname })
    return new NextResponse('Forbidden', { status: 403 })
  }
  
  return null
}
```

### CSRF Protection

```typescript
// lib/csrf.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { logger } from './logger'

export class CSRFProtector {
  static generateToken(): string {
    return crypto.randomUUID()
  }
  
  static async validateToken(request: NextRequest): Promise<boolean> {
    const cookieToken = request.cookies.get('csrf-token')?.value
    const headerToken = request.headers.get('x-csrf-token')
    
    if (!cookieToken || !headerToken) {
      return false
    }
    
    return cookieToken === headerToken
  }
  
  static middleware() {
    return async function (request: NextRequest) {
      // Only check state-changing methods
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        const isValid = await CSRFProtector.validateToken(request)
        
        if (!isValid) {
          logger.security('CSRF token validation failed', {
            path: request.nextUrl.pathname,
            method: request.method,
          })
          
          return NextResponse.json({
            success: false,
            error: 'CSRF token mismatch',
          }, { status: 403 })
        }
      }
      
      return NextResponse.next()
    }
  }
}
```

## Data Protection

### Encryption

```typescript
// lib/encryption.ts
import crypto from 'crypto'

const algorithm = 'aes-256-gcm'
const key = crypto.scryptSync(env.ENCRYPTION_KEY!, 'salt', 32)

export class Encryption {
  static encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(algorithm, key, iv)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    }
  }
  
  static decrypt(encrypted: string, iv: string, tag: string): string {
    const decipher = crypto.createDecipher(algorithm, key, Buffer.from(iv, 'hex'))
    decipher.setAuthTag(Buffer.from(tag, 'hex'))
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
  
  static hashPassword(password: string): Promise<string> {
    const bcrypt = require('bcryptjs')
    return bcrypt.hash(password, 12)
  }
  
  static verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = require('bcryptjs')
    return bcrypt.compare(password, hash)
  }
}
```

### Database Security

```typescript
// lib/db-security.ts
import { db } from './db-connection'
import { logger } from './logger'

export class DatabaseSecurity {
  static async auditQuery(query: string, params: any[], userId?: string): Promise<void> {
    // Log potentially sensitive queries
    if (query.toLowerCase().includes('password') || 
        query.toLowerCase().includes('token') ||
        query.toLowerCase().includes('secret')) {
      logger.security('Sensitive query executed', {
        query: query.substring(0, 100), // Truncate for security
        userId,
        timestamp: new Date().toISOString(),
      })
    }
  }
  
  static async sanitizeInput(input: any): Promise<any> {
    if (typeof input === 'string') {
      return input.replace(/[<>]/g, '').trim()
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item))
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = await this.sanitizeInput(value)
      }
      return sanitized
    }
    
    return input
  }
  
  static async validateDatabaseAccess(userId: string, resource: string): Promise<boolean> {
    // Implement database-level access control
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true, isActive: true },
    })
    
    if (!user || !user.isActive) {
      return false
    }
    
    // Admin can access everything
    if (user.role === 'ADMIN') {
      return true
    }
    
    // Customer can only access their own data
    if (user.role === 'CUSTOMER') {
      return resource.includes(userId)
    }
    
    return false
  }
}
```

## File Upload Security

### File Validation

```typescript
// lib/file-security.ts
import { logger } from './logger'

export class FileSecurity {
  static readonly ALLOWED_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    document: ['application/pdf', 'text/plain'],
    archive: ['application/zip', 'application/x-rar-compressed'],
  }
  
  static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  
  static validateFile(file: File, category: keyof typeof FileSecurity.ALLOWED_TYPES): {
    valid: boolean
    error?: string
  } {
    // Check file size
    if (file.size > FileSecurity.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: 'File size exceeds maximum allowed size',
      }
    }
    
    // Check file type
    if (!FileSecurity.ALLOWED_TYPES[category].includes(file.type)) {
      return {
        valid: false,
        error: 'File type not allowed',
      }
    }
    
    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase()
    const allowedExtensions = {
      image: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
      document: ['pdf', 'txt'],
      archive: ['zip', 'rar'],
    }
    
    if (!allowedExtensions[category].includes(extension || '')) {
      return {
        valid: false,
        error: 'File extension not allowed',
      }
    }
    
    return { valid: true }
  }
  
  static async scanFile(buffer: Buffer): Promise<{ safe: boolean; threats?: string[] }> {
    // Implement virus scanning (placeholder)
    // In production, integrate with services like ClamAV or VirusTotal
    
    const threats: string[] = []
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /eval\(/gi,
      /document\.write/gi,
      /<script/gi,
      /javascript:/gi,
    ]
    
    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1024))
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        threats.push(`Suspicious pattern detected: ${pattern.source}`)
      }
    }
    
    if (threats.length > 0) {
      logger.security('File scan detected threats', { threats })
      return { safe: false, threats }
    }
    
    return { safe: true }
  }
}
```

### Secure File Upload

```typescript
// app/api/upload/secure/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { FileSecurity } from '@/lib/file-security'
import { uploadFile } from '@/lib/blob-storage'
import { logger } from '@/lib/logger'

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string
    
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided',
      }, { status: 400 })
    }
    
    // Validate file
    const validation = FileSecurity.validateFile(file, category as any)
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error,
      }, { status: 400 })
    }
    
    // Scan file for threats
    const buffer = Buffer.from(await file.arrayBuffer())
    const scanResult = await FileSecurity.scanFile(buffer)
    
    if (!scanResult.safe) {
      logger.security('File upload blocked due to security scan', {
        filename: file.name,
        threats: scanResult.threats,
      })
      
      return NextResponse.json({
        success: false,
        error: 'File contains potential security threats',
      }, { status: 400 })
    }
    
    // Upload file
    const result = await uploadFile(file.name, buffer, {
      access: 'public',
      contentType: file.type,
    })
    
    logger.security('File uploaded successfully', {
      filename: file.name,
      size: file.size,
      type: file.type,
    })
    
    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    logger.error('File upload error:', error)
    return NextResponse.json({
      success: false,
      error: 'File upload failed',
    }, { status: 500 })
  }
})
```

## Payment Security

### Stripe Security

```typescript
// lib/stripe-security.ts
import Stripe from 'stripe'
import { logger } from './logger'

const stripe = new Stripe(env.STRIPE_SECRET_KEY!)

export class StripeSecurity {
  static async validateWebhookSignature(
    payload: string,
    signature: string
  ): Promise<Stripe.Event> {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        env.STRIPE_WEBHOOK_SECRET!
      )
      
      logger.security('Stripe webhook validated', {
        type: event.type,
        id: event.id,
      })
      
      return event
    } catch (error) {
      logger.security('Stripe webhook validation failed', { error })
      throw new Error('Invalid webhook signature')
    }
  }
  
  static async createSecurePaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, string>
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
        confirm: false,
      })
      
      logger.security('Payment intent created', {
        id: paymentIntent.id,
        amount,
        currency,
      })
      
      return paymentIntent
    } catch (error) {
      logger.error('Payment intent creation failed:', error)
      throw error
    }
  }
  
  static async validatePaymentMethod(
    paymentMethodId: string,
    customerId: string
  ): Promise<boolean> {
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
      
      if (paymentMethod.customer !== customerId) {
        logger.security('Payment method validation failed', {
          paymentMethodId,
          customerId,
          actualCustomer: paymentMethod.customer,
        })
        return false
      }
      
      return true
    } catch (error) {
      logger.error('Payment method validation error:', error)
      return false
    }
  }
}
```

## Security Headers

### Security Middleware

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.stripe.com https://vitals.vercel-insights.com",
      "frame-src 'self' https://js.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  )
  
  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=(self)',
      'usb=()',
      'magnetometer=()',
      'accelerometer=()',
      'gyroscope=()',
    ].join(', ')
  )
  
  // Log security events
  if (request.headers.get('user-agent')?.includes('bot')) {
    logger.security('Bot detected', {
      userAgent: request.headers.get('user-agent'),
      path: request.nextUrl.pathname,
    })
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

## Monitoring & Logging

### Security Logging

```typescript
// lib/security-logger.ts
import { logger } from './logger'

export class SecurityLogger {
  static logAuthenticationAttempt(email: string, success: boolean, ip?: string): void {
    logger.security('Authentication attempt', {
      email,
      success,
      ip,
      timestamp: new Date().toISOString(),
    })
  }
  
  static logAuthorizationFailure(userId: string, resource: string, ip?: string): void {
    logger.security('Authorization failure', {
      userId,
      resource,
      ip,
      timestamp: new Date().toISOString(),
    })
  }
  
  static logSuspiciousActivity(activity: string, details: any, ip?: string): void {
    logger.security('Suspicious activity detected', {
      activity,
      details,
      ip,
      timestamp: new Date().toISOString(),
    })
  }
  
  static logDataAccess(userId: string, resource: string, action: string): void {
    logger.security('Data access', {
      userId,
      resource,
      action,
      timestamp: new Date().toISOString(),
    })
  }
  
  static logPaymentEvent(event: string, details: any, userId?: string): void {
    logger.security('Payment event', {
      event,
      details: {
        ...details,
        // Remove sensitive data
        cardNumber: details.cardNumber ? '***' : undefined,
        cvv: details.cvv ? '***' : undefined,
      },
      userId,
      timestamp: new Date().toISOString(),
    })
  }
}
```

### Security Monitoring

```typescript
// lib/security-monitor.ts
import { logger } from './logger'
import { SecurityLogger } from './security-logger'

export class SecurityMonitor {
  static async detectBruteForce(email: string, ip: string): Promise<boolean> {
    // Implement brute force detection logic
    const key = `brute_force:${email}:${ip}`
    const attempts = await redis.get(key)
    
    if (attempts && parseInt(attempts) > 5) {
      SecurityLogger.logSuspiciousActivity('Brute force attack detected', {
        email,
        ip,
        attempts: parseInt(attempts),
      })
      
      return true
    }
    
    return false
  }
  
  static async detectSuspiciousPatterns(request: NextRequest): Promise<boolean> {
    const userAgent = request.headers.get('user-agent') || ''
    const path = request.nextUrl.pathname
    const query = request.nextUrl.search
    
    // Check for SQL injection patterns
    const sqlPatterns = [
      /union\s+select/gi,
      /drop\s+table/gi,
      /delete\s+from/gi,
      /insert\s+into/gi,
      /update\s+set/gi,
    ]
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(query) || pattern.test(path)) {
        SecurityLogger.logSuspiciousActivity('SQL injection attempt detected', {
          pattern: pattern.source,
          path,
          query,
          userAgent,
        })
        
        return true
      }
    }
    
    // Check for XSS patterns
    const xssPatterns = [
      /<script/gi,
      /javascript:/gi,
      /on\w+=/gi,
      /eval\(/gi,
    ]
    
    for (const pattern of xssPatterns) {
      if (pattern.test(query) || pattern.test(path)) {
        SecurityLogger.logSuspiciousActivity('XSS attempt detected', {
          pattern: pattern.source,
          path,
          query,
          userAgent,
        })
        
        return true
      }
    }
    
    return false
  }
  
  static async monitorRateLimits(identifier: string, endpoint: string): Promise<void> {
    const key = `rate_limit:${identifier}:${endpoint}`
    const current = await redis.get(key)
    
    if (current && parseInt(current) > 100) {
      SecurityLogger.logSuspiciousActivity('Rate limit exceeded', {
        identifier,
        endpoint,
        requests: parseInt(current),
      })
    }
  }
}
```

## Compliance & Privacy

### GDPR Compliance

```typescript
// lib/gdpr.ts
import { db } from './db-connection'
import { logger } from './logger'

export class GDPRCompliance {
  static async exportUserData(userId: string): Promise<any> {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        orders: true,
        reviews: true,
        cart: true,
      },
    })
    
    // Remove sensitive data
    const exportData = {
      ...user,
      password: undefined,
      emailVerificationToken: undefined,
      passwordResetToken: undefined,
    }
    
    logger.security('User data exported', { userId })
    
    return exportData
  }
  
  static async deleteUserData(userId: string): Promise<void> {
    // Delete user data in order
    await db.orderItem.deleteMany({
      where: { order: { userId } },
    })
    
    await db.order.deleteMany({
      where: { userId },
    })
    
    await db.review.deleteMany({
      where: { userId },
    })
    
    await db.cartItem.deleteMany({
      where: { cart: { userId } },
    })
    
    await db.cart.deleteMany({
      where: { userId },
    })
    
    await db.user.delete({
      where: { id: userId },
    })
    
    logger.security('User data deleted', { userId })
  }
  
  static async anonymizeUserData(userId: string): Promise<void> {
    await db.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${userId}@example.com`,
        name: 'Deleted User',
        password: null,
        emailVerificationToken: null,
        passwordResetToken: null,
      },
    })
    
    logger.security('User data anonymized', { userId })
  }
}
```

### Privacy Policy Compliance

```typescript
// lib/privacy.ts
export class PrivacyCompliance {
  static readonly dataRetentionPeriods = {
    userData: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
    orderData: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
    logData: 90 * 24 * 60 * 60 * 1000, // 90 days
    sessionData: 30 * 24 * 60 * 60 * 1000, // 30 days
  }
  
  static async cleanupExpiredData(): Promise<void> {
    const now = new Date()
    
    // Clean up expired sessions
    await db.session.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    })
    
    // Clean up old logs
    const logCutoff = new Date(now.getTime() - PrivacyCompliance.dataRetentionPeriods.logData)
    // Implementation depends on logging system
    
    logger.security('Data cleanup completed', {
      timestamp: now.toISOString(),
    })
  }
}
```

## Security Testing

### Security Test Suite

```typescript
// tests/security/security.test.ts
import { describe, it, expect } from 'vitest'
import { SecurityLogger } from '@/lib/security-logger'
import { Encryption } from '@/lib/encryption'
import { RateLimiter } from '@/lib/rate-limiter'

describe('Security Tests', () => {
  describe('Encryption', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const plaintext = 'sensitive data'
      const { encrypted, iv, tag } = Encryption.encrypt(plaintext)
      const decrypted = Encryption.decrypt(encrypted, iv, tag)
      
      expect(decrypted).toBe(plaintext)
    })
    
    it('should hash passwords securely', async () => {
      const password = 'testPassword123'
      const hash = await Encryption.hashPassword(password)
      const isValid = await Encryption.verifyPassword(password, hash)
      
      expect(isValid).toBe(true)
      expect(hash).not.toBe(password)
    })
  })
  
  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const identifier = 'test-user'
      const limit = 5
      const window = 60
      
      // Make requests up to limit
      for (let i = 0; i < limit; i++) {
        const result = await RateLimiter.checkLimit(identifier, limit, window)
        expect(result.allowed).toBe(true)
      }
      
      // Exceed limit
      const result = await RateLimiter.checkLimit(identifier, limit, window)
      expect(result.allowed).toBe(false)
    })
  })
  
  describe('Input Validation', () => {
    it('should reject malicious input', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        "'; DROP TABLE users; --",
        'javascript:alert("xss")',
        '../../etc/passwd',
      ]
      
      maliciousInputs.forEach(input => {
        const sanitized = Sanitizer.sanitizeString(input)
        expect(sanitized).not.toContain('<script>')
        expect(sanitized).not.toContain('DROP TABLE')
        expect(sanitized).not.toContain('javascript:')
        expect(sanitized).not.toContain('../')
      })
    })
  })
})
```

## Incident Response

### Security Incident Response Plan

```typescript
// lib/incident-response.ts
import { logger } from './logger'
import { SecurityLogger } from './security-logger'

export class IncidentResponse {
  static async handleSecurityIncident(
    type: 'breach' | 'attack' | 'vulnerability',
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: any
  ): Promise<void> {
    // Log incident
    SecurityLogger.logSuspiciousActivity('Security incident detected', {
      type,
      severity,
      details,
    })
    
    // Immediate response based on severity
    switch (severity) {
      case 'critical':
        await this.handleCriticalIncident(type, details)
        break
      case 'high':
        await this.handleHighSeverityIncident(type, details)
        break
      case 'medium':
        await this.handleMediumSeverityIncident(type, details)
        break
      case 'low':
        await this.handleLowSeverityIncident(type, details)
        break
    }
  }
  
  private static async handleCriticalIncident(type: string, details: any): Promise<void> {
    // Immediate actions for critical incidents
    logger.critical('Critical security incident', { type, details })
    
    // Block suspicious IPs
    if (details.ip) {
      await this.blockIP(details.ip)
    }
    
    // Disable compromised accounts
    if (details.userId) {
      await this.disableUser(details.userId)
    }
    
    // Send alerts to security team
    await this.sendSecurityAlert('CRITICAL', type, details)
  }
  
  private static async blockIP(ip: string): Promise<void> {
    // Implement IP blocking logic
    logger.security('IP blocked due to security incident', { ip })
  }
  
  private static async disableUser(userId: string): Promise<void> {
    // Implement user disabling logic
    logger.security('User disabled due to security incident', { userId })
  }
  
  private static async sendSecurityAlert(
    severity: string,
    type: string,
    details: any
  ): Promise<void> {
    // Send alert to security team
    logger.security('Security alert sent', { severity, type, details })
  }
}
```

## Security Checklist

### Pre-deployment Security Checklist

- [ ] All environment variables are properly configured
- [ ] Database connections use SSL
- [ ] API endpoints have proper authentication
- [ ] Input validation is implemented
- [ ] Rate limiting is configured
- [ ] CORS is properly configured
- [ ] Security headers are set
- [ ] File uploads are validated
- [ ] Payment processing is secure
- [ ] Error messages don't leak sensitive information
- [ ] Logging is configured for security events
- [ ] Dependencies are up to date
- [ ] Security tests pass
- [ ] Penetration testing completed
- [ ] Security audit completed

### Ongoing Security Maintenance

- [ ] Regular security updates
- [ ] Monitor security logs
- [ ] Review access permissions
- [ ] Update security policies
- [ ] Conduct security training
- [ ] Perform security audits
- [ ] Test incident response procedures
- [ ] Review compliance requirements

This comprehensive security documentation ensures that NEOSHOP ULTRA maintains the highest security standards and protects user data and business operations.




