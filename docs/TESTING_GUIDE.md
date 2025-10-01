# NEOSHOP ULTRA - Testing Guide

## Overview

This guide covers comprehensive testing strategies for NEOSHOP ULTRA, including unit tests, integration tests, end-to-end tests, and performance testing.

## Testing Philosophy

### Testing Pyramid

```
                    E2E Tests
                   (Playwright)
                  /           \
                 /             \
            Integration Tests  \
           (Jest + Testing Library)
          /                     \
         /                       \
    Unit Tests                   \
   (Jest + Vitest)              \
```

### Testing Principles

1. **Test-Driven Development (TDD)**: Write tests before implementation
2. **Behavior-Driven Development (BDD)**: Focus on user behavior and outcomes
3. **Comprehensive Coverage**: Aim for 80%+ code coverage
4. **Fast Feedback**: Quick test execution for rapid development
5. **Reliable Tests**: Stable, deterministic tests that don't flake

## Testing Stack

### Core Testing Tools

- **Jest**: JavaScript testing framework
- **Vitest**: Fast unit testing with Vite
- **Testing Library**: React component testing utilities
- **Playwright**: End-to-end testing framework
- **MSW**: API mocking for integration tests
- **Supertest**: API endpoint testing

### Testing Utilities

- **Faker.js**: Generate fake data for tests
- **Factory Bot**: Test data factories
- **Mock Service Worker**: API mocking
- **Jest Mock**: Function and module mocking

## Unit Testing

### Setup

```bash
# Install testing dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Install test utilities
npm install -D @faker-js/faker @types/jest
```

### Configuration

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
        '**/*.config.*',
        '**/coverage/**'
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

### Test Setup

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/',
}))

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

// Mock Stripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    elements: vi.fn(() => ({
      create: vi.fn(),
      getElement: vi.fn(),
    })),
    confirmPayment: vi.fn(),
  })),
}))

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
```

### Component Testing

```typescript
// src/components/ProductCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductCard } from './ProductCard'
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
  updatedAt: new Date(),
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

  it('disables add to cart button when product is out of stock', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 }
    render(<ProductCard product={outOfStockProduct} />)
    
    const addToCartButton = screen.getByRole('button', { name: /add to cart/i })
    expect(addToCartButton).toBeDisabled()
  })
})
```

### Hook Testing

```typescript
// src/hooks/useCart.test.ts
import { renderHook, act } from '@testing-library/react'
import { useCart } from './useCart'
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
  updatedAt: new Date(),
}

describe('useCart', () => {
  it('should add item to cart', () => {
    const { result } = renderHook(() => useCart())
    
    act(() => {
      result.current.addItem(mockProduct, 2)
    })
    
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].product).toEqual(mockProduct)
    expect(result.current.items[0].quantity).toBe(2)
  })

  it('should update item quantity', () => {
    const { result } = renderHook(() => useCart())
    
    act(() => {
      result.current.addItem(mockProduct, 1)
      result.current.updateQuantity(mockProduct.id, 3)
    })
    
    expect(result.current.items[0].quantity).toBe(3)
  })

  it('should remove item from cart', () => {
    const { result } = renderHook(() => useCart())
    
    act(() => {
      result.current.addItem(mockProduct, 1)
      result.current.removeItem(mockProduct.id)
    })
    
    expect(result.current.items).toHaveLength(0)
  })

  it('should calculate total price correctly', () => {
    const { result } = renderHook(() => useCart())
    
    act(() => {
      result.current.addItem(mockProduct, 2)
    })
    
    expect(result.current.getTotalPrice()).toBe(199.98)
  })
})
```

### Utility Function Testing

```typescript
// src/lib/utils.test.ts
import { formatPrice, calculateTax, generateOrderNumber } from './utils'

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

