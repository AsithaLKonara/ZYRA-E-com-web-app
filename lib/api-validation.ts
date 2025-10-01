import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateAndSanitizeInput } from './validation'
import { sanitizeObject } from './sanitization'
import { logger } from './logger'

// Validation middleware factory
export function createValidationMiddleware<T>(
  schema: z.ZodSchema<T>,
  options: {
    body?: boolean
    query?: boolean
    params?: boolean
    sanitize?: boolean
  } = {}
) {
  return (handler: (req: NextRequest, validatedData: T) => Promise<NextResponse>) => {
    return async (req: NextRequest) => {
      try {
        let dataToValidate: any = {}

        // Extract data based on options
        if (options.body) {
          const body = await req.json().catch(() => ({}))
          dataToValidate = { ...dataToValidate, ...body }
        }

        if (options.query) {
          const url = new URL(req.url)
          const queryParams: any = {}
          url.searchParams.forEach((value, key) => {
            queryParams[key] = value
          })
          dataToValidate = { ...dataToValidate, ...queryParams }
        }

        if (options.params) {
          // Extract params from URL path (would need to be passed from route handler)
          // This is a placeholder - actual implementation would depend on Next.js routing
        }

        // Validate and sanitize input
        const validationResult = options.sanitize
          ? validateAndSanitizeInput(schema, dataToValidate)
          : { success: true, data: dataToValidate }

        if (!validationResult.success) {
          const errors = 'errors' in validationResult ? validationResult.errors || [] : []
          logger.warn('API validation failed:', {
            url: req.url,
            method: req.method,
            errors,
          })

          return NextResponse.json(
            {
              success: false,
              error: 'Invalid input data',
              details: errors,
            },
            { status: 400 }
          )
        }

        // Add sanitized data to request object
        ;(req as any).validatedData = validationResult.data

        return handler(req, validationResult.data!)
      } catch (error) {
        logger.error('Validation middleware error:', error)
        return NextResponse.json(
          {
            success: false,
            error: 'Internal server error',
          },
          { status: 500 }
        )
      }
    }
  }
}

// Request body validation
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return createValidationMiddleware(schema, { body: true, sanitize: true })
}

// Query parameters validation
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return createValidationMiddleware(schema, { query: true, sanitize: true })
}

// Combined validation (body + query)
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return createValidationMiddleware(schema, { body: true, query: true, sanitize: true })
}

// File upload validation
export function validateFileUpload(options: {
  maxSize: number
  allowedTypes: string[]
  maxFiles?: number
}) {
  return async (req: NextRequest) => {
    try {
      const formData = await req.formData()
      const files = formData.getAll('files') as File[]

      // Check file count
      if (options.maxFiles && files.length > options.maxFiles) {
        return NextResponse.json(
          {
            success: false,
            error: `Maximum ${options.maxFiles} files allowed`,
          },
          { status: 400 }
        )
      }

      // Validate each file
      for (const file of files) {
        // Check file size
        if (file.size > options.maxSize) {
          return NextResponse.json(
            {
              success: false,
              error: `File ${file.name} exceeds maximum size of ${options.maxSize} bytes`,
            },
            { status: 400 }
          )
        }

        // Check file type
        const fileExtension = file.name.split('.').pop()?.toLowerCase()
        if (!fileExtension || !options.allowedTypes.includes(fileExtension)) {
          return NextResponse.json(
            {
              success: false,
              error: `File type .${fileExtension} is not allowed`,
            },
            { status: 400 }
          )
        }

        // Check for malicious file names
        if (containsMaliciousFilename(file.name)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid file name',
            },
            { status: 400 }
          )
        }
      }

      // Add validated files to request
      ;(req as any).validatedFiles = files
      return null // Continue to handler
    } catch (error) {
      logger.error('File upload validation error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'File upload validation failed',
        },
        { status: 500 }
      )
    }
  }
}

// Rate limiting validation
export function validateRateLimit(options: {
  max: number
  window: string
  keyGenerator?: (req: NextRequest) => string
}) {
  return async (req: NextRequest) => {
    try {
      // This would integrate with your rate limiting service
      // For now, it's a placeholder that always allows requests
      return null
    } catch (error) {
      logger.error('Rate limit validation error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit validation failed',
        },
        { status: 500 }
      )
    }
  }
}

// Content-Type validation
export function validateContentType(allowedTypes: string[]) {
  return async (req: NextRequest) => {
    const contentType = req.headers.get('content-type')
    
    if (!contentType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content-Type header is required',
        },
        { status: 400 }
      )
    }

    const isValidType = allowedTypes.some(type => 
      contentType.toLowerCase().includes(type.toLowerCase())
    )

    if (!isValidType) {
      return NextResponse.json(
        {
          success: false,
          error: `Content-Type ${contentType} is not allowed`,
        },
        { status: 400 }
      )
    }

    return null
  }
}

// Request size validation
export function validateRequestSize(maxSize: number) {
  return async (req: NextRequest) => {
    const contentLength = req.headers.get('content-length')
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: `Request size exceeds maximum of ${maxSize} bytes`,
        },
        { status: 413 }
      )
    }

    return null
  }
}

// API key validation
export function validateApiKey(validKeys: string[]) {
  return async (req: NextRequest) => {
    const apiKey = req.headers.get('x-api-key')
    
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'API key is required',
        },
        { status: 401 }
      )
    }

    if (!validKeys.includes(apiKey)) {
      logger.warn('Invalid API key used:', { apiKey: apiKey.substring(0, 8) + '...' })
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid API key',
        },
        { status: 401 }
      )
    }

    return null
  }
}

// Origin validation (CORS)
export function validateOrigin(allowedOrigins: string[]) {
  return async (req: NextRequest) => {
    const origin = req.headers.get('origin')
    
    if (origin && !allowedOrigins.includes(origin)) {
      logger.warn('Request from disallowed origin:', { origin })
      return NextResponse.json(
        {
          success: false,
          error: 'Origin not allowed',
        },
        { status: 403 }
      )
    }

    return null
  }
}

// Combine multiple validation middlewares
export function combineValidators(...validators: Array<(req: NextRequest) => Promise<NextResponse | null>>) {
  return async (req: NextRequest) => {
    for (const validator of validators) {
      const result = await validator(req)
      if (result) {
        return result // Return error response
      }
    }
    return null // All validations passed
  }
}

// Helper function to check for malicious filenames
function containsMaliciousFilename(filename: string): boolean {
  const maliciousPatterns = [
    /\.\.\//g,
    /\.\.\\/g,
    /<script/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+=/gi,
  ]

  return maliciousPatterns.some(pattern => pattern.test(filename))
}

// Validation error response helper
export function createValidationErrorResponse(errors: string[]) {
  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      details: errors,
    },
    { status: 400 }
  )
}

// Success response helper
export function createSuccessResponse(data: any, message?: string) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status: 200 }
  )
}

// Error response helper
export function createErrorResponse(error: string, status: number = 500) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  )
}

// Type-safe request handler with validation
export type ValidatedRequestHandler<T> = (
  req: NextRequest,
  validatedData: T
) => Promise<NextResponse>

// Create a type-safe API route handler
export function createApiHandler<T>(
  schema: z.ZodSchema<T>,
  handler: ValidatedRequestHandler<T>,
  options: {
    validateBody?: boolean
    validateQuery?: boolean
    validateParams?: boolean
    sanitize?: boolean
  } = {}
) {
  const validator = createValidationMiddleware(schema, options)
  return validator(handler)
}

