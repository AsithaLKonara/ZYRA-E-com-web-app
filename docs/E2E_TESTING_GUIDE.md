# E2E Testing Guide - NEOSHOP ULTRA

## Overview

This guide provides comprehensive information about the End-to-End (E2E) testing suite for NEOSHOP ULTRA. Our E2E tests ensure that all critical user journeys and system integrations work correctly across different browsers and devices.

## Test Structure

### Test Suites

1. **Comprehensive Tests** (`tests/e2e/comprehensive.spec.ts`)
   - Complete user journeys
   - Critical business flows
   - Integration testing

2. **API Tests** (`tests/e2e/api.spec.ts`)
   - API endpoint validation
   - Request/response testing
   - Error handling

3. **Performance Tests** (`tests/e2e/performance.spec.ts`)
   - Page load times
   - Core Web Vitals
   - Performance budgets

4. **Security Tests** (`tests/e2e/security.spec.ts`)
   - Authentication flows
   - Authorization checks
   - Security vulnerabilities

5. **Accessibility Tests** (`tests/e2e/accessibility.spec.ts`)
   - WCAG compliance
   - Screen reader support
   - Keyboard navigation

6. **PWA Tests** (`tests/e2e/pwa.spec.ts`)
   - Service worker functionality
   - Offline support
   - App installation

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Basic Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suite
npm run test:e2e:comprehensive
npm run test:e2e:api
npm run test:e2e:performance
npm run test:e2e:security
npm run test:e2e:accessibility
npm run test:e2e:pwa

# Run with UI mode
npm run test:e2e:ui

# Run in headed mode
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug
```

### Comprehensive Testing

```bash
# Run comprehensive test suite with reporting
npm run test:e2e:comprehensive

# Generate detailed test report
npm run test:e2e:report
```

## Test Configuration

### Environment Variables

```bash
# Test environment
E2E_BASE_URL=http://localhost:3000
E2E_API_BASE_URL=http://localhost:3000/api

# Test data
E2E_ADMIN_EMAIL=admin@neoshop.com
E2E_ADMIN_PASSWORD=admin123
E2E_CUSTOMER_EMAIL=customer@neoshop.com
E2E_CUSTOMER_PASSWORD=customer123
```

### Browser Support

- **Chromium**: Primary browser for testing
- **Firefox**: Cross-browser compatibility
- **WebKit**: Safari compatibility
- **Mobile**: Responsive design testing

### Test Data

Test data is managed through the `test-config.ts` file:

```typescript
export const testConfig = {
  testData: {
    users: {
      admin: { email: 'admin@neoshop.com', password: 'admin123' },
      customer: { email: 'customer@neoshop.com', password: 'customer123' }
    },
    products: {
      sample: { name: 'Test Product', price: 99.99 }
    }
  }
}
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test'
import { TestUtils } from './test-utils'

test.describe('Feature Testing', () => {
  let utils: TestUtils

  test.beforeEach(async ({ page }) => {
    utils = new TestUtils(page)
  })

  test('should perform user action', async () => {
    await utils.loginAsCustomer()
    await utils.addProductToCart()
    await expect(utils.page.locator('[data-testid="cart-count"]')).toHaveText('1')
  })
})
```

### Test Utilities

The `TestUtils` class provides helper methods:

```typescript
// Authentication
await utils.loginAsAdmin()
await utils.loginAsCustomer()
await utils.logout()

// Navigation
await utils.navigateToProducts()
await utils.navigateToCart()
await utils.navigateToCheckout()

// Product operations
await utils.addProductToCart()
await utils.searchProducts('laptop')

// Cart operations
await utils.getCartItemCount()
await utils.updateCartItemQuantity(0, 2)
await utils.removeCartItem(0)

// API operations
await utils.makeApiRequest('/products')
await utils.makeApiPost('/cart', { productId: 1, quantity: 1 })

// Performance testing
await utils.measurePageLoadTime()
await utils.getPerformanceMetrics()

// Accessibility testing
await utils.checkAccessibility()

// Security testing
await utils.testXSSProtection('<script>alert("xss")</script>')
await utils.testSQLInjection("' OR '1'='1")

