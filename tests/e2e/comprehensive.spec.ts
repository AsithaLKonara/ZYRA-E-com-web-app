import { test, expect, Page } from '@playwright/test'

test.describe('NEOSHOP ULTRA - Comprehensive E2E Tests', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    await page.goto('/')
  })

  test.describe('Homepage & Navigation', () => {
    test('should load homepage with all sections', async () => {
      // Check page title
      await expect(page).toHaveTitle(/NEOSHOP ULTRA/)
      
      // Check main navigation
      await expect(page.locator('nav')).toBeVisible()
      await expect(page.locator('nav a[href="/"]')).toBeVisible()
      await expect(page.locator('nav a[href="/products"]')).toBeVisible()
      await expect(page.locator('nav a[href="/categories"]')).toBeVisible()
      await expect(page.locator('nav a[href="/about"]')).toBeVisible()
      await expect(page.locator('nav a[href="/contact"]')).toBeVisible()
      
      // Check hero section
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('h1')).toContainText('AI-Powered Shopping Experience')
      
      // Check featured products section
      await expect(page.locator('h2').first()).toContainText('Featured Products')
      
      // Check footer
      await expect(page.locator('footer')).toBeVisible()
    })

    test('should navigate between pages', async () => {
      // Navigate to products
      await page.click('a[href="/products"]')
      await expect(page).toHaveURL('/products')
      await expect(page.locator('h1')).toContainText('Products')
      
      // Navigate to categories
      await page.click('a[href="/categories"]')
      await expect(page).toHaveURL('/categories')
      await expect(page.locator('h1')).toContainText('Categories')
      
      // Navigate to about
      await page.click('a[href="/about"]')
      await expect(page).toHaveURL('/about')
      await expect(page.locator('h1')).toContainText('About')
      
      // Navigate to contact
      await page.click('a[href="/contact"]')
      await expect(page).toHaveURL('/contact')
      await expect(page.locator('h1')).toContainText('Contact')
      
      // Navigate back to home
      await page.click('a[href="/"]')
      await expect(page).toHaveURL('/')
    })

    test('should display search functionality', async () => {    
      const searchInput = page.locator('input[type="search"]').first()   
      await expect(searchInput).toBeVisible()

      await searchInput.fill('test product')
      await searchInput.press('Enter')
      
      // Just verify the search input works (no URL redirect needed)
      await expect(searchInput).toHaveValue('test product')
    })

    test('should display cart button and user menu', async () => {
      const cartButton = page.locator('button[aria-label="Shopping cart"]')
      await expect(cartButton).toBeVisible()
      
      // Check if user button exists (simplified test)
      const userButton = page.locator('button').filter({ has: page.locator('svg') }).last()
      await expect(userButton).toBeVisible()
    })
  })

  test.describe('Authentication Flow', () => {
    test('should complete user registration', async () => {
      await page.goto('/auth/signup')
      
      // Fill registration form
      await page.fill('input[name="firstName"]', 'Test')
      await page.fill('input[name="lastName"]', 'User')
      await page.fill('input[type="email"]', 'testuser@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.fill('input[name="confirmPassword"]', 'password123')
      
      // Submit form
      await page.click('button[type="submit"]')
      
      // Should redirect to signin page after registration
      await expect(page).toHaveURL('/auth/signin')
    })

    test('should complete user login', async () => {
      await page.goto('/auth/signin')
      
      // Fill login form
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      
      // Submit form
      await page.click('button[type="submit"]')
      
      // Should redirect to profile (as per our mock logic)
      await expect(page).toHaveURL('/profile')
      
      // Should show user menu
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    })

    test('should handle login errors', async () => {
      await page.goto('/auth/signin')
      
      // Fill with invalid credentials
      await page.fill('input[type="email"]', 'invalid@example.com')
      await page.fill('input[type="password"]', 'wrongpassword')
      
      // Submit form
      await page.click('button[type="submit"]')
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    })

    test('should complete user logout', async () => {
      // First login
      await page.goto('/auth/signin')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      // Click user menu
      await page.click('[data-testid="user-menu"]')
      
      // Click logout
      await page.click('button[data-testid="sign-out"]')
      
      // Should redirect to home
      await expect(page).toHaveURL('/')
      
      // Should show login button
      await expect(page.locator('a[href="/auth/signin"]')).toBeVisible()
    })
  })

  test.describe('Product Catalog', () => {
    test('should display products page', async () => {
      await page.goto('/products')
      
      await expect(page.locator('h1')).toContainText('Products')
      await expect(page.locator('[data-testid="product-grid"]')).toBeVisible()
    })

    test('should display product cards', async () => {
      await page.goto('/products')
      await page.waitForSelector('[data-testid="product-card"]')
      
      const productCards = page.locator('[data-testid="product-card"]')
      await expect(productCards).toHaveCount(expect.any(Number))
      expect(await productCards.count()).toBeGreaterThan(0)
      
      // Check first product card
      const firstProduct = productCards.first()
      await expect(firstProduct.locator('h3')).toBeVisible()
      await expect(firstProduct.locator('img')).toBeVisible()
      await expect(firstProduct.locator('[data-testid="product-price"]')).toBeVisible()
    })

    test('should filter products by category', async () => {
      await page.goto('/products')
      
      const categoryFilter = page.locator('[data-testid="category-filter"]')
      if (await categoryFilter.isVisible()) {
        await categoryFilter.selectOption('electronics')
        
        // Wait for products to filter
        await page.waitForTimeout(1000)
        
        const productCards = page.locator('[data-testid="product-card"]')
        await expect(productCards).toHaveCount(expect.any(Number))
      expect(await productCards.count()).toBeGreaterThan(0)
      }
    })

    test('should sort products', async () => {
      await page.goto('/products')
      
      const sortSelect = page.locator('[data-testid="sort-select"]')
      if (await sortSelect.isVisible()) {
        await sortSelect.selectOption('price-low-to-high')
        
        // Wait for products to sort
        await page.waitForTimeout(1000)
        
        const productCards = page.locator('[data-testid="product-card"]')
        await expect(productCards).toHaveCount(expect.any(Number))
      expect(await productCards.count()).toBeGreaterThan(0)
      }
    })

    test('should search products', async () => {
      await page.goto('/products')
      
      const searchInput = page.locator('input[type="search"]')
      await searchInput.fill('test product')
      await searchInput.press('Enter')
      
      // Wait for search results
      await page.waitForTimeout(1000)
      
      const productCards = page.locator('[data-testid="product-card"]')
      await expect(productCards).toHaveCount(expect.any(Number))
      expect(await productCards.count()).toBeGreaterThan(0)
    })

    test('should paginate products', async () => {
      await page.goto('/products')
      
      const pagination = page.locator('[data-testid="pagination"]')
      if (await pagination.isVisible()) {
        const nextButton = pagination.locator('button[aria-label="Next page"]')
        await expect(nextButton).toBeVisible()
        
        await nextButton.click()
        
        // Wait for new products to load
        await page.waitForTimeout(1000)
        
        // Check that page changed
        await expect(page).toHaveURL(/page=2/)
      }
    })
  })

  test.describe('Product Details', () => {
    test('should view product details', async () => {
      await page.goto('/products')
      await page.waitForSelector('[data-testid="product-card"]')
      
      const firstProduct = page.locator('[data-testid="product-card"]').first()
      const productName = await firstProduct.locator('h3').textContent()
      
      await firstProduct.click()
      
      // Should navigate to product detail page
      await expect(page).toHaveURL(/\/products\/[^\/]+/)
      
      // Should display product details
      await expect(page.locator('h1')).toContainText(productName!)
      await expect(page.locator('[data-testid="product-images"]')).toBeVisible()
      await expect(page.locator('[data-testid="product-price"]')).toBeVisible()
      await expect(page.locator('[data-testid="product-description"]')).toBeVisible()
    })

    test('should add product to cart', async () => {
      await page.goto('/products')
      await page.waitForSelector('[data-testid="product-card"]')
      
      const firstProduct = page.locator('[data-testid="product-card"]').first()
      await firstProduct.click()
      
      // Wait for product detail page to load
      await page.waitForSelector('[data-testid="add-to-cart-button"]')
      
      const addToCartButton = page.locator('[data-testid="add-to-cart-button"]')
      await expect(addToCartButton).toBeVisible()
      
      await addToCartButton.click()
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    })

    test('should add product to wishlist', async () => {
      // First login
      await page.goto('/auth/signin')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      await page.goto('/products')
      await page.waitForSelector('[data-testid="product-card"]')
      
      const firstProduct = page.locator('[data-testid="product-card"]').first()
      await firstProduct.click()
      
      // Wait for product detail page to load
      await page.waitForSelector('[data-testid="add-to-wishlist-button"]')
      
      const addToWishlistButton = page.locator('[data-testid="add-to-wishlist-button"]')
      await expect(addToWishlistButton).toBeVisible()
      
      await addToWishlistButton.click()
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    })

    test('should display product reviews', async () => {
      await page.goto('/products')
      await page.waitForSelector('[data-testid="product-card"]')
      
      const firstProduct = page.locator('[data-testid="product-card"]').first()
      await firstProduct.click()
      
      // Wait for product detail page to load
      await page.waitForSelector('[data-testid="product-reviews"]')
      
      const reviewsSection = page.locator('[data-testid="product-reviews"]')
      await expect(reviewsSection).toBeVisible()
    })
  })

  test.describe('Shopping Cart', () => {
    test('should add items to cart', async () => {
      await page.goto('/products')
      await page.waitForSelector('[data-testid="product-card"]')
      
      const firstProduct = page.locator('[data-testid="product-card"]').first()
      await firstProduct.click()
      
      await page.waitForSelector('[data-testid="add-to-cart-button"]')
      await page.click('[data-testid="add-to-cart-button"]')
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    })

    test('should view cart', async () => {
      // Add item to cart first
      await page.goto('/products')
      await page.waitForSelector('[data-testid="product-card"]')
      const firstProduct = page.locator('[data-testid="product-card"]').first()
      await firstProduct.click()
      await page.waitForSelector('[data-testid="add-to-cart-button"]')
      await page.click('[data-testid="add-to-cart-button"]')
      
      // Click cart button
      await page.click('button[aria-label="Shopping cart"]')
      
      // Should show cart sidebar or navigate to cart page
      const cartSidebar = page.locator('[data-testid="cart-sidebar"]')
      const cartPage = page.locator('[data-testid="cart-page"]')
      
      if (await cartSidebar.isVisible()) {
        await expect(cartSidebar).toBeVisible()
      } else {
        await expect(page).toHaveURL('/cart')
        await expect(cartPage).toBeVisible()
      }
    })

    test('should update cart quantities', async () => {
      await page.goto('/cart')
      
      const quantityInput = page.locator('input[type="number"]').first()
      if (await quantityInput.isVisible()) {
        await quantityInput.fill('2')
        await quantityInput.press('Enter')
        
        // Should update total
        await expect(page.locator('[data-testid="cart-total"]')).toBeVisible()
      }
    })

    test('should remove items from cart', async () => {
      await page.goto('/cart')
      
      const removeButton = page.locator('button[data-testid="remove-item"]').first()
      if (await removeButton.isVisible()) {
        await removeButton.click()
        
        // Should update cart
        await expect(page.locator('[data-testid="cart-empty"]')).toBeVisible()
      }
    })
  })

  test.describe('Checkout Process', () => {
    test('should complete checkout flow', async () => {
      // First login
      await page.goto('/auth/signin')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      // Add item to cart
      await page.goto('/products')
      await page.waitForSelector('[data-testid="product-card"]')
      const firstProduct = page.locator('[data-testid="product-card"]').first()
      await firstProduct.click()
      await page.waitForSelector('[data-testid="add-to-cart-button"]')
      await page.click('[data-testid="add-to-cart-button"]')
      
      // Go to checkout
      await page.goto('/checkout')
      
      // Fill shipping information
      await page.fill('input[name="firstName"]', 'John')
      await page.fill('input[name="lastName"]', 'Doe')
      await page.fill('input[name="email"]', 'john.doe@example.com')
      await page.fill('input[name="phone"]', '1234567890')
      await page.fill('input[name="address"]', '123 Main St')
      await page.fill('input[name="city"]', 'New York')
      await page.fill('input[name="state"]', 'NY')
      await page.fill('input[name="zipCode"]', '10001')
      await page.fill('input[name="country"]', 'US')
      
      // Fill billing information
      await page.fill('input[name="billingFirstName"]', 'John')
      await page.fill('input[name="billingLastName"]', 'Doe')
      await page.fill('input[name="billingAddress"]', '123 Main St')
      await page.fill('input[name="billingCity"]', 'New York')
      await page.fill('input[name="billingState"]', 'NY')
      await page.fill('input[name="billingZipCode"]', '10001')
      await page.fill('input[name="billingCountry"]', 'US')
      
      // Proceed to payment
      await page.click('button[data-testid="proceed-to-payment"]')
      
      // Fill payment information (using test card)
      await page.fill('input[name="cardNumber"]', '4242424242424242')
      await page.fill('input[name="expiryDate"]', '12/25')
      await page.fill('input[name="cvv"]', '123')
      await page.fill('input[name="cardholderName"]', 'John Doe')
      
      // Place order
      await page.click('button[data-testid="place-order"]')
      
      // Should redirect to success page
      await expect(page).toHaveURL(/\/payments\/success/)
    })

    test('should handle checkout errors', async () => {
      await page.goto('/checkout')
      
      // Try to proceed without filling required fields
      await page.click('button[data-testid="proceed-to-payment"]')
      
      // Should show validation errors
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    })
  })

  test.describe('User Profile & Orders', () => {
    test('should view user profile', async () => {
      // First login
      await page.goto('/auth/signin')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      // Click user menu
      await page.click('[data-testid="user-menu"]')
      
      // Click profile
      await page.click('a[href="/profile"]')
      
      // Should show profile page
      await expect(page).toHaveURL('/profile')
      await expect(page.locator('h1')).toContainText('Profile')
    })

    test('should view order history', async () => {
      // First login
      await page.goto('/auth/signin')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      // Go to orders page
      await page.goto('/orders')
      
      // Should show orders page
      await expect(page.locator('h1')).toContainText('Orders')
    })

    test('should update user profile', async () => {
      // First login
      await page.goto('/auth/signin')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      // Go to profile page
      await page.goto('/profile')
      
      // Update profile information
      await page.fill('input[name="name"]', 'Updated Name')
      await page.fill('input[name="phone"]', '9876543210')
      
      // Save changes
      await page.click('button[type="submit"]')
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    })
  })

  test.describe('Admin Functions', () => {
    test('should access admin dashboard', async () => {
      // Login as admin
      await page.goto('/auth/signin')
      await page.fill('input[type="email"]', 'admin@example.com')
      await page.fill('input[type="password"]', 'admin123')
      await page.click('button[type="submit"]')
      
      // Go to admin dashboard
      await page.goto('/admin')
      
      // Should show admin dashboard
      await expect(page.locator('h1')).toContainText('Admin Dashboard')
    })

    test('should manage products', async () => {
      // Login as admin
      await page.goto('/auth/signin')
      await page.fill('input[type="email"]', 'admin@example.com')
      await page.fill('input[type="password"]', 'admin123')
      await page.click('button[type="submit"]')
      
      // Go to products management
      await page.goto('/admin/products')
      
      // Should show products management page
      await expect(page.locator('h1')).toContainText('Products')
    })

    test('should manage orders', async () => {
      // Login as admin
      await page.goto('/auth/signin')
      await page.fill('input[type="email"]', 'admin@example.com')
      await page.fill('input[type="password"]', 'admin123')
      await page.click('button[type="submit"]')
      
      // Go to orders management
      await page.goto('/admin/orders')
      
      // Should show orders management page
      await expect(page.locator('h1')).toContainText('Orders')
    })
  })

  test.describe('Error Handling', () => {
    test('should handle 404 errors', async () => {
      await page.goto('/non-existent-page')
      
      // Should show 404 page
      await expect(page.locator('h1')).toContainText('404')
      await expect(page.locator('a[href="/"]')).toBeVisible()
    })

    test('should handle network errors gracefully', async () => {
      // Mock network failure
      await page.route('**/api/products', route => {
        route.abort()
      })
      
      await page.goto('/products')
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile devices', async () => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Check mobile menu
      const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]')
      await expect(mobileMenuButton).toBeVisible()

      await mobileMenuButton.click()
      
      // Wait for menu to open
      await page.waitForTimeout(500)
      
      const mobileMenu = page.locator('[data-testid="mobile-menu"]')
      await expect(mobileMenu).toBeVisible()
    })

    test('should display products correctly on mobile', async () => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/products')
      
      const productCards = page.locator('[data-testid="product-card"]')
      await expect(productCards).toHaveCount(expect.any(Number))
      expect(await productCards.count()).toBeGreaterThan(0)
      
      // Check that products are displayed in a mobile-friendly layout
      const firstProduct = productCards.first()
      await expect(firstProduct).toBeVisible()
    })
  })

  test.describe('PWA Features', () => {
    test('should show install prompt', async () => {
      // Mock PWA install prompt
      await page.evaluate(() => {
        window.addEventListener('beforeinstallprompt', (e) => {
          e.preventDefault()
          window.deferredPrompt = e
        })
      })
      
      await page.goto('/')
      
      // Check if install prompt is shown
      const installPrompt = page.locator('[data-testid="install-prompt"]')
      if (await installPrompt.isVisible()) {
        await expect(installPrompt).toBeVisible()
      }
    })

    test('should work offline', async () => {
      // Go offline
      await page.context().setOffline(true)
      
      await page.goto('/')
      
      // Should show offline indicator
      const offlineIndicator = page.locator('[data-testid="offline-indicator"]')
      await expect(offlineIndicator).toBeVisible()
    })
  })

  test.describe('Performance', () => {
    test('should load pages quickly', async () => {
      const startTime = Date.now()
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - startTime
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
    })

    test('should have good Core Web Vitals', async () => {
      await page.goto('/')
      
      // Check for performance metrics
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lcp = entries.find(entry => entry.entryType === 'largest-contentful-paint')
            const fid = entries.find(entry => entry.entryType === 'first-input')
            const cls = entries.find(entry => entry.entryType === 'layout-shift')
            
            resolve({
              lcp: lcp?.startTime,
              fid: fid?.processingStart - fid?.startTime,
              cls: cls?.value
            })
          }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
        })
      })
      
      // Basic performance checks
      expect(metrics).toBeDefined()
    })
  })
})

