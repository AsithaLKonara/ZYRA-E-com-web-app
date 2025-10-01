import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...')
  
  // Start browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Wait for the application to be ready
    console.log('⏳ Waiting for application to be ready...')
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
    
    // Check if the application is running
    const title = await page.title()
    if (!title.includes('NEOSHOP ULTRA')) {
      throw new Error('Application not ready or incorrect title')
    }
    
    // Set up test data if needed
    console.log('📊 Setting up test data...')
    await setupTestData(page)
    
    // Set up authentication if needed
    console.log('🔐 Setting up authentication...')
    await setupAuthentication(page)
    
    console.log('✅ Global setup completed successfully')
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

async function setupTestData(page: any) {
  // Create test users
  await page.request.post('http://localhost:3000/api/test/users', {
    data: {
      users: [
        {
          email: 'test@example.com',
          name: 'Test User',
          password: 'password123',
          role: 'USER',
        },
        {
          email: 'admin@example.com',
          name: 'Admin User',
          password: 'admin123',
          role: 'ADMIN',
        },
      ],
    },
  })
  
  // Create test products
  await page.request.post('http://localhost:3000/api/test/products', {
    data: {
      products: [
        {
          name: 'Test Product 1',
          slug: 'test-product-1',
          description: 'A test product for e2e testing',
          price: 29.99,
          stock: 100,
          categoryId: 1,
          images: ['/images/test-product-1.jpg'],
          isActive: true,
        },
        {
          name: 'Test Product 2',
          slug: 'test-product-2',
          description: 'Another test product for e2e testing',
          price: 49.99,
          stock: 50,
          categoryId: 1,
          images: ['/images/test-product-2.jpg'],
          isActive: true,
        },
      ],
    },
  })
  
  // Create test categories
  await page.request.post('http://localhost:3000/api/test/categories', {
    data: {
      categories: [
        {
          name: 'Test Category',
          slug: 'test-category',
          description: 'A test category for e2e testing',
          isActive: true,
        },
      ],
    },
  })
}

async function setupAuthentication(page: any) {
  // Set up test session
  await page.context().addCookies([
    {
      name: 'next-auth.session-token',
      value: 'test-session-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ])
}

export default globalSetup




