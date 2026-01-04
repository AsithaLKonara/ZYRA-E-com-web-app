// Use server-side compatible sanitization
const DOMPurify = typeof window !== 'undefined' ? require('isomorphic-dompurify').default : null
import { logger } from './logger'

// HTML sanitization configuration
const DOMPurifyConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
  ALLOWED_ATTR: ['href', 'title', 'target'],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SANITIZE_DOM: true,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
}

// XSS protection configuration
const XSSConfig = {
  // Blocked patterns for XSS prevention
  blockedPatterns: [
    /javascript:/gi,
    /vbscript:/gi,
    /data:/gi,
    /on\w+\s*=/gi,
    /<script/gi,
    /<\/script>/gi,
    /<iframe/gi,
    /<\/iframe>/gi,
    /<object/gi,
    /<\/object>/gi,
    /<embed/gi,
    /<link/gi,
    /<meta/gi,
    /expression\s*\(/gi,
    /url\s*\(/gi,
  ],
  
  // Allowed protocols
  allowedProtocols: ['http:', 'https:', 'mailto:'],
  
  // Maximum string length
  maxLength: 10000,
}

// SQL injection protection patterns
const SQLInjectionPatterns = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
  /(\b(OR|AND)\s+'.*'\s*=\s*'.*')/gi,
  /(UNION\s+SELECT)/gi,
  /(DROP\s+TABLE)/gi,
  /(DELETE\s+FROM)/gi,
  /(INSERT\s+INTO)/gi,
  /(UPDATE\s+SET)/gi,
  /(--|\/\*|\*\/)/gi,
  /(xp_|sp_)/gi,
]

// Path traversal protection patterns
const PathTraversalPatterns = [
  /\.\.\//g,
  /\.\.\\/g,
  /\.\.%2f/gi,
  /\.\.%5c/gi,
  /\.\.%252f/gi,
  /\.\.%255c/gi,
]

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHTML(content: string): string {
  try {
    if (!content || typeof content !== 'string') {
      return ''
    }

    // Check for blocked patterns first
    for (const pattern of XSSConfig.blockedPatterns) {
      if (pattern.test(content)) {
        logger.warn('XSS pattern detected and blocked:', { content: content.substring(0, 100) })
        return ''
      }
    }

    // Use DOMPurify for HTML sanitization if available
    const sanitized = DOMPurify ? DOMPurify.sanitize(content, DOMPurifyConfig) : content.replace(/<[^>]*>/g, '')
    
    // Additional length check
    if (sanitized.length > XSSConfig.maxLength) {
      logger.warn('Content too long, truncated:', { length: sanitized.length })
      return sanitized.substring(0, XSSConfig.maxLength)
    }

    return sanitized
  } catch (error) {
    logger.error('Error sanitizing HTML:', {}, error instanceof Error ? error : new Error(String(error)))
    return ''
  }
}

/**
 * Sanitize plain text content
 */
export function sanitizeText(text: string): string {
  try {
    if (!text || typeof text !== 'string') {
      return ''
    }

    return text
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/[^\x20-\x7E]/g, '') // Remove non-ASCII characters
      .substring(0, XSSConfig.maxLength) // Limit length
  } catch (error) {
    logger.error('Error sanitizing text:', {}, error instanceof Error ? error : new Error(String(error)))
    return ''
  }
}

/**
 * Sanitize URL to prevent malicious redirects
 */
export function sanitizeURL(url: string): string {
  try {
    if (!url || typeof url !== 'string') {
      return ''
    }

    const trimmedUrl = url.trim()
    
    // Check if URL starts with allowed protocol
    const hasAllowedProtocol = XSSConfig.allowedProtocols.some(protocol => 
      trimmedUrl.toLowerCase().startsWith(protocol)
    )

    if (!hasAllowedProtocol && !trimmedUrl.startsWith('/')) {
      // If no protocol, assume relative URL
      return sanitizeText(trimmedUrl)
    }

    // Parse and validate URL
    const urlObj = new URL(trimmedUrl)
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      logger.warn('Invalid URL protocol blocked:', { url: trimmedUrl })
      return ''
    }

    return urlObj.toString()
  } catch (error) {
    logger.warn('Invalid URL blocked:', { url, error: error instanceof Error ? error.message : String(error) })
    return ''
  }
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  try {
    if (!filename || typeof filename !== 'string') {
      return ''
    }

    let sanitized = filename.trim()
    
    // Remove path traversal patterns
    for (const pattern of PathTraversalPatterns) {
      sanitized = sanitized.replace(pattern, '')
    }

    // Remove dangerous characters
    sanitized = sanitized.replace(/[<>:"/\\|?*]/g, '')
    
    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1f\x7f]/g, '')
    
    // Limit length
    sanitized = sanitized.substring(0, 255)
    
    // Ensure filename is not empty
    if (!sanitized) {
      return 'unnamed'
    }

    return sanitized
  } catch (error) {
    logger.error('Error sanitizing filename:', {}, error instanceof Error ? error : new Error(String(error)))
    return 'unnamed'
  }
}