describe('generateOrderNumber', () => {
  it('should generate unique order numbers', () => {
    const order1 = generateOrderNumber()
    const order2 = generateOrderNumber()
    
    expect(order1).toMatch(/^ORD-\d{6}$/)
    expect(order2).toMatch(/^ORD-\d{6}$/)
    expect(order1).not.toBe(order2)
  })
})
```

## Integration Testing

### API Testing

```typescript
// src/test/api/products.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/products/route'
import { db } from '@/lib/db-connection'

describe('/api/products', () => {
  beforeEach(async () => {
    // Setup test data
    await db.product.create({
      data: {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        imageUrl: ['https://example.com/image.jpg'],
        categoryId: 'test-category',
        stock: 10,
        sku: 'TEST-001',
      },
    })
  })

  afterEach(async () => {
    // Cleanup test data
    await db.product.deleteMany({
      where: { sku: 'TEST-001' },
    })
  })

  it('should return products list', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { page: '1', limit: '10' },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
    expect(data.data.products).toBeInstanceOf(Array)
  })

  it('should create new product', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: 'New Product',
        description: 'New Description',
        price: 149.99,
        imageUrl: ['https://example.com/new.jpg'],
        categoryId: 'test-category',
        stock: 5,
        sku: 'NEW-001',
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(201)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
    expect(data.data.product.name).toBe('New Product')
  })
})
```

### Database Testing

```typescript
// src/test/database/products.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from '@/lib/db-connection'
import { ProductService } from '@/lib/services/product-service'

describe('ProductService', () => {
  beforeEach(async () => {
    // Setup test database
    await db.product.deleteMany()
    await db.category.create({
      data: {
        id: 'test-category',
        name: 'Test Category',
        slug: 'test-category',
      },
    })
  })

  afterEach(async () => {
    // Cleanup test database
    await db.product.deleteMany()
    await db.category.deleteMany()
  })

  it('should create product with valid data', async () => {
    const productData = {
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      imageUrl: ['https://example.com/image.jpg'],
      categoryId: 'test-category',
      stock: 10,
      sku: 'TEST-001',
    }

    const product = await ProductService.createProduct(productData)

    expect(product).toBeDefined()
    expect(product.name).toBe('Test Product')
    expect(product.sku).toBe('TEST-001')
  })

  it('should throw error for invalid product data', async () => {
    const invalidProductData = {
      name: '', // Invalid: empty name
      description: 'Test Description',
      price: -10, // Invalid: negative price
      imageUrl: [],
      categoryId: 'test-category',
      stock: 10,
      sku: 'TEST-001',
    }

    await expect(ProductService.createProduct(invalidProductData))
      .rejects.toThrow('Validation failed')
  })

  it('should get products with pagination', async () => {
    // Create multiple products
    for (let i = 0; i < 25; i++) {
      await db.product.create({
        data: {
          name: `Product ${i}`,
          description: `Description ${i}`,
          price: 99.99 + i,
          imageUrl: [`https://example.com/image${i}.jpg`],
          categoryId: 'test-category',
          stock: 10,
          sku: `TEST-${i.toString().padStart(3, '0')}`,
        },
      })
    }

    const result = await ProductService.getProducts({ page: 1, limit: 10 })

    expect(result.products).toHaveLength(10)
    expect(result.pagination.total).toBe(25)
    expect(result.pagination.totalPages).toBe(3)
  })
})
```

### Authentication Testing

```typescript
// src/test/auth/auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserService } from '@/lib/services/user-service'

describe('Authentication', () => {
  beforeEach(async () => {
    // Setup test user
    await db.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedPassword',
        role: 'CUSTOMER',
      },
    })
  })

  it('should authenticate user with valid credentials', async () => {
    const result = await UserService.authenticateUser({
      email: 'test@example.com',
      password: 'password123',
    })

    expect(result.success).toBe(true)
    expect(result.user).toBeDefined()
    expect(result.user.email).toBe('test@example.com')
  })

  it('should reject user with invalid credentials', async () => {
    const result = await UserService.authenticateUser({
      email: 'test@example.com',
      password: 'wrongpassword',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid credentials')
  })

  it('should create user session', async () => {
    const user = await db.user.findUnique({
      where: { email: 'test@example.com' },
    })

    const session = await UserService.createSession(user!)

    expect(session).toBeDefined()
    expect(session.userId).toBe(user!.id)
    expect(session.token).toBeDefined()
  })
})
```

## End-to-End Testing

### Playwright Setup

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install
```

### Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### E2E Test Examples

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should sign in with valid credentials', async ({ page }) => {
    await page.goto('/auth/signin')
    
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="signin-button"]')
    
    await expect(page).toHaveURL('/')
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin')
    
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'wrongpassword')
    await page.click('[data-testid="signin-button"]')
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials')
  })

  test('should sign out successfully', async ({ page }) => {
    // Sign in first
    await page.goto('/auth/signin')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="signin-button"]')
    
    // Sign out
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="signout-button"]')
    
    await expect(page).toHaveURL('/')
    await expect(page.locator('[data-testid="signin-button"]')).toBeVisible()
  })
})
```

```typescript
// tests/e2e/shopping-cart.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Shopping Cart', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto('/auth/signin')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="signin-button"]')
  })

  test('should add product to cart', async ({ page }) => {
    await page.goto('/products')
    
    // Click on first product
    await page.click('[data-testid="product-card"]:first-child')
    
    // Add to cart
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Verify cart notification
    await expect(page.locator('[data-testid="cart-notification"]')).toBeVisible()
    
    // Check cart count
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1')
  })

  test('should update cart item quantity', async ({ page }) => {
    // Add item to cart first
    await page.goto('/products')
    await page.click('[data-testid="product-card"]:first-child')
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Open cart
    await page.click('[data-testid="cart-button"]')
    
    // Update quantity
    await page.fill('[data-testid="quantity-input"]', '3')
    
    // Verify total price updated
    await expect(page.locator('[data-testid="cart-total"]')).toContainText('$299.97')
  })

  test('should remove item from cart', async ({ page }) => {
    // Add item to cart first
    await page.goto('/products')
    await page.click('[data-testid="product-card"]:first-child')
    await page.click('[data-testid="add-to-cart-button"]')
    
    // Open cart
    await page.click('[data-testid="cart-button"]')
    
    // Remove item
    await page.click('[data-testid="remove-item-button"]')
    
    // Verify cart is empty
    await expect(page.locator('[data-testid="empty-cart"]')).toBeVisible()
  })
})
```

```typescript
// tests/e2e/checkout.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Checkout Process', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in and add items to cart
    await page.goto('/auth/signin')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="signin-button"]')
    
    await page.goto('/products')
    await page.click('[data-testid="product-card"]:first-child')
    await page.click('[data-testid="add-to-cart-button"]')
  })

  test('should complete checkout process', async ({ page }) => {
    await page.goto('/checkout')
    
    // Fill shipping information
    await page.fill('[data-testid="shipping-first-name"]', 'John')
    await page.fill('[data-testid="shipping-last-name"]', 'Doe')
    await page.fill('[data-testid="shipping-address"]', '123 Main St')
    await page.fill('[data-testid="shipping-city"]', 'New York')
    await page.fill('[data-testid="shipping-state"]', 'NY')
    await page.fill('[data-testid="shipping-zip"]', '10001')
    
    // Continue to payment
    await page.click('[data-testid="continue-to-payment"]')
    
    // Fill payment information (using test card)
    await page.fill('[data-testid="card-number"]', '4242424242424242')
    await page.fill('[data-testid="card-expiry"]', '12/25')
    await page.fill('[data-testid="card-cvc"]', '123')
    
    // Complete payment
    await page.click('[data-testid="complete-payment"]')
    
    // Verify success page
    await expect(page).toHaveURL(/\/payments\/success/)
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })

  test('should show validation errors for incomplete form', async ({ page }) => {
    await page.goto('/checkout')
    
    // Try to continue without filling required fields
    await page.click('[data-testid="continue-to-payment"]')
    
    // Verify validation errors
    await expect(page.locator('[data-testid="error-first-name"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-address"]')).toBeVisible()
  })
})
```

## Performance Testing

### Load Testing

```typescript
// tests/performance/load.test.ts
import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test('should load homepage within 2 seconds', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(2000)
  })

  test('should handle multiple concurrent users', async ({ browser }) => {
    const contexts = await Promise.all(
      Array.from({ length: 10 }, () => browser.newContext())
    )
    
    const pages = await Promise.all(
      contexts.map(context => context.newPage())
    )
    
    // Simulate concurrent users browsing products
    await Promise.all(
      pages.map(async (page, index) => {
        await page.goto(`/products?page=${index + 1}`)
        await page.waitForLoadState('networkidle')
      })
    )
    
    // Verify all pages loaded successfully
    for (const page of pages) {
      await expect(page.locator('[data-testid="products-list"]')).toBeVisible()
    }
    
    // Cleanup
    await Promise.all(contexts.map(context => context.close()))
  })
})
```

### API Performance Testing

```typescript
// tests/performance/api.test.ts
import { test, expect } from '@playwright/test'

