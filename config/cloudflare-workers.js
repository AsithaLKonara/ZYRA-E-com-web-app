// CloudFlare Workers script for NEOSHOP ULTRA
// This script handles edge caching, security, and performance optimization

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Security headers
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  }

  // CORS headers for API requests
  if (url.pathname.startsWith('/api/')) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://neoshop-ultra.com',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
    }
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: { ...securityHeaders, ...corsHeaders }
      })
    }
  }

  // Cache configuration
  const cacheKey = new Request(url.toString(), request)
  const cache = caches.default
  
  // Check cache for GET requests
  if (request.method === 'GET') {
    const cachedResponse = await cache.match(cacheKey)
    if (cachedResponse) {
      // Add cache hit header
      const response = new Response(cachedResponse.body, cachedResponse)
      response.headers.set('X-Cache', 'HIT')
      return response
    }
  }

  // Forward request to origin
  const response = await fetch(request)
  
  // Clone response for caching
  const responseToCache = response.clone()
  
  // Add security headers to response
  const newHeaders = new Headers(response.headers)
  Object.entries(securityHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value)
  })

  // Cache static assets
  if (request.method === 'GET' && (
    url.pathname.startsWith('/static/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.gif') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico')
  )) {
    // Cache for 1 year
    newHeaders.set('Cache-Control', 'public, max-age=31536000, immutable')
    newHeaders.set('X-Cache', 'MISS')
    
    // Store in cache
    event.waitUntil(cache.put(cacheKey, responseToCache))
  } else if (request.method === 'GET' && url.pathname.startsWith('/api/')) {
    // Cache API responses for 5 minutes
    newHeaders.set('Cache-Control', 'public, max-age=300')
    newHeaders.set('X-Cache', 'MISS')
    
    // Store in cache
    event.waitUntil(cache.put(cacheKey, responseToCache))
  } else {
    newHeaders.set('X-Cache', 'MISS')
  }

  // Add CORS headers for API responses
  if (url.pathname.startsWith('/api/')) {
    newHeaders.set('Access-Control-Allow-Origin', 'https://neoshop-ultra.com')
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    newHeaders.set('Access-Control-Allow-Credentials', 'true')
  }

  return new Response(responseToCache.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  })
}

// Rate limiting (basic implementation)
const rateLimitMap = new Map()

function rateLimit(ip, limit = 100, window = 60000) {
  const now = Date.now()
  const windowStart = now - window
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, [])
  }
  
  const requests = rateLimitMap.get(ip)
  const validRequests = requests.filter(time => time > windowStart)
  
  if (validRequests.length >= limit) {
    return false
  }
  
  validRequests.push(now)
  rateLimitMap.set(ip, validRequests)
  return true
}

// Bot detection and blocking
function isBot(userAgent) {
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /php/i,
    /java/i,
  ]
  
  return botPatterns.some(pattern => pattern.test(userAgent))
}

// DDoS protection
function isDDoSAttack(ip, requests) {
  const now = Date.now()
  const window = 60000 // 1 minute
  const threshold = 100 // 100 requests per minute
  
  const recentRequests = requests.filter(time => time > now - window)
  return recentRequests.length > threshold
}




