# NEOSHOP ULTRA - Development Guide

## Overview

This comprehensive development guide provides detailed information for developers working on NEOSHOP ULTRA, including setup instructions, development workflows, coding standards, and best practices.

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Database Development](#database-development)
7. [API Development](#api-development)
8. [Frontend Development](#frontend-development)
9. [Performance Optimization](#performance-optimization)
10. [Security Guidelines](#security-guidelines)
11. [Debugging and Troubleshooting](#debugging-and-troubleshooting)
12. [Deployment and CI/CD](#deployment-and-cicd)

## Development Environment Setup

### Prerequisites

Before starting development, ensure you have:

- **Node.js 18+** installed
- **Git** for version control
- **PostgreSQL 13+** for database
- **Redis 6+** for caching (optional)
- **VS Code** or preferred editor
- **Docker** (optional, for containerized development)

### Initial Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/neoshop-ultra/neoshop-ultra.git
   cd neoshop-ultra
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database**:
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

### VS Code Configuration

#### Recommended Extensions

Install these VS Code extensions for the best development experience:

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "prisma.prisma",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

#### Workspace Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

### Docker Development

#### Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/neoshop_ultra
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: neoshop_ultra
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

#### Docker Commands

```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f app

# Execute commands in container
docker-compose exec app npm run test

# Stop environment
docker-compose down
```

## Project Structure

### Directory Layout

```
neoshop-ultra/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Route groups
│   ├── (dashboard)/             # Dashboard routes
│   ├── api/                     # API routes
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── components/                   # Reusable components
│   ├── auth/                    # Authentication components
│   ├── cart/                    # Shopping cart components
│   ├── payments/                # Payment components
│   ├── admin/                   # Admin components
│   └── ui/                      # Base UI components
├── lib/                         # Utility libraries
│   ├── auth.ts                  # NextAuth configuration
│   ├── db.ts                    # Database connection
│   ├── stripe.ts                # Stripe integration
│   ├── validation.ts            # Input validation
│   └── utils.ts                 # General utilities
├── hooks/                       # Custom React hooks
├── types/                       # TypeScript type definitions
├── prisma/                      # Database schema and migrations
├── public/                      # Static assets
├── styles/                      # Global styles
├── test/                        # Test files
├── docs/                        # Documentation
├── scripts/                     # Build and deployment scripts
└── config/                      # Configuration files
```

### File Naming Conventions

- **Components**: PascalCase (e.g., `ProductCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Utilities**: camelCase (e.g., `formatPrice.ts`)
- **Types**: PascalCase (e.g., `User.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)
- **API routes**: kebab-case (e.g., `create-order/route.ts`)

### Import Organization

```typescript
// 1. React and Next.js imports
import React from 'react'
import { NextRequest, NextResponse } from 'next/server'

// 2. Third-party library imports
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

// 3. Internal imports (absolute paths)
import { db } from '@/lib/db'
import { User } from '@/types'

// 4. Internal imports (relative paths)
import { formatPrice } from './utils'
import { ProductCard } from './ProductCard'
```

## Development Workflow

### Git Workflow

#### Branch Strategy

- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/**: Feature development branches
- **hotfix/**: Critical bug fixes
- **release/**: Release preparation branches

#### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(auth): add OAuth provider support
fix(payment): resolve Stripe webhook validation
docs(api): update endpoint documentation
test(cart): add unit tests for cart functionality
```

#### Pull Request Process

1. **Create feature branch**:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and commit**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   # Create pull request on GitHub
   ```

4. **Code review and merge**:
   - Ensure all checks pass
   - Get approval from reviewers
   - Merge to develop branch

### Development Scripts

#### Available Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "analyze": "cross-env ANALYZE=true next build"
  }
}
```

#### Development Commands

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Check types
npm run type-check

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

### Code Quality

#### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ],
    "*.{json,md}": [
      "prettier --write",
      "git add"
    ]
  }
}
```

#### Quality Gates

- All tests must pass
- Code coverage must be above 80%
- No ESLint errors
- TypeScript compilation must succeed
- All security checks must pass

## Coding Standards

### TypeScript Guidelines

#### Type Definitions

```typescript
// Use interfaces for object shapes
interface User {
  id: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Use enums for constants
enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR'
}

// Use type aliases for unions
type Status = 'pending' | 'processing' | 'completed' | 'cancelled'

// Use generics for reusable types
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}
```

#### Function Definitions

```typescript
// Use explicit return types for public functions
export function calculateTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.price * item.quantity, 0)
}

// Use async/await for asynchronous operations
export async function fetchUser(id: string): Promise<User | null> {
  try {
    const user = await db.user.findUnique({ where: { id } })
    return user
  } catch (error) {
    logger.error('Failed to fetch user:', error)
    return null
  }
}

// Use proper error handling
export async function createOrder(orderData: CreateOrderData): Promise<Order> {
  try {
    const order = await db.order.create({ data: orderData })
    return order
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Error('Database error occurred')
    }
    throw error
  }
}
```

### React Guidelines

#### Component Structure

```typescript
// components/ProductCard.tsx
import React from 'react'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
  className?: string
}

export function ProductCard({ 
  product, 
  onAddToCart, 
  className 
}: ProductCardProps) {
  const handleAddToCart = () => {
    onAddToCart?.(product)
  }

  return (
    <div className={cn('product-card', className)}>
      <img 
        src={product.imageUrl[0]} 
        alt={product.name}
        className="product-image"
      />
      <h3 className="product-name">{product.name}</h3>
      <p className="product-price">${product.price}</p>
      <button 
        onClick={handleAddToCart}
        className="add-to-cart-button"
      >
        Add to Cart
      </button>
    </div>
  )
}
```

#### Hook Usage

```typescript
// hooks/useAuth.ts
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  return {
    user: session?.user,
    isAuthenticated: !!session,
    isLoading: status === 'loading'
  }
}
```

### API Development

#### Route Handler Structure

```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { withValidation } from '@/lib/api-validation'
import { productSchema } from '@/lib/validation'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

// GET /api/products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const products = await db.product.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: { isActive: true },
      include: { category: true }
    })

    return NextResponse.json({
      success: true,
      data: { products }
    })
  } catch (error) {
    logger.error('Failed to fetch products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/products
export const POST = withAuth(
  withValidation(productSchema)(async (request: NextRequest) => {
    try {
      const productData = (request as any).validatedData
      
      const product = await db.product.create({
        data: productData
      })

      logger.info('Product created:', { productId: product.id })

      return NextResponse.json({
        success: true,
        data: { product }
      }, { status: 201 })
    } catch (error) {
      logger.error('Failed to create product:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create product' },
        { status: 500 }
      )
    }
  })
)
```

#### Middleware Usage

```typescript
// lib/api-validation.ts
import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema } from 'zod'

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
          return NextResponse.json({
            success: false,
            error: 'Validation failed',
            details: error.errors
          }, { status: 400 })
        }
        throw error
      }
    }
  }
}
```

## Testing Guidelines

### Test Structure

#### Unit Tests

```typescript
// test/utils.test.ts
import { describe, it, expect } from 'vitest'
import { formatPrice, calculateTax } from '@/lib/utils'

describe('formatPrice', () => {
  it('should format price correctly', () => {
    expect(formatPrice(99.99)).toBe('$99.99')
    expect(formatPrice(0)).toBe('$0.00')
    expect(formatPrice(1000)).toBe('$1,000.00')
  })
})

describe('calculateTax', () => {
  it('should calculate tax correctly', () => {
    expect(calculateTax(100, 0.08)).toBe(8)
    expect(calculateTax(0, 0.08)).toBe(0)
    expect(calculateTax(50.50, 0.10)).toBe(5.05)
  })
})
```

#### Component Tests

```typescript
// test/components/ProductCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductCard } from '@/components/ProductCard'
import { Product } from '@/types'

const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  description: 'Test Description',
  price: 99.99,
  imageUrl: ['https://example.com/image.jpg'],
  categoryId: '1',
  stock: 10,
  sku: 'TEST-001',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
}

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />)
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('$99.99')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('calls onAddToCart when add to cart button is clicked', () => {
    const onAddToCart = vi.fn()
    render(<ProductCard product={mockProduct} onAddToCart={onAddToCart} />)
    
    const addToCartButton = screen.getByRole('button', { name: /add to cart/i })
    fireEvent.click(addToCartButton)
    
    expect(onAddToCart).toHaveBeenCalledWith(mockProduct)
  })
})
```

#### API Tests

```typescript
// test/api/products.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/products/route'

describe('/api/products', () => {
  beforeEach(async () => {
    // Setup test data
  })

  afterEach(async () => {
    // Cleanup test data
  })

  it('should return products list', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { page: '1', limit: '10' }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
    expect(data.data.products).toBeInstanceOf(Array)
  })
})
```

### Test Configuration

#### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

#### Test Setup

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn()
  })
}))

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated'
  })
}))
```

## Database Development

### Schema Design

#### Entity Relationships

```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  password  String?
  role      UserRole @default(CUSTOMER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  orders    Order[]
  reviews   Review[]
  cart      Cart?
  sessions  Session[]

  @@map("users")
}

model Product {
  id          String   @id @default(uuid())
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  imageUrl    String[]
  categoryId  String
  stock       Int      @default(0)
  sku         String?  @unique
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  category    Category @relation(fields: [categoryId], references: [id])
  orderItems  OrderItem[]
  cartItems   CartItem[]
  reviews     Review[]

  @@map("products")
}
```

#### Indexes and Constraints

```prisma
model Product {
  // ... fields

  @@index([categoryId])
  @@index([isActive])
  @@index([price])
  @@index([createdAt])
  @@map("products")
}

model Order {
  // ... fields

  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@unique([orderNumber])
  @@map("orders")
}
```

### Migration Management

#### Creating Migrations

```bash
# Create a new migration
npx prisma migrate dev --name add_product_indexes

# Reset database and apply all migrations
npx prisma migrate reset

# Deploy migrations to production
npx prisma migrate deploy
```

#### Migration Best Practices

- Always review generated migrations
- Test migrations on a copy of production data
- Use descriptive migration names
- Never edit existing migrations
- Use `db push` for development, `migrate` for production

### Query Optimization

#### Efficient Queries

```typescript
// Good: Use select to limit fields
const products = await db.product.findMany({
  select: {
    id: true,
    name: true,
    price: true,
    imageUrl: true,
    category: {
      select: {
        name: true,
        slug: true
      }
    }
  }
})

// Good: Use pagination
const products = await db.product.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' }
})

// Good: Use proper indexing
const products = await db.product.findMany({
  where: {
    categoryId: categoryId,
    isActive: true
  }
})
```

#### Avoiding N+1 Queries

```typescript
// Bad: N+1 query problem
const orders = await db.order.findMany()
for (const order of orders) {
  const items = await db.orderItem.findMany({
    where: { orderId: order.id },
    include: { product: true }
  })
}

// Good: Single query with include
const orders = await db.order.findMany({
  include: {
    items: {
      include: {
        product: true
      }
    }
  }
})
```

## Frontend Development

### Component Development

#### Component Architecture

```typescript
// components/ProductList.tsx
import React from 'react'
import { ProductCard } from './ProductCard'
import { Product } from '@/types'

interface ProductListProps {
  products: Product[]
  onAddToCart: (product: Product) => void
  loading?: boolean
}

export function ProductList({ products, onAddToCart, loading }: ProductListProps) {
  if (loading) {
    return <ProductListSkeleton />
  }

  if (products.length === 0) {
    return <EmptyState message="No products found" />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  )
}
```

#### State Management

```typescript
// lib/cart-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartStore {
  items: CartItem[]
  addItem: (product: Product, quantity: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, quantity) => set((state) => {
        const existingItem = state.items.find(item => item.productId === product.id)
        if (existingItem) {
          return {
            items: state.items.map(item =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          }
        }
        return {
          items: [...state.items, { id: crypto.randomUUID(), productId: product.id, product, quantity }]
        }
      }),
      
      removeItem: (productId) => set((state) => ({
        items: state.items.filter(item => item.productId !== productId)
      })),
      
      updateQuantity: (productId, quantity) => set((state) => ({
        items: state.items.map(item =>
          item.productId === productId
            ? { ...item, quantity }
            : item
        ).filter(item => item.quantity > 0)
      })),
      
      clearCart: () => set({ items: [] }),
      
      getTotalPrice: () => {
        const { items } = get()
        return items.reduce((total, item) => total + item.product.price * item.quantity, 0)
      }
    }),
    {
      name: 'cart-storage'
    }
  )
)
```

### Styling Guidelines

#### Tailwind CSS Usage

```typescript
// Use utility classes for styling
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-semibold text-gray-900">Product Title</h2>
  <span className="text-lg font-bold text-blue-600">$99.99</span>
</div>

// Use responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>

// Use dark mode support
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  {/* Content */}
</div>
```

#### Component Styling

```typescript
// Use CSS modules for complex styling
import styles from './ProductCard.module.css'

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className={styles.card}>
      <img src={product.imageUrl[0]} alt={product.name} className={styles.image} />
      <h3 className={styles.title}>{product.name}</h3>
      <p className={styles.price}>${product.price}</p>
    </div>
  )
}
```

## Performance Optimization

### Code Splitting

#### Dynamic Imports

```typescript
// Use dynamic imports for heavy components
import dynamic from 'next/dynamic'

const AdminDashboard = dynamic(() => import('@/components/admin/Dashboard'), {
  loading: () => <LoadingSpinner />,
  ssr: false
})

const PaymentForm = dynamic(() => import('@/components/payments/PaymentForm'), {
  loading: () => <PaymentFormSkeleton />
})
```

#### Route-based Splitting

```typescript
// Use Next.js automatic code splitting
// Each page is automatically split into its own bundle
export default function ProductPage() {
  return <ProductPageContent />
}
```

### Image Optimization

#### Next.js Image Component

```typescript
import Image from 'next/image'

export function ProductImage({ src, alt, width, height }: ProductImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={false}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
      className="product-image"
    />
  )
}
```

### Caching Strategies

#### API Response Caching

```typescript
// lib/cache.ts
import { Redis } from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!)

export class CacheManager {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }
  
  static async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }
}