/**
 * Sanitize input to prevent SQL injection
 */
export function sanitizeSQLInput(input: string): string {
  try {
    if (!input || typeof input !== 'string') {
      return ''
    }

    let sanitized = input.trim()
    
    // Check for SQL injection patterns
    for (const pattern of SQLInjectionPatterns) {
      if (pattern.test(sanitized)) {
        logger.warn('SQL injection pattern detected:', { input: sanitized.substring(0, 100) })
        return ''
      }
    }

    // Escape single quotes and backslashes
    sanitized = sanitized.replace(/'/g, "''")
    sanitized = sanitized.replace(/\\/g, '\\\\')
    
    return sanitized
  } catch (error) {
    logger.error('Error sanitizing SQL input:', {}, error instanceof Error ? error : new Error(String(error)))
    return ''
  }
}

/**
 * Sanitize JSON input to prevent prototype pollution
 */
export function sanitizeJSONInput(jsonString: string): any {
  try {
    if (!jsonString || typeof jsonString !== 'string') {
      return null
    }

    const parsed = JSON.parse(jsonString)
    
    // Remove prototype pollution attempts
    if (parsed && typeof parsed === 'object') {
      delete (parsed as any).__proto__
      delete (parsed as any).constructor
      delete (parsed as any).prototype
    }

    return parsed
  } catch (error) {
    logger.error('Error sanitizing JSON input:', {}, error instanceof Error ? error : new Error(String(error)))
    return null
  }
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  try {
    if (!email || typeof email !== 'string') {
      return ''
    }

    const sanitized = email.trim().toLowerCase()
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(sanitized)) {
      return ''
    }

    return sanitized
  } catch (error) {
    logger.error('Error sanitizing email:', {}, error instanceof Error ? error : new Error(String(error)))
    return ''
  }
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(phone: string): string {
  try {
    if (!phone || typeof phone !== 'string') {
      return ''
    }

    // Remove all non-digit characters except + at the beginning
    let sanitized = phone.trim()
    if (sanitized.startsWith('+')) {
      sanitized = '+' + sanitized.substring(1).replace(/\D/g, '')
    } else {
      sanitized = sanitized.replace(/\D/g, '')
    }

    // Basic phone validation (7-15 digits)
    if (sanitized.length < 7 || sanitized.length > 15) {
      return ''
    }

    return sanitized
  } catch (error) {
    logger.error('Error sanitizing phone:', {}, error instanceof Error ? error : new Error(String(error)))
    return ''
  }
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj: any): any {
  try {
    if (obj === null || obj === undefined) {
      return obj
    }

    if (typeof obj === 'string') {
      return sanitizeText(obj)
    }

    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item))
    }

    if (typeof obj === 'object') {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = sanitizeText(key)
        sanitized[sanitizedKey] = sanitizeObject(value)
      }
      return sanitized
    }

    return obj
  } catch (error) {
    logger.error('Error sanitizing object:', {}, error instanceof Error ? error : new Error(String(error)))
    return null
  }
}

/**
 * Check if input contains malicious patterns
 */
export function containsMaliciousPatterns(input: string): boolean {
  try {
    if (!input || typeof input !== 'string') {
      return false
    }

    // Check XSS patterns
    for (const pattern of XSSConfig.blockedPatterns) {
      if (pattern.test(input)) {
        return true
      }
    }

    // Check SQL injection patterns
    for (const pattern of SQLInjectionPatterns) {
      if (pattern.test(input)) {
        return true
      }
    }

    // Check path traversal patterns
    for (const pattern of PathTraversalPatterns) {
      if (pattern.test(input)) {
        return true
      }
    }

    return false
  } catch (error) {
    logger.error('Error checking malicious patterns:', {}, error instanceof Error ? error : new Error(String(error)))
    return true // Assume malicious if error occurs
  }
}

/**
 * Generate secure random string
 */
export function generateSecureToken(length: number = 32): string {
  try {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    return result
  } catch (error) {
    logger.error('Error generating secure token:', {}, error instanceof Error ? error : new Error(String(error)))
    return ''
  }
}

/**
 * Hash sensitive data for logging
 */
export function hashSensitiveData(data: string): string {
  try {
    if (!data || typeof data !== 'string') {
      return '[EMPTY]'
    }

    // Simple hash for logging purposes (not for security)
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return `[HASH:${Math.abs(hash).toString(16)}]`
  } catch (error) {
    logger.error('Error hashing sensitive data:', {}, error instanceof Error ? error : new Error(String(error)))
    return '[ERROR]'
  }
}

