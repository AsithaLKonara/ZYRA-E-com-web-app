import { test, expect, Page } from '@playwright/test'

test.describe('Performance Testing - ZYRA Fashion', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
  })

  test.describe('Page Load Performance', () => {
    test('homepage should load within 2 seconds', async () => {
      const startTime = Date.now()
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - startTime
      
      expect(loadTime).toBeLessThan(2000)
    })

    test('products page should load within 3 seconds', async () => {
      const startTime = Date.now()
      await page.goto('/products')
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - startTime
      
      expect(loadTime).toBeLessThan(3000)
    })

    test('product detail page should load within 2 seconds', async () => {
      // First get a product URL
      await page.goto('/products')
      await page.waitForSelector('[data-testid="product-card"]')
      
      const firstProduct = page.locator('[data-testid="product-card"]').first()
      await firstProduct.click()
      
      const startTime = Date.now()
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - startTime
      
      expect(loadTime).toBeLessThan(2000)
    })
  })

  test.describe('Core Web Vitals', () => {
    test('should have good Largest Contentful Paint (LCP)', async () => {
      await page.goto('/')
      
      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1]
            resolve(lastEntry.startTime)
          }).observe({ entryTypes: ['largest-contentful-paint'] })
        })
      })
      
      // LCP should be under 2.5 seconds
      expect(lcp).toBeLessThan(2500)
    })

    test('should have good First Input Delay (FID)', async () => {
      await page.goto('/')
      
      const fid = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const firstInput = entries[0]
            resolve(firstInput.processingStart - firstInput.startTime)
          }).observe({ entryTypes: ['first-input'] })
        })
      })
      
      // FID should be under 100ms
      expect(fid).toBeLessThan(100)
    })

    test('should have good Cumulative Layout Shift (CLS)', async () => {
      await page.goto('/')
      
      const cls = await page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value
              }
            }
            resolve(clsValue)
          }).observe({ entryTypes: ['layout-shift'] })
        })
      })
      
      // CLS should be under 0.1
      expect(cls).toBeLessThan(0.1)
    })
  })

  test.describe('Bundle Size Analysis', () => {
    test('should have reasonable JavaScript bundle size', async () => {
      await page.goto('/')
      
      const bundleSize = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource')
        const jsResources = resources.filter(r => r.name.includes('.js'))
        const totalSize = jsResources.reduce((sum, r) => sum + (r as any).transferSize, 0)
        return totalSize
      })
      
      // Total JS bundle should be under 1MB
      expect(bundleSize).toBeLessThan(1024 * 1024)
    })

    test('should have optimized CSS bundle size', async () => {
      await page.goto('/')
      
      const cssSize = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource')
        const cssResources = resources.filter(r => r.name.includes('.css'))
        const totalSize = cssResources.reduce((sum, r) => sum + (r as any).transferSize, 0)
        return totalSize
      })
      
      // Total CSS bundle should be under 100KB
      expect(cssSize).toBeLessThan(100 * 1024)
    })
  })

  test.describe('Image Performance', () => {
    test('should load images efficiently', async () => {
      await page.goto('/products')
      await page.waitForSelector('[data-testid="product-card"]')
      
      const imageLoadTimes = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'))
        return images.map(img => {
          const startTime = performance.now()
          return new Promise((resolve) => {
            img.onload = () => {
              const loadTime = performance.now() - startTime
              resolve(loadTime)
            }
            img.onerror = () => resolve(0)
          })
        })
      })
      
      // Wait for all images to load
      await Promise.all(imageLoadTimes)
      
      // Check that images loaded reasonably quickly
      const loadTimes = await Promise.all(imageLoadTimes)
      const avgLoadTime = loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length
      
      expect(avgLoadTime).toBeLessThan(1000) // Average load time under 1 second
    })

    test('should use optimized image formats', async () => {
      await page.goto('/products')
      await page.waitForSelector('[data-testid="product-card"]')
      
      const imageFormats = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'))
        return images.map(img => {
          const src = img.src
          if (src.includes('webp')) return 'webp'
          if (src.includes('avif')) return 'avif'
          if (src.includes('.jpg') || src.includes('.jpeg')) return 'jpeg'
          if (src.includes('.png')) return 'png'
          return 'unknown'
        })
      })
      
      // Should have some modern formats
      const modernFormats = imageFormats.filter(format => ['webp', 'avif'].includes(format))
      expect(modernFormats.length).toBeGreaterThan(0)
    })
  })

  test.describe('API Performance', () => {
    test('products API should respond quickly', async () => {
      const startTime = Date.now()
      const response = await page.request.get('/api/products')
      const responseTime = Date.now() - startTime
      
      expect(response.status()).toBe(200)
      expect(responseTime).toBeLessThan(1000) // Under 1 second
    })

    test('categories API should respond quickly', async () => {
      const startTime = Date.now()
      const response = await page.request.get('/api/categories')
      const responseTime = Date.now() - startTime
      
      expect(response.status()).toBe(200)
      expect(responseTime).toBeLessThan(500) // Under 500ms
    })

    test('search API should respond quickly', async () => {
      const startTime = Date.now()
      const response = await page.request.get('/api/search?q=test')
      const responseTime = Date.now() - startTime
      
      expect(response.status()).toBe(200)
      expect(responseTime).toBeLessThan(1000) // Under 1 second
    })
  })

  test.describe('Caching Performance', () => {
    test('should cache static assets', async () => {
      await page.goto('/')
      
      // Check for cache headers
      const response = await page.request.get('/')
      const cacheControl = response.headers()['cache-control']
      
      expect(cacheControl).toBeDefined()
    })

    test('should cache API responses', async () => {
      // First request
      const response1 = await page.request.get('/api/products')
      expect(response1.status()).toBe(200)
      
      // Second request should be faster (cached)
      const startTime = Date.now()
      const response2 = await page.request.get('/api/products')
      const responseTime = Date.now() - startTime
      
      expect(response2.status()).toBe(200)
      expect(responseTime).toBeLessThan(100) // Should be very fast if cached
    })
  })

  test.describe('Memory Usage', () => {
    test('should not have memory leaks', async () => {
      await page.goto('/')
      
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0
      })
      
      // Navigate around to trigger potential memory leaks
      await page.goto('/products')
      await page.goto('/categories')
      await page.goto('/')
      
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0
      })
      
      // Memory usage shouldn't increase dramatically
      const memoryIncrease = finalMemory - initialMemory
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024) // Less than 10MB increase
    })
  })

  test.describe('Network Performance', () => {
    test('should minimize network requests', async () => {
      await page.goto('/')
      
      const requestCount = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource')
        return resources.length
      })
      
      // Should not have too many requests
      expect(requestCount).toBeLessThan(50)
    })

    test('should use efficient compression', async () => {
      const response = await page.request.get('/')
      const contentEncoding = response.headers()['content-encoding']
      
      // Should use gzip or brotli compression
      expect(['gzip', 'br', 'deflate']).toContain(contentEncoding)
    })
  })

  test.describe('Mobile Performance', () => {
    test('should perform well on mobile devices', async () => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      const startTime = Date.now()
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - startTime
      
      // Should load within 3 seconds on mobile
      expect(loadTime).toBeLessThan(3000)
    })

    test('should have good mobile Core Web Vitals', async () => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')
      
      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const lastEntry = entries[entries.length - 1]
            resolve(lastEntry.startTime)
          }).observe({ entryTypes: ['largest-contentful-paint'] })
        })
      })
      
      // Mobile LCP should be under 4 seconds
      expect(lcp).toBeLessThan(4000)
    })
  })

  test.describe('Database Performance', () => {
    test('should handle concurrent requests efficiently', async () => {
      // Make multiple concurrent requests
      const promises = Array(10).fill(0).map(() => 
        page.request.get('/api/products')
      )
      
      const startTime = Date.now()
      const responses = await Promise.all(promises)
      const totalTime = Date.now() - startTime
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status()).toBe(200)
      })
      
      // Should handle concurrent requests efficiently
      expect(totalTime).toBeLessThan(5000) // Under 5 seconds for 10 concurrent requests
    })
  })

  test.describe('Error Recovery Performance', () => {
    test('should recover quickly from errors', async () => {
      // Simulate network error
      await page.route('**/api/products', route => {
        route.abort()
      })
      
      const startTime = Date.now()
      await page.goto('/products')
      
      // Wait for error handling
      await page.waitForSelector('[data-testid="error-message"]')
      const errorTime = Date.now() - startTime
      
      // Should show error quickly
      expect(errorTime).toBeLessThan(2000)
      
      // Restore network
      await page.unroute('**/api/products')
      
      // Should recover quickly
      const recoveryStartTime = Date.now()
      await page.reload()
      await page.waitForLoadState('networkidle')
      const recoveryTime = Date.now() - recoveryStartTime
      
      expect(recoveryTime).toBeLessThan(3000)
    })
  })
})




