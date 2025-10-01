import { Page, expect } from '@playwright/test'
import { testConfig } from './test-config'

export class TestUtils {
  constructor(private page: Page) {}

  // Authentication helpers
  async loginAsAdmin(): Promise<void> {
    await this.page.goto('/auth/signin')
    await this.page.fill('[data-testid="email-input"]', testConfig.testData.users.admin.email)
    await this.page.fill('[data-testid="password-input"]', testConfig.testData.users.admin.password)
    await this.page.click('[data-testid="signin-button"]')
    await this.page.waitForURL('/dashboard')
  }

  async loginAsCustomer(): Promise<void> {
    await this.page.goto('/auth/signin')
    await this.page.fill('[data-testid="email-input"]', testConfig.testData.users.customer.email)
    await this.page.fill('[data-testid="password-input"]', testConfig.testData.users.customer.password)
    await this.page.click('[data-testid="signin-button"]')
    await this.page.waitForURL('/')
  }

  async logout(): Promise<void> {
    await this.page.click('[data-testid="user-menu"]')
    await this.page.click('[data-testid="logout-button"]')
    await this.page.waitForURL('/')
  }

  // Navigation helpers
  async navigateToProducts(): Promise<void> {
    await this.page.goto('/products')
    await this.page.waitForSelector('[data-testid="product-grid"]')
  }

  async navigateToCart(): Promise<void> {
    await this.page.goto('/cart')
    await this.page.waitForSelector('[data-testid="cart-container"]')
  }

  async navigateToCheckout(): Promise<void> {
    await this.page.goto('/checkout')
    await this.page.waitForSelector('[data-testid="checkout-form"]')
  }

  // Product helpers
  async addProductToCart(productIndex: number = 0): Promise<void> {
    await this.navigateToProducts()
    const productCard = this.page.locator('[data-testid="product-card"]').nth(productIndex)
    await productCard.click()
    await this.page.waitForSelector('[data-testid="product-details"]')
    await this.page.click('[data-testid="add-to-cart-button"]')
    await this.page.waitForSelector('[data-testid="cart-success-message"]')
  }

  async searchProducts(query: string): Promise<void> {
    await this.page.fill('[data-testid="search-input"]', query)
    await this.page.press('[data-testid="search-input"]', 'Enter')
    await this.page.waitForSelector('[data-testid="search-results"]')
  }

  // Cart helpers
  async getCartItemCount(): Promise<number> {
    const countElement = this.page.locator('[data-testid="cart-count"]')
    if (await countElement.isVisible()) {
      const text = await countElement.textContent()
      return parseInt(text || '0')
    }
    return 0
  }

  async updateCartItemQuantity(itemIndex: number, quantity: number): Promise<void> {
    const quantityInput = this.page.locator(`[data-testid="quantity-input-${itemIndex}"]`)
    await quantityInput.fill(quantity.toString())
    await this.page.press(`[data-testid="quantity-input-${itemIndex}"]`, 'Enter')
  }

  async removeCartItem(itemIndex: number): Promise<void> {
    await this.page.click(`[data-testid="remove-item-${itemIndex}"]`)
    await this.page.waitForSelector('[data-testid="cart-updated-message"]')
  }

  // Checkout helpers
  async fillShippingAddress(address: any): Promise<void> {
    await this.page.fill('[data-testid="shipping-first-name"]', address.firstName)
    await this.page.fill('[data-testid="shipping-last-name"]', address.lastName)
    await this.page.fill('[data-testid="shipping-address"]', address.street)
    await this.page.fill('[data-testid="shipping-city"]', address.city)
    await this.page.fill('[data-testid="shipping-state"]', address.state)
    await this.page.fill('[data-testid="shipping-zip"]', address.zipCode)
    await this.page.fill('[data-testid="shipping-country"]', address.country)
  }

  async fillPaymentInfo(cardInfo: any): Promise<void> {
    // This would depend on your payment form implementation
    await this.page.fill('[data-testid="card-number"]', cardInfo.number)
    await this.page.fill('[data-testid="card-expiry"]', cardInfo.expiry)
    await this.page.fill('[data-testid="card-cvv"]', cardInfo.cvv)
    await this.page.fill('[data-testid="card-name"]', cardInfo.name)
  }

  // API helpers
  async makeApiRequest(endpoint: string, options: any = {}): Promise<any> {
    const response = await this.page.request.get(`${testConfig.apiBaseUrl}${endpoint}`, options)
    return response.json()
  }

  async makeApiPost(endpoint: string, data: any, options: any = {}): Promise<any> {
    const response = await this.page.request.post(`${testConfig.apiBaseUrl}${endpoint}`, {
      data,
      ...options
    })
    return response.json()
  }

  // Performance helpers
  async measurePageLoadTime(): Promise<number> {
    const startTime = Date.now()
    await this.page.waitForLoadState('networkidle')
    return Date.now() - startTime
  }

  async getPerformanceMetrics(): Promise<any> {
    return await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paint = performance.getEntriesByType('paint')
      
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
      }
    })
  }

  // Accessibility helpers
  async checkAccessibility(): Promise<void> {
    // Check for proper heading structure
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').all()
    expect(headings.length).toBeGreaterThan(0)
    
    // Check for alt text on images
    const images = await this.page.locator('img').all()
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      expect(alt).toBeTruthy()
    }
    
    // Check for form labels
    const inputs = await this.page.locator('input, textarea, select').all()
    for (const input of inputs) {
      const id = await input.getAttribute('id')
      if (id) {
        const label = this.page.locator(`label[for="${id}"]`)
        await expect(label).toBeVisible()
      }
    }
  }

  // Security helpers
  async testXSSProtection(input: string): Promise<boolean> {
    await this.page.fill('[data-testid="search-input"]', input)
    await this.page.press('[data-testid="search-input"]', 'Enter')
    
    // Check if script tags are escaped
    const content = await this.page.content()
    return !content.includes('<script>') && !content.includes('javascript:')
  }

  async testSQLInjection(input: string): Promise<boolean> {
    const response = await this.makeApiRequest(`/products?search=${encodeURIComponent(input)}`)
    return response.success !== false
  }

  // PWA helpers
  async checkServiceWorker(): Promise<boolean> {
    return await this.page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        return !!registration
      }
      return false
    })
  }

  async checkManifest(): Promise<any> {
    const response = await this.page.request.get('/manifest.json')
    return response.json()
  }

  async checkOfflineSupport(): Promise<boolean> {
    await this.page.context().setOffline(true)
    await this.page.goto('/')
    
    const offlineIndicator = this.page.locator('[data-testid="offline-indicator"]')
    return await offlineIndicator.isVisible()
  }

  // Utility helpers
  async waitForElement(selector: string, timeout: number = 5000): Promise<void> {
    await this.page.waitForSelector(selector, { timeout })
  }

  async waitForApiResponse(url: string): Promise<void> {
    await this.page.waitForResponse(response => response.url().includes(url))
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` })
  }

  async clearStorage(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  }

  // Error handling
  async handleError(error: Error, context: string): Promise<void> {
    console.error(`Error in ${context}:`, error)
    await this.takeScreenshot(`error-${context}-${Date.now()}`)
    throw error
  }

  // Test data helpers
  async createTestUser(userData: any): Promise<any> {
    const response = await this.makeApiPost('/auth/register', userData)
    return response
  }

  async createTestProduct(productData: any): Promise<any> {
    const response = await this.makeApiPost('/admin/products', productData)
    return response
  }

  async cleanupTestData(): Promise<void> {
    // This would depend on your cleanup implementation
    await this.makeApiPost('/admin/cleanup', {})
  }
}

export default TestUtils