// Usage in API routes
export async function GET(request: NextRequest) {
  const cacheKey = 'products:featured'
  const cached = await CacheManager.get(cacheKey)
  
  if (cached) {
    return NextResponse.json({ success: true, data: cached, cached: true })
  }
  
  const products = await db.product.findMany({
    where: { isActive: true },
    take: 10
  })
  
  await CacheManager.set(cacheKey, products, 1800) // 30 minutes
  
  return NextResponse.json({ success: true, data: products })
}
```

## Security Guidelines

### Input Validation

#### Zod Schemas

```typescript
// lib/validation.ts
import { z } from 'zod'

export const userSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase(),
  password: z.string()
    .min(8)
    .max(128)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  role: z.enum(['CUSTOMER', 'ADMIN', 'MODERATOR']).optional()
})

export const productSchema = z.object({
  name: z.string().min(3).max(200).trim(),
  description: z.string().min(10).max(5000).trim(),
  price: z.number().positive().max(999999.99),
  imageUrl: z.array(z.string().url()).min(1).max(10),
  categoryId: z.string().uuid(),
  stock: z.number().int().min(0).max(999999),
  sku: z.string().min(3).max(50).regex(/^[A-Z0-9-_]+$/),
  isActive: z.boolean().optional()
})
```

#### Input Sanitization

```typescript
// lib/sanitization.ts
import DOMPurify from 'dompurify'

