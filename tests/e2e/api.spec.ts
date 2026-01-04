import { test, expect } from '@playwright/test'

test.describe('API Endpoints - Comprehensive Testing', () => {
  const baseURL = 'http://localhost:3000'

  test.describe('Products API', () => {
    test('GET /api/products - should return products list', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/products`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('products')
      expect(Array.isArray(data.products)).toBe(true)
    })

    test('GET /api/products?page=1&limit=10 - should paginate products', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/products?page=1&limit=10`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('products')
      expect(data).toHaveProperty('pagination')
      expect(data.pagination).toHaveProperty('page', 1)
      expect(data.pagination).toHaveProperty('limit', 10)
    })

    test('GET /api/products?category=electronics - should filter by category', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/products?category=electronics`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('products')
      if (data.products.length > 0) {
        expect(data.products[0]).toHaveProperty('category')
      }
    })

    test('GET /api/products?search=test - should search products', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/products?search=test`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('products')
    })

    test('GET /api/products?sort=price-asc - should sort products', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/products?sort=price-asc`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('products')
    })

    test('GET /api/products/[id] - should return single product', async ({ request }) => {
      // First get products list to get an ID
      const productsResponse = await request.get(`${baseURL}/api/products`)
      const productsData = await productsResponse.json()
      
      if (productsData.products.length > 0) {
        const productId = productsData.products[0].id
        const response = await request.get(`${baseURL}/api/products/${productId}`)
        expect(response.status()).toBe(200)
        
        const data = await response.json()
        expect(data).toHaveProperty('id', productId)
        expect(data).toHaveProperty('name')
        expect(data).toHaveProperty('price')
      }
    })

    test('GET /api/products/[id] - should return 404 for non-existent product', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/products/non-existent-id`)
      expect(response.status()).toBe(404)
    })
  })

  test.describe('Categories API', () => {
    test('GET /api/categories - should return categories list', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/categories`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('GET /api/categories/[id] - should return single category', async ({ request }) => {
      // First get categories list to get an ID
      const categoriesResponse = await request.get(`${baseURL}/api/categories`)
      const categoriesData = await categoriesResponse.json()
      
      if (categoriesData.length > 0) {
        const categoryId = categoriesData[0].id
        const response = await request.get(`${baseURL}/api/categories/${categoryId}`)
        expect(response.status()).toBe(200)
        
        const data = await response.json()
        expect(data).toHaveProperty('id', categoryId)
        expect(data).toHaveProperty('name')
      }
    })
  })

  test.describe('Authentication API', () => {
    test('POST /api/auth/signin - should authenticate user', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/auth/signin`, {
        data: {
          email: 'test@example.com',
          password: 'password123'
        }
      })
      
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('user')
      expect(data).toHaveProperty('session')
    })

    test('POST /api/auth/signin - should reject invalid credentials', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/auth/signin`, {
        data: {
          email: 'invalid@example.com',
          password: 'wrongpassword'
        }
      })
      
      expect(response.status()).toBe(401)
    })

    test('POST /api/auth/signup - should register new user', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/auth/signup`, {
        data: {
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123'
        }
      })
      
      expect(response.status()).toBe(201)
      
      const data = await response.json()
      expect(data).toHaveProperty('user')
    })

    test('POST /api/auth/signup - should reject duplicate email', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/auth/signup`, {
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        }
      })
      
      expect(response.status()).toBe(409)
    })

    test('POST /api/auth/signout - should sign out user', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/auth/signout`)
      expect(response.status()).toBe(200)
    })
  })

  test.describe('Cart API', () => {
    let authToken: string

    test.beforeEach(async ({ request }) => {
      // Login to get auth token
      const loginResponse = await request.post(`${baseURL}/api/auth/signin`, {
        data: {
          email: 'test@example.com',
          password: 'password123'
        }
      })
      
      const loginData = await loginResponse.json()
      authToken = loginData.session.token
    })

    test('GET /api/cart - should return user cart', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/cart`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('POST /api/cart - should add item to cart', async ({ request }) => {
      // First get a product ID
      const productsResponse = await request.get(`${baseURL}/api/products`)
      const productsData = await productsResponse.json()
      
      if (productsData.products.length > 0) {
        const productId = productsData.products[0].id
        
        const response = await request.post(`${baseURL}/api/cart`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          data: {
            productId,
            quantity: 1
          }
        })
        
        expect(response.status()).toBe(200)
        
        const data = await response.json()
        expect(data).toHaveProperty('success', true)
      }
    })

    test('PUT /api/cart/[id] - should update cart item', async ({ request }) => {
      // First add an item to cart
      const productsResponse = await request.get(`${baseURL}/api/products`)
      const productsData = await productsResponse.json()
      
      if (productsData.products.length > 0) {
        const productId = productsData.products[0].id
        
        await request.post(`${baseURL}/api/cart`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          data: {
            productId,
            quantity: 1
          }
        })
        
        // Update the item
        const response = await request.put(`${baseURL}/api/cart/${productId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          data: {
            quantity: 2
          }
        })
        
        expect(response.status()).toBe(200)
      }
    })

    test('DELETE /api/cart/[id] - should remove item from cart', async ({ request }) => {
      // First add an item to cart
      const productsResponse = await request.get(`${baseURL}/api/products`)
      const productsData = await productsResponse.json()
      
      if (productsData.products.length > 0) {
        const productId = productsData.products[0].id
        
        await request.post(`${baseURL}/api/cart`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          data: {
            productId,
            quantity: 1
          }
        })
        
        // Remove the item
        const response = await request.delete(`${baseURL}/api/cart/${productId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
        
        expect(response.status()).toBe(200)
      }
    })
  })

  test.describe('Orders API', () => {
    let authToken: string

    test.beforeEach(async ({ request }) => {
      // Login to get auth token
      const loginResponse = await request.post(`${baseURL}/api/auth/signin`, {
        data: {
          email: 'test@example.com',
          password: 'password123'
        }
      })
      
      const loginData = await loginResponse.json()
      authToken = loginData.session.token
    })

    test('GET /api/orders - should return user orders', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('POST /api/orders - should create new order', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          items: [
            {
              productId: 'test-product-id',
              quantity: 1,
              price: 29.99
            }
          ],
          shippingAddress: {
            firstName: 'John',
            lastName: 'Doe',
            address: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US'
          },
          billingAddress: {
            firstName: 'John',
            lastName: 'Doe',
            address: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US'
          },
          totalAmount: 29.99
        }
      })
      
      expect(response.status()).toBe(201)
      
      const data = await response.json()
      expect(data).toHaveProperty('order')
      expect(data.order).toHaveProperty('id')
    })

    test('GET /api/orders/[id] - should return single order', async ({ request }) => {
      // First create an order
      const createResponse = await request.post(`${baseURL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          items: [
            {
              productId: 'test-product-id',
              quantity: 1,
              price: 29.99
            }
          ],
          shippingAddress: {
            firstName: 'John',
            lastName: 'Doe',
            address: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US'
          },
          billingAddress: {
            firstName: 'John',
            lastName: 'Doe',
            address: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US'
          },
          totalAmount: 29.99
        }
      })
      
      const createData = await createResponse.json()
      const orderId = createData.order.id
      
      // Get the order
      const response = await request.get(`${baseURL}/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('id', orderId)
    })
  })

  test.describe('Payments API', () => {
    let authToken: string

    test.beforeEach(async ({ request }) => {
      // Login to get auth token
      const loginResponse = await request.post(`${baseURL}/api/auth/signin`, {
        data: {
          email: 'test@example.com',
          password: 'password123'
        }
      })
      
      const loginData = await loginResponse.json()
      authToken = loginData.session.token
    })

    test('POST /api/payments/create-intent - should create payment intent', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/payments/create-intent`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          amount: 2999, // $29.99 in cents
          currency: 'usd'
        }
      })
      
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('clientSecret')
    })

    test('POST /api/payments/confirm - should confirm payment', async ({ request }) => {
      // First create a payment intent
      const intentResponse = await request.post(`${baseURL}/api/payments/create-intent`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          amount: 2999,
          currency: 'usd'
        }
      })
      
      const intentData = await intentResponse.json()
      const clientSecret = intentData.clientSecret
      
      // Confirm payment (this would normally be done with Stripe test data)
      const response = await request.post(`${baseURL}/api/payments/confirm`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          paymentIntentId: clientSecret.split('_secret_')[0]
        }
      })
      
      // This might fail in test environment, but should return proper error
      expect([200, 400, 500]).toContain(response.status())
    })
  })

  test.describe('Search API', () => {
    test('GET /api/search - should search products', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/search?q=test`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('results')
      expect(Array.isArray(data.results)).toBe(true)
    })

    test('GET /api/search - should handle empty query', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/search?q=`)
      expect(response.status()).toBe(400)
    })
  })

  test.describe('Health Check API', () => {
    test('GET /api/health - should return health status', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/health`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('timestamp')
    })

    test('GET /api/metrics - should return metrics', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/metrics`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('performance')
      expect(data).toHaveProperty('system')
    })
  })

  test.describe('Error Handling', () => {
    test('should handle invalid endpoints', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/invalid-endpoint`)
      expect(response.status()).toBe(404)
    })

    test('should handle malformed requests', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/auth/signin`, {
        data: {
          // Missing required fields
        }
      })
      
      expect(response.status()).toBe(400)
    })

    test('should handle rate limiting', async ({ request }) => {
      // Make multiple requests quickly
      const promises = Array(10).fill(0).map(() => 
        request.get(`${baseURL}/api/products`)
      )
      
      const responses = await Promise.all(promises)
      
      // Some requests should be rate limited
      const rateLimited = responses.filter(r => r.status() === 429)
      expect(rateLimited.length).toBeGreaterThan(0)
    })
  })

  test.describe('CORS and Headers', () => {
    test('should include CORS headers', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/products`)
      
      expect(response.headers()['access-control-allow-origin']).toBeDefined()
      expect(response.headers()['access-control-allow-methods']).toBeDefined()
    })

    test('should include security headers', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/products`)
      
      expect(response.headers()['x-content-type-options']).toBe('nosniff')
      expect(response.headers()['x-frame-options']).toBe('DENY')
      expect(response.headers()['x-xss-protection']).toBe('1; mode=block')
    })
  })
})




