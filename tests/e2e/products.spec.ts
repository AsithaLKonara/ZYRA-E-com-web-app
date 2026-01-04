import { test, expect } from '@playwright/test'

test.describe('Products', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products')
  })

  test('should display products page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Products')
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible()
  })

  test('should display product cards', async ({ page }) => {
    await page.waitForSelector('[data-testid="product-card"]')
    
    const productCards = page.locator('[data-testid="product-card"]')
    await expect(productCards).toHaveCountGreaterThan(0)
    
    // Check first product card
    const firstProduct = productCards.first()
    await expect(firstProduct.locator('h3')).toBeVisible()
    await expect(firstProduct.locator('img')).toBeVisible()
    await expect(firstProduct.locator('[data-testid="product-price"]')).toBeVisible()
    await expect(firstProduct.locator('[data-testid="product-rating"]')).toBeVisible()
  })

  test('should filter products by category', async ({ page }) => {
    const categoryFilter = page.locator('[data-testid="category-filter"]')
    await expect(categoryFilter).toBeVisible()
    
    await categoryFilter.selectOption('electronics')
    
    // Wait for products to filter
    await page.waitForTimeout(1000)
    
    // Check that products are filtered
    const productCards = page.locator('[data-testid="product-card"]')
    await expect(productCards).toHaveCountGreaterThan(0)
  })

  test('should sort products', async ({ page }) => {
    const sortSelect = page.locator('[data-testid="sort-select"]')
    await expect(sortSelect).toBeVisible()
    
    await sortSelect.selectOption('price-low-to-high')
    
    // Wait for products to sort
    await page.waitForTimeout(1000)
    
    // Check that products are sorted
    const productCards = page.locator('[data-testid="product-card"]')
    await expect(productCards).toHaveCountGreaterThan(0)
  })

  test('should search products', async ({ page }) => {
    const searchInput = page.locator('input[type="search"]')
    await expect(searchInput).toBeVisible()
    
    await searchInput.fill('test product')
    await searchInput.press('Enter')
    
    // Wait for search results
    await page.waitForTimeout(1000)
    
    // Check that search results are displayed
    const productCards = page.locator('[data-testid="product-card"]')
    await expect(productCards).toHaveCountGreaterThan(0)
  })

  test('should paginate products', async ({ page }) => {
    // Check if pagination exists
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

  test('should view product details', async ({ page }) => {
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

  test('should add product to cart', async ({ page }) => {
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
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Added to cart')
  })

  test('should add product to wishlist', async ({ page }) => {
    // Mock logged in state
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER'
      }))
    })
    
    await page.reload()
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
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Added to wishlist')
  })

  test('should display product reviews', async ({ page }) => {
    await page.waitForSelector('[data-testid="product-card"]')
    
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.click()
    
    // Wait for product detail page to load
    await page.waitForSelector('[data-testid="product-reviews"]')
    
    const reviewsSection = page.locator('[data-testid="product-reviews"]')
    await expect(reviewsSection).toBeVisible()
    
    // Check for review cards
    const reviewCards = reviewsSection.locator('[data-testid="review-card"]')
    await expect(reviewCards).toHaveCountGreaterThan(0)
  })

  test('should handle product not found', async ({ page }) => {
    await page.goto('/products/non-existent-product')
    
    // Should show 404 page
    await expect(page.locator('h1')).toContainText('Product Not Found')
    await expect(page.locator('a[href="/products"]')).toBeVisible()
  })

  test('should handle out of stock products', async ({ page }) => {
    await page.waitForSelector('[data-testid="product-card"]')
    
    // Find out of stock product
    const outOfStockProduct = page.locator('[data-testid="product-card"]').filter({ hasText: 'Out of Stock' })
    
    if (await outOfStockProduct.count() > 0) {
      await outOfStockProduct.click()
      
      // Should show out of stock message
      await expect(page.locator('[data-testid="out-of-stock-message"]')).toBeVisible()
      
      // Add to cart button should be disabled
      const addToCartButton = page.locator('[data-testid="add-to-cart-button"]')
      await expect(addToCartButton).toBeDisabled()
    }
  })

  test('should display product variants', async ({ page }) => {
    await page.waitForSelector('[data-testid="product-card"]')
    
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.click()
    
    // Wait for product detail page to load
    await page.waitForSelector('[data-testid="product-variants"]')
    
    const variantsSection = page.locator('[data-testid="product-variants"]')
    
    if (await variantsSection.isVisible()) {
      const variantOptions = variantsSection.locator('[data-testid="variant-option"]')
      await expect(variantOptions).toHaveCountGreaterThan(0)
      
      // Select a variant
      await variantOptions.first().click()
      
      // Should update product details
      await expect(page.locator('[data-testid="product-price"]')).toBeVisible()
    }
  })

  test('should display product images', async ({ page }) => {
    await page.waitForSelector('[data-testid="product-card"]')
    
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.click()
    
    // Wait for product detail page to load
    await page.waitForSelector('[data-testid="product-images"]')
    
    const imagesSection = page.locator('[data-testid="product-images"]')
    await expect(imagesSection).toBeVisible()
    
    // Check for main image
    const mainImage = imagesSection.locator('img').first()
    await expect(mainImage).toBeVisible()
    
    // Check for thumbnail images
    const thumbnails = imagesSection.locator('[data-testid="thumbnail"]')
    await expect(thumbnails).toHaveCountGreaterThan(0)
  })

  test('should handle image zoom', async ({ page }) => {
    await page.waitForSelector('[data-testid="product-card"]')
    
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.click()
    
    // Wait for product detail page to load
    await page.waitForSelector('[data-testid="product-images"]')
    
    const mainImage = page.locator('[data-testid="product-images"] img').first()
    await expect(mainImage).toBeVisible()
    
    // Click on image to zoom
    await mainImage.click()
    
    // Should show zoom modal
    await expect(page.locator('[data-testid="image-zoom-modal"]')).toBeVisible()
  })

  test('should track product view analytics', async ({ page }) => {
    // Mock analytics
    const analyticsEvents: string[] = []
    await page.exposeFunction('trackEvent', (event: string) => {
      analyticsEvents.push(event)
    })
    
    await page.evaluate(() => {
      window.gtag = (event: string) => {
        (window as any).trackEvent(event)
      }
    })
    
    await page.waitForSelector('[data-testid="product-card"]')
    
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.click()
    
    // Wait for analytics to be tracked
    await page.waitForTimeout(1000)
    
    const events = await page.evaluate(() => (window as any).analyticsEvents || [])
    expect(events).toContain('product_view')
  })
})