export class Sanitizer {
  static sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    })
  }
  
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
  }
}
```

### Authentication Security

#### JWT Security

```typescript
// lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
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
    }
  }
}
```

#### Rate Limiting

```typescript
// lib/rate-limiter.ts
import { Redis } from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!)

export class RateLimiter {
  static async checkLimit(
    identifier: string,
    limit: number,
    window: number
  ): Promise<{ allowed: boolean; remaining: number }> {
    const key = `rate_limit:${identifier}`
    const current = await redis.incr(key)
    
    if (current === 1) {
      await redis.expire(key, window)
    }
    
    const allowed = current <= limit
    const remaining = Math.max(0, limit - current)
    
    return { allowed, remaining }
  }
}
```

## Debugging and Troubleshooting

### Development Tools

#### Chrome DevTools

```bash
# Enable debugging
node --inspect npm run dev

# Open Chrome DevTools
# Go to chrome://inspect
# Click "Open dedicated DevTools for Node"
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

### Logging

#### Structured Logging

```typescript
// lib/logger.ts
import { logger } from './logger'

// Use structured logging
logger.info('User logged in', { userId: user.id, email: user.email })
logger.error('Database error', { error: error.message, query: query })
logger.warn('Rate limit exceeded', { ip: request.ip, endpoint: endpoint })
```