test.describe('API Performance', () => {
  test('should respond to API calls within 500ms', async ({ request }) => {
    const startTime = Date.now()
    const response = await request.get('/api/products')
    const responseTime = Date.now() - startTime
    
    expect(response.status()).toBe(200)
    expect(responseTime).toBeLessThan(500)
  })

  test('should handle concurrent API requests', async ({ request }) => {
    const requests = Array.from({ length: 20 }, () =>
      request.get('/api/products')
    )
    
    const startTime = Date.now()
    const responses = await Promise.all(requests)
    const totalTime = Date.now() - startTime
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.status()).toBe(200)
    })
    
    // Total time should be reasonable
    expect(totalTime).toBeLessThan(2000)
  })
})
```

## Test Data Management

### Test Factories

```typescript
// src/test/factories/product.factory.ts
import { faker } from '@faker-js/faker'
import { Product } from '@/types'

export const createProduct = (overrides: Partial<Product> = {}): Product => ({
  id: faker.string.uuid(),
  name: faker.commerce.productName(),
  description: faker.commerce.productDescription(),
  price: parseFloat(faker.commerce.price()),
  imageUrl: [faker.image.url()],
  categoryId: faker.string.uuid(),
  stock: faker.number.int({ min: 0, max: 100 }),
  sku: faker.string.alphanumeric(8).toUpperCase(),
  isActive: true,
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
})

export const createProductList = (count: number): Product[] => {
  return Array.from({ length: count }, () => createProduct())
}
```

### Test Database Seeding

```typescript
// src/test/seed.ts
import { db } from '@/lib/db-connection'
import { createProduct, createUser } from './factories'

export async function seedTestDatabase() {
  // Create test categories
  const categories = await Promise.all([
    db.category.create({
      data: {
        id: 'electronics',
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and accessories',
      },
    }),
    db.category.create({
      data: {
        id: 'clothing',
        name: 'Clothing',
        slug: 'clothing',
        description: 'Fashion and apparel',
      },
    }),
  ])

  // Create test products
  const products = await Promise.all(
    Array.from({ length: 50 }, (_, index) =>
      db.product.create({
        data: {
          ...createProduct(),
          categoryId: categories[index % 2].id,
          sku: `TEST-${index.toString().padStart(3, '0')}`,
        },
      })
    )
  )

  // Create test users
  const users = await Promise.all(
    Array.from({ length: 10 }, () =>
      db.user.create({
        data: createUser(),
      })
    )
  )

  return { categories, products, users }
}