// PWA testing
await utils.checkServiceWorker()
await utils.checkManifest()
await utils.checkOfflineSupport()
```

## Test Scenarios

### Critical User Journeys

1. **User Registration & Login**
   - New user registration
   - Email verification
   - Login with valid credentials
   - Login with invalid credentials
   - Password reset

2. **Product Browsing**
   - View product catalog
   - Search products
   - Filter by category
   - Sort products
   - View product details

3. **Shopping Cart**
   - Add products to cart
   - Update quantities
   - Remove items
   - Apply discounts
   - Calculate totals

4. **Checkout Process**
   - Fill shipping information
   - Select payment method
   - Process payment
   - Order confirmation
   - Email notifications

5. **User Account**
   - View order history
   - Update profile
   - Manage addresses
   - View wishlist

### API Testing

1. **Authentication APIs**
   - POST /api/auth/register
   - POST /api/auth/signin
   - POST /api/auth/signout
   - POST /api/auth/forgot-password

2. **Product APIs**
   - GET /api/products
   - GET /api/products/:id
   - POST /api/admin/products
   - PUT /api/admin/products/:id
   - DELETE /api/admin/products/:id

3. **Cart APIs**
   - GET /api/cart
   - POST /api/cart
   - PUT /api/cart/:id
   - DELETE /api/cart/:id

4. **Order APIs**
   - GET /api/orders
   - POST /api/orders
   - GET /api/orders/:id
   - PUT /api/orders/:id

### Performance Testing

1. **Page Load Performance**
   - Homepage load time
   - Product page load time
   - Checkout page load time
   - Admin dashboard load time

2. **Core Web Vitals**
   - Largest Contentful Paint (LCP)
   - First Input Delay (FID)
   - Cumulative Layout Shift (CLS)

3. **API Performance**
   - Response times
   - Throughput
   - Error rates

### Security Testing

1. **Authentication Security**
   - Brute force protection
   - Session management
   - Password requirements

2. **Input Validation**
   - XSS prevention
   - SQL injection prevention
   - CSRF protection

3. **Authorization**
   - Role-based access control
   - API endpoint protection
   - Admin-only features

### Accessibility Testing

1. **WCAG Compliance**
   - Color contrast ratios
   - Keyboard navigation
   - Screen reader support

2. **Form Accessibility**
   - Label associations
   - Error messaging
   - Required field indicators

3. **Navigation Accessibility**
   - Focus management
   - Skip links
   - ARIA landmarks

### PWA Testing

1. **Service Worker**
   - Registration
   - Caching strategies
   - Offline functionality

2. **Manifest**
   - Valid manifest.json
   - Icon requirements
   - Display modes

3. **Installation**
   - Install prompt
   - App shortcuts
   - Splash screen

## Best Practices

### Test Organization

1. **Group related tests** using `test.describe()`
2. **Use descriptive test names** that explain the scenario
3. **Keep tests independent** - each test should be able to run alone
4. **Use data-testid attributes** for reliable element selection

### Test Data Management

1. **Use test-specific data** to avoid conflicts
2. **Clean up after tests** to maintain test isolation
3. **Use factories** for creating test data
4. **Mock external services** when appropriate

### Performance Considerations

1. **Run tests in parallel** when possible
2. **Use headless mode** for faster execution
3. **Optimize test data** to reduce setup time
4. **Monitor test execution time** and optimize slow tests

### Error Handling

1. **Use proper assertions** with meaningful error messages
2. **Handle async operations** correctly
3. **Take screenshots** on test failures
4. **Log relevant information** for debugging

## Debugging Tests

### Debug Mode

```bash
# Run tests in debug mode
npm run test:e2e:debug

# Run specific test in debug mode
npx playwright test tests/e2e/comprehensive.spec.ts --debug
```

### Screenshots and Videos

```bash
# Enable screenshots on failure
npx playwright test --screenshot=only-on-failure

# Enable video recording
npx playwright test --video=on
```

### Trace Files

```bash
# Enable trace recording
npx playwright test --trace=on

# View trace files
npx playwright show-trace trace.zip
```

## Continuous Integration

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx playwright install
      - run: npm run test:e2e
```

### Test Reports

```bash
# Generate comprehensive test report
npm run test:e2e:report

# View HTML report
open test-results/e2e-report.html
```

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout values
   - Check for slow operations
   - Verify element selectors

2. **Element not found**
   - Use data-testid attributes
   - Wait for elements to be visible
   - Check for dynamic content

3. **Flaky tests**
   - Add proper waits
   - Use stable selectors
   - Avoid hardcoded delays

4. **Performance issues**
   - Run tests in headless mode
   - Use parallel execution
   - Optimize test data

### Getting Help

1. **Check test logs** for error messages
2. **Review test reports** for detailed information
3. **Use debug mode** to step through tests
4. **Consult documentation** for API references

## Maintenance

### Regular Tasks

1. **Update test data** as the application evolves
2. **Review test coverage** and add missing scenarios
3. **Optimize slow tests** for better performance
4. **Update dependencies** to latest versions

### Test Review Process

1. **Code review** for new tests
2. **Performance monitoring** of test execution
3. **Coverage analysis** to identify gaps
4. **Regular maintenance** of test infrastructure

---

For more information, see the [Testing Documentation](../TESTING_GUIDE.md) or contact the development team.