#### Error Tracking

```typescript
// lib/error-tracking.ts
import * as Sentry from '@sentry/nextjs'

export function trackError(error: Error, context?: any) {
  Sentry.captureException(error, {
    tags: {
      component: 'api'
    },
    extra: context
  })
}
```

## Deployment and CI/CD

### GitHub Actions

#### CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run test:e2e
```

#### CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### Environment Management

#### Environment Variables

```bash
# .env.local (development)
DATABASE_URL="postgresql://username:password@localhost:5432/neoshop_ultra"
NEXTAUTH_SECRET="development-secret"
STRIPE_SECRET_KEY="sk_test_..."
RESEND_API_KEY="re_..."

# .env.production (production)
DATABASE_URL="postgresql://username:password@prod-host:5432/neoshop_ultra"
NEXTAUTH_SECRET="production-secret"
STRIPE_SECRET_KEY="sk_live_..."
RESEND_API_KEY="re_..."
```

#### Configuration Management

```typescript
// lib/config.ts
export const config = {
  database: {
    url: process.env.DATABASE_URL!,
    ssl: process.env.NODE_ENV === 'production'
  },
  auth: {
    secret: process.env.NEXTAUTH_SECRET!,
    url: process.env.NEXTAUTH_URL!
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!
  }
}
```

---

**Last Updated**: January 2024  
**Version**: 1.0

This development guide provides comprehensive information for developers working on NEOSHOP ULTRA. Follow these guidelines to ensure consistent, high-quality code and smooth development workflows. 🚀




