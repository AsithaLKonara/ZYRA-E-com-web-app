import { test, expect, Page } from '@playwright/test'

test.describe('Security Testing - NEOSHOP ULTRA', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
  })

  test.describe('Authentication Security', () => {
    test('should prevent unauthorized access to protected routes', async () => {
      // Try to access admin dashboard without authentication
      await page.goto('/admin')
      
      // Should redirect to login or show unauthorized message
      const currentUrl = page.url()
      expect(currentUrl).toMatch(/\/auth\/signin|\/unauthorized/)
    })

    test('should prevent SQL injection in login form', async () => {
      await page.goto('/auth/signin')
      
      // Try SQL injection in email field
      await page.fill('input[type="email"]', "admin'; DROP TABLE users; --")
      await page.fill('input[type="password"]', 'password')
      await page.click('button[type="submit"]')
      
      // Should not crash or show database errors
      await expect(page.locator('body')).toBeVisible()
    })

    test('should prevent XSS attacks in search', async () => {
      await page.goto('/search')
      
      // Try XSS in search input
      const xssPayload = '<script>alert("XSS")</script>'
      await page.fill('input[type="search"]', xssPayload)
      await page.press('input[type="search"]', 'Enter')
      
      // Should not execute script
      const alertHandled = await page.evaluate(() => {
        return new Promise((resolve) => {
          window.addEventListener('alert', () => resolve(true))
          setTimeout(() => resolve(false), 1000)
        })
      })
      
      expect(alertHandled).toBe(false)
    })

    test('should validate input properly', async () => {
      await page.goto('/auth/signup')
      
      // Try to submit with invalid data
      await page.fill('input[name="name"]', '')
      await page.fill('input[type="email"]', 'invalid-email')
      await page.fill('input[type="password"]', '123')
      await page.click('button[type="submit"]')
      
      // Should show validation errors
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    })

    test('should handle session timeout properly', async () => {
      // Login first
      await page.goto('/auth/signin')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      // Simulate session timeout by clearing cookies
      await page.context().clearCookies()
      
      // Try to access protected route
      await page.goto('/profile')
      
      // Should redirect to login
      expect(page.url()).toMatch(/\/auth\/signin/)
    })
  })

  test.describe('API Security', () => {
    test('should require authentication for protected endpoints', async () => {
      // Try to access cart without authentication
      const response = await page.request.get('/api/cart')
      expect(response.status()).toBe(401)
    })

    test('should validate API input', async () => {
      // Try to create order with invalid data
      const response = await page.request.post('/api/orders', {
        data: {
          // Missing required fields
        }
      })
      
      expect(response.status()).toBe(400)
    })

    test('should prevent CSRF attacks', async () => {
      // Try to make request without CSRF token
      const response = await page.request.post('/api/orders', {
        data: {
          items: [],
          totalAmount: 0
        }
      })
      
      // Should reject request
      expect([400, 403]).toContain(response.status())
    })

    test('should rate limit API requests', async () => {
      // Make multiple requests quickly
      const promises = Array(20).fill(0).map(() => 
        page.request.get('/api/products')
      )
      
      const responses = await Promise.all(promises)
      const rateLimited = responses.filter(r => r.status() === 429)
      
      // Some requests should be rate limited
      expect(rateLimited.length).toBeGreaterThan(0)
    })

    test('should sanitize API responses', async () => {
      const response = await page.request.get('/api/products')
      const data = await response.json()
      
      // Check that no sensitive data is exposed
      if (data.products && data.products.length > 0) {
        const product = data.products[0]
        expect(product).not.toHaveProperty('password')
        expect(product).not.toHaveProperty('secret')
        expect(product).not.toHaveProperty('token')
      }
    })
  })

  test.describe('File Upload Security', () => {
    test('should validate file types', async () => {
      // This would require a file upload form
      // For now, we'll test the API endpoint
      const response = await page.request.post('/api/upload', {
        data: {
          file: 'malicious.exe'
        }
      })
      
      expect([400, 415]).toContain(response.status())
    })

    test('should prevent malicious file uploads', async () => {
      // Try to upload a file with malicious content
      const response = await page.request.post('/api/upload', {
        data: {
          file: 'script.js',
          content: '<script>alert("XSS")</script>'
        }
      })
      
      expect([400, 415]).toContain(response.status())
    })
  })

  test.describe('Headers Security', () => {
    test('should include security headers', async () => {
      const response = await page.request.get('/')
      
      expect(response.headers()['x-content-type-options']).toBe('nosniff')
      expect(response.headers()['x-frame-options']).toBe('DENY')
      expect(response.headers()['x-xss-protection']).toBe('1; mode=block')
      expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin')
    })

    test('should include CSP header', async () => {
      const response = await page.request.get('/')
      const csp = response.headers()['content-security-policy']
      
      expect(csp).toBeDefined()
      expect(csp).toContain('default-src')
      expect(csp).toContain('script-src')
      expect(csp).toContain('style-src')
    })

    test('should include HSTS header in production', async () => {
      const response = await page.request.get('/')
      const hsts = response.headers()['strict-transport-security']
      
      // HSTS should be present in production
      if (process.env.NODE_ENV === 'production') {
        expect(hsts).toBeDefined()
        expect(hsts).toContain('max-age')
      }
    })
  })

  test.describe('Data Protection', () => {
    test('should not expose sensitive data in client-side code', async () => {
      await page.goto('/')
      
      // Check that sensitive data is not in the page source
      const pageContent = await page.content()
      
      expect(pageContent).not.toContain('sk_live_')
      expect(pageContent).not.toContain('pk_live_')
      expect(pageContent).not.toContain('whsec_')
      expect(pageContent).not.toContain('re_')
    })

    test('should encrypt sensitive data in localStorage', async () => {
      await page.goto('/auth/signin')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      // Check that sensitive data is not stored in plain text
      const localStorage = await page.evaluate(() => {
        return Object.keys(localStorage).reduce((acc, key) => {
          acc[key] = localStorage.getItem(key)
          return acc
        }, {} as Record<string, string>)
      })
      
      // Should not contain plain text passwords
      Object.values(localStorage).forEach(value => {
        expect(value).not.toContain('password123')
      })
    })

    test('should handle data validation on client and server', async () => {
      await page.goto('/auth/signup')
      
      // Try to submit with malicious data
      await page.fill('input[name="name"]', '<script>alert("XSS")</script>')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.fill('input[name="confirmPassword"]', 'password123')
      
      await page.click('button[type="submit"]')
      
      // Should sanitize the input
      const nameValue = await page.inputValue('input[name="name"]')
      expect(nameValue).not.toContain('<script>')
    })
  })

  test.describe('Payment Security', () => {
    test('should not expose Stripe keys in client-side code', async () => {
      await page.goto('/checkout')
      
      const pageContent = await page.content()
      
      // Should not contain secret keys
      expect(pageContent).not.toContain('sk_live_')
      expect(pageContent).not.toContain('sk_test_')
      
      // Should only contain publishable keys
      if (pageContent.includes('pk_')) {
        expect(pageContent).toMatch(/pk_test_|pk_live_/)
      }
    })

    test('should validate payment data', async () => {
      await page.goto('/checkout')
      
      // Try to submit with invalid payment data
      await page.fill('input[name="cardNumber"]', 'invalid')
      await page.fill('input[name="expiryDate"]', 'invalid')
      await page.fill('input[name="cvv"]', 'invalid')
      
      await page.click('button[type="submit"]')
      
      // Should show validation errors
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    })
  })

  test.describe('Admin Security', () => {
    test('should prevent non-admin access to admin routes', async () => {
      // Login as regular user
      await page.goto('/auth/signin')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      // Try to access admin route
      await page.goto('/admin')
      
      // Should be denied access
      expect(page.url()).toMatch(/\/unauthorized|\/403/)
    })

    test('should validate admin permissions', async () => {
      // Login as admin
      await page.goto('/auth/signin')
      await page.fill('input[type="email"]', 'admin@example.com')
      await page.fill('input[type="password"]', 'admin123')
      await page.click('button[type="submit"]')
      
      // Access admin dashboard
      await page.goto('/admin')
      
      // Should have access
      await expect(page.locator('h1')).toContainText('Admin Dashboard')
    })
  })

  test.describe('Error Handling Security', () => {
    test('should not expose sensitive information in error messages', async () => {
      // Try to access non-existent API endpoint
      const response = await page.request.get('/api/non-existent')
      
      const errorData = await response.json()
      
      // Should not expose database errors or stack traces
      expect(errorData.message).not.toContain('database')
      expect(errorData.message).not.toContain('stack')
      expect(errorData.message).not.toContain('error')
    })

    test('should handle errors gracefully', async () => {
      // Simulate server error
      await page.route('**/api/products', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        })
      })
      
      await page.goto('/products')
      
      // Should show user-friendly error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    })
  })

  test.describe('Session Security', () => {
    test('should use secure session cookies', async () => {
      await page.goto('/auth/signin')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      // Check cookie attributes
      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(c => c.name.includes('session'))
      
      if (sessionCookie) {
        expect(sessionCookie.httpOnly).toBe(true)
        expect(sessionCookie.secure).toBe(true)
        expect(sessionCookie.sameSite).toBe('Strict')
      }
    })

    test('should invalidate session on logout', async () => {
      // Login first
      await page.goto('/auth/signin')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      // Logout
      await page.click('[data-testid="user-menu"]')
      await page.click('button[data-testid="sign-out"]')
      
      // Try to access protected route
      await page.goto('/profile')
      
      // Should redirect to login
      expect(page.url()).toMatch(/\/auth\/signin/)
    })
  })

  test.describe('Network Security', () => {
    test('should use HTTPS in production', async () => {
      const response = await page.request.get('/')
      
      if (process.env.NODE_ENV === 'production') {
        expect(response.url()).toMatch(/^https:/)
      }
    })

    test('should not allow mixed content', async () => {
      await page.goto('/')
      
      // Check that all resources are loaded over HTTPS
      const resources = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource')
        return resources.map(r => r.name)
      })
      
      resources.forEach(url => {
        if (url.startsWith('http://')) {
          expect(url).not.toMatch(/http:\/\/(?!localhost)/)
        }
      })
    })
  })
})




