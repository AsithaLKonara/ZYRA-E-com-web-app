// Service Worker for ZYRA Fashion
const CACHE_NAME = 'zyra-ultra-v1'
const STATIC_CACHE = 'zyra-static-v1'
const DYNAMIC_CACHE = 'zyra-dynamic-v1'
const API_CACHE = 'zyra-api-v1'

// Cache strategies
const CACHE_STRATEGIES = {
  STATIC: 'cache-first',
  DYNAMIC: 'stale-while-revalidate',
  API: 'network-first',
  IMAGES: 'cache-first',
}

// Cache patterns
const CACHE_PATTERNS = {
  STATIC: [
    '/',
    '/products',
    '/categories',
    '/about',
    '/contact',
    '/manifest.json',
    '/offline.html',
  ],
  DYNAMIC: [
    '/products/',
    '/categories/',
    '/search',
  ],
  API: [
    '/api/products',
    '/api/categories',
    '/api/search',
  ],
  IMAGES: [
    '/images/',
    '/icons/',
  ],
}

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(CACHE_PATTERNS.STATIC)
      }),
      
      // Cache dynamic pages
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.addAll(CACHE_PATTERNS.DYNAMIC)
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting(),
    ])
  )
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      
      // Take control of all clients
      self.clients.claim(),
    ])
  )
})

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return
  }
  
  // Determine cache strategy
  const strategy = getCacheStrategy(url)
  
  event.respondWith(
    handleRequest(request, strategy)
  )
})

// Handle different cache strategies
async function handleRequest(request, strategy) {
  const url = new URL(request.url)
  
  try {
    switch (strategy) {
      case CACHE_STRATEGIES.STATIC:
        return await cacheFirst(request, STATIC_CACHE)
      
      case CACHE_STRATEGIES.DYNAMIC:
        return await staleWhileRevalidate(request, DYNAMIC_CACHE)
      
      case CACHE_STRATEGIES.API:
        return await networkFirst(request, API_CACHE)
      
      case CACHE_STRATEGIES.IMAGES:
        return await cacheFirst(request, STATIC_CACHE)
      
      default:
        return await networkFirst(request, DYNAMIC_CACHE)
    }
  } catch (error) {
    console.error('Service Worker: Fetch error:', error)
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return await caches.match('/offline.html')
    }
    
    // Return cached version if available
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return error response
    return new Response('Network error', { status: 503 })
  }
}

// Cache first strategy
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  const networkResponse = await fetch(request)
  
  if (networkResponse.ok) {
    const cache = await caches.open(cacheName)
    cache.put(request, networkResponse.clone())
  }
  
  return networkResponse
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request)
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(cacheName)
      cache.then((cache) => {
        cache.put(request, networkResponse.clone())
      })
    }
    return networkResponse
  })
  
  return cachedResponse || fetchPromise
}

// Network first strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    throw error
  }
}

// Determine cache strategy based on URL
function getCacheStrategy(url) {
  const pathname = url.pathname
  
  // Static assets
  if (pathname.startsWith('/_next/static/') || 
      pathname.startsWith('/static/') ||
      pathname.endsWith('.js') ||
      pathname.endsWith('.css') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.jpeg') ||
      pathname.endsWith('.gif') ||
      pathname.endsWith('.webp') ||
      pathname.endsWith('.svg') ||
      pathname.endsWith('.ico')) {
    return CACHE_STRATEGIES.STATIC
  }
  
  // API endpoints
  if (pathname.startsWith('/api/')) {
    return CACHE_STRATEGIES.API
  }
  
  // Images
  if (pathname.startsWith('/images/') || pathname.startsWith('/icons/')) {
    return CACHE_STRATEGIES.IMAGES
  }
  
  // Dynamic pages
  if (pathname.startsWith('/products/') || 
      pathname.startsWith('/categories/') ||
      pathname.startsWith('/search')) {
    return CACHE_STRATEGIES.DYNAMIC
  }
  
  // Default to network first
  return CACHE_STRATEGIES.API
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered')
  
  if (event.tag === 'cart-sync') {
    event.waitUntil(syncCart())
  } else if (event.tag === 'wishlist-sync') {
    event.waitUntil(syncWishlist())
  } else if (event.tag === 'order-sync') {
    event.waitUntil(syncOrders())
  }
})

// Sync cart data
async function syncCart() {
  try {
    const cartData = await getStoredData('cart')
    if (cartData && cartData.length > 0) {
      const response = await fetch('/api/cart/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartData),
      })
      
      if (response.ok) {
        await clearStoredData('cart')
        console.log('Service Worker: Cart synced successfully')
      }
    }
  } catch (error) {
    console.error('Service Worker: Cart sync failed:', error)
  }
}

// Sync wishlist data
async function syncWishlist() {
  try {
    const wishlistData = await getStoredData('wishlist')
    if (wishlistData && wishlistData.length > 0) {
      const response = await fetch('/api/wishlist/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wishlistData),
      })
      
      if (response.ok) {
        await clearStoredData('wishlist')
        console.log('Service Worker: Wishlist synced successfully')
      }
    }
  } catch (error) {
    console.error('Service Worker: Wishlist sync failed:', error)
  }
}

// Sync orders data
async function syncOrders() {
  try {
    const ordersData = await getStoredData('orders')
    if (ordersData && ordersData.length > 0) {
      const response = await fetch('/api/orders/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ordersData),
      })
      
      if (response.ok) {
        await clearStoredData('orders')
        console.log('Service Worker: Orders synced successfully')
      }
    }
  } catch (error) {
    console.error('Service Worker: Orders sync failed:', error)
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from ZYRA Fashion',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/checkmark.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png',
      },
    ],
  }
  
  event.waitUntil(
    self.registration.showNotification('ZYRA Fashion', options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked')
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  } else if (event.data && event.data.type === 'CACHE_URLS') {
    const urlsToCache = event.data.urls
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.addAll(urlsToCache)
      })
    )
  }
})

// Utility functions
async function getStoredData(key) {
  try {
    const cache = await caches.open('zyra-data')
    const response = await cache.match(`/data/${key}`)
    return response ? await response.json() : null
  } catch (error) {
    console.error('Service Worker: Error getting stored data:', error)
    return null
  }
}

async function clearStoredData(key) {
  try {
    const cache = await caches.open('zyra-data')
    await cache.delete(`/data/${key}`)
  } catch (error) {
    console.error('Service Worker: Error clearing stored data:', error)
  }
}