export async function cleanupTestDatabase() {
  await db.orderItem.deleteMany()
  await db.order.deleteMany()
  await db.cartItem.deleteMany()
  await db.cart.deleteMany()
  await db.review.deleteMany()
  await db.product.deleteMany()
  await db.category.deleteMany()
  await db.user.deleteMany()
}
```

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3

  integration-tests:
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
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Test Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --reporter=verbose",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:ci": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

## Best Practices

### Writing Effective Tests

1. **Arrange-Act-Assert Pattern**
   ```typescript
   test('should calculate total price correctly', () => {
     // Arrange
     const items = [
       { product: { price: 10 }, quantity: 2 },
       { product: { price: 15 }, quantity: 1 }
     ]
     
     // Act
     const total = calculateTotal(items)
     
     // Assert
     expect(total).toBe(35)
   })
   ```

2. **Descriptive Test Names**
   ```typescript
   // Good
   test('should throw validation error when email is invalid')
   
   // Bad
   test('email test')
   ```

3. **Test One Thing at a Time**
   ```typescript
   // Good - separate tests
   test('should add item to cart')
   test('should update item quantity')
   test('should remove item from cart')
   
   // Bad - testing multiple things
   test('should manage cart items')
   ```

### Test Organization

```
tests/
├── unit/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── services/
├── integration/
│   ├── api/
│   ├── database/
│   └── auth/
├── e2e/
│   ├── auth.spec.ts
│   ├── shopping-cart.spec.ts
│   └── checkout.spec.ts
├── performance/
│   ├── load.test.ts
│   └── api.test.ts
├── factories/
│   ├── product.factory.ts
│   └── user.factory.ts
└── helpers/
    ├── test-setup.ts
    └── mock-data.ts
```

### Mocking Strategies

1. **Mock External Dependencies**
   ```typescript
   // Mock Stripe
   vi.mock('@stripe/stripe-js', () => ({
     loadStripe: vi.fn(() => Promise.resolve({
       elements: vi.fn(),
       confirmPayment: vi.fn(),
     })),
   }))
   ```

2. **Mock API Calls**
   ```typescript
   // Mock fetch
   global.fetch = vi.fn(() =>
     Promise.resolve({
       ok: true,
       json: () => Promise.resolve({ data: 'test' }),
     })
   )
   ```

3. **Mock Database**
   ```typescript
   // Mock Prisma
   vi.mock('@/lib/db-connection', () => ({
     db: {
       product: {
         findMany: vi.fn(),
         create: vi.fn(),
       },
     },
   }))
   ```

## Debugging Tests

### Debugging Unit Tests

```typescript
// Add debug statements
test('should process payment', () => {
  const paymentData = { amount: 100, currency: 'USD' }
  
  console.log('Payment data:', paymentData)
  const result = processPayment(paymentData)
  console.log('Result:', result)
  
  expect(result.success).toBe(true)
})
```

### Debugging E2E Tests

```typescript
// Add debugging to Playwright tests
test('should complete checkout', async ({ page }) => {
  await page.goto('/checkout')
  
  // Pause execution
  await page.pause()
  
  // Take screenshot
  await page.screenshot({ path: 'debug-checkout.png' })
  
  // Log console messages
  page.on('console', msg => console.log('PAGE LOG:', msg.text()))
})
```

## Coverage and Metrics

### Coverage Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'src/types/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
})
```

### Quality Gates

```yaml
# .github/workflows/quality-gate.yml
name: Quality Gate

on:
  pull_request:
    branches: [main]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run test:coverage
      - run: npm run type-check
      
      - name: Check coverage threshold
        run: |
          if [ $(cat coverage/coverage-summary.json | jq '.total.lines.pct') -lt 80 ]; then
            echo "Coverage below 80%"
            exit 1
          fi
```

This comprehensive testing guide ensures that NEOSHOP ULTRA maintains high quality, reliability, and performance across all components and user interactions.




