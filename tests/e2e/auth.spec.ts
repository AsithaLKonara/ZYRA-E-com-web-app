import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin')
  })

  test('should display sign in form', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Sign In')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should display sign up form when toggled', async ({ page }) => {
    await page.click('a[href="/auth/signup"]')
    await expect(page).toHaveURL('/auth/signup')
    await expect(page.locator('h1')).toContainText('Sign Up')
  })

  test('should validate required fields', async ({ page }) => {
    await page.click('button[type="submit"]')
    
    // Check for validation errors
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid-email')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email')
  })

  test('should validate password strength', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', '123')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Password must be at least 8 characters')
  })

  test('should handle successful sign in', async ({ page }) => {
    // Mock successful sign in
    await page.route('**/api/auth/signin', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'USER'
          },
          session: {
            token: 'test-session-token'
          }
        })
      })
    })
    
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard or home
    await expect(page).toHaveURL('/')
    
    // Should show user menu
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should handle sign in error', async ({ page }) => {
    // Mock sign in error
    await page.route('**/api/auth/signin', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid credentials'
        })
      })
    })
    
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials')
  })

  test('should handle successful sign up', async ({ page }) => {
    await page.goto('/auth/signup')
    
    // Mock successful sign up
    await page.route('**/api/auth/signup', route => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: '1',
            email: 'newuser@example.com',
            name: 'New User',
            role: 'USER'
          },
          session: {
            token: 'test-session-token'
          }
        })
      })
    })
    
    await page.fill('input[name="name"]', 'New User')
    await page.fill('input[type="email"]', 'newuser@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should redirect to home
    await expect(page).toHaveURL('/')
    
    // Should show user menu
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should handle sign up with existing email', async ({ page }) => {
    await page.goto('/auth/signup')
    
    // Mock sign up error
    await page.route('**/api/auth/signup', route => {
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Email already exists'
        })
      })
    })
    
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Email already exists')
  })

  test('should handle OAuth sign in', async ({ page }) => {
    // Mock OAuth redirect
    await page.route('**/api/auth/oauth/google', route => {
      route.fulfill({
        status: 302,
        headers: {
          'Location': 'http://localhost:3000/auth/callback?code=test-code'
        }
      })
    })
    
    await page.click('button[data-provider="google"]')
    
    // Should redirect to OAuth provider
    await expect(page).toHaveURL(/google\.com/)
  })

  test('should handle password reset', async ({ page }) => {
    await page.click('a[href="/auth/forgot-password"]')
    await expect(page).toHaveURL('/auth/forgot-password')
    
    await page.fill('input[type="email"]', 'test@example.com')
    await page.click('button[type="submit"]')
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Password reset email sent')
  })

  test('should handle sign out', async ({ page }) => {
    // Mock logged in state
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER'
      }))
    })
    
    await page.goto('/')
    
    // Click user menu
    await page.click('[data-testid="user-menu"]')
    
    // Click sign out
    await page.click('button[data-testid="sign-out"]')
    
    // Should redirect to home
    await expect(page).toHaveURL('/')
    
    // Should show login button
    await expect(page.locator('a[href="/auth/signin"]')).toBeVisible()
  })

  test('should persist session across page reloads', async ({ page }) => {
    // Mock successful sign in
    await page.route('**/api/auth/signin', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'USER'
          },
          session: {
            token: 'test-session-token'
          }
        })
      })
    })
    
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Reload page
    await page.reload()
    
    // Should still be logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should handle session expiration', async ({ page }) => {
    // Mock expired session
    await page.route('**/api/auth/session', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Session expired'
        })
      })
    })
    
    await page.goto('/')
    
    // Should redirect to sign in
    await expect(page).toHaveURL('/auth/signin')
  })
})




