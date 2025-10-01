import { chromium, FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...')
  
  // Start browser for cleanup
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Clean up test data
    console.log('🗑️ Cleaning up test data...')
    await cleanupTestData(page)
    
    // Clean up authentication
    console.log('🔓 Cleaning up authentication...')
    await cleanupAuthentication(page)
    
    console.log('✅ Global teardown completed successfully')
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw error to avoid failing the test suite
  } finally {
    await browser.close()
  }
}

async function cleanupTestData(page: any) {
  // Clean up test users
  await page.request.delete('http://localhost:3000/api/test/users')
  
  // Clean up test products
  await page.request.delete('http://localhost:3000/api/test/products')
  
  // Clean up test categories
  await page.request.delete('http://localhost:3000/api/test/categories')
  
  // Clean up test orders
  await page.request.delete('http://localhost:3000/api/test/orders')
  
  // Clean up test reviews
  await page.request.delete('http://localhost:3000/api/test/reviews')
}

async function cleanupAuthentication(page: any) {
  // Clear all cookies
  await page.context().clearCookies()
  
  // Clear local storage
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

export default globalTeardown




