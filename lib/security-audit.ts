import { logger } from './logger'
import { db } from './db-connection'
import { containsMaliciousPatterns } from './sanitization'

// Security audit types
interface SecurityAuditResult {
  timestamp: Date
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  details?: any
  resolved: boolean
}

interface SecurityMetrics {
  totalAudits: number
  criticalIssues: number
  highIssues: number
  mediumIssues: number
  lowIssues: number
  resolvedIssues: number
  lastAudit: Date
}

// Security audit categories
const AUDIT_CATEGORIES = {
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  INPUT_VALIDATION: 'input_validation',
  SQL_INJECTION: 'sql_injection',
  XSS: 'xss',
  CSRF: 'csrf',
  FILE_UPLOAD: 'file_upload',
  RATE_LIMITING: 'rate_limiting',
  DATA_EXPOSURE: 'data_exposure',
  CONFIGURATION: 'configuration',
} as const

// Security audit class
export class SecurityAuditor {
  private auditResults: SecurityAuditResult[] = []
  private isRunning = false

  // Run comprehensive security audit
  async runFullAudit(): Promise<SecurityAuditResult[]> {
    if (this.isRunning) {
      logger.warn('Security audit already running')
      return []
    }

    this.isRunning = true
    this.auditResults = []

    try {
      logger.info('Starting comprehensive security audit')

      // Run all audit checks
      await Promise.all([
        this.auditAuthentication(),
        this.auditAuthorization(),
        this.auditInputValidation(),
        this.auditSQLInjection(),
        this.auditXSS(),
        this.auditCSRF(),
        this.auditFileUpload(),
        this.auditRateLimiting(),
        this.auditDataExposure(),
        this.auditConfiguration(),
      ])

      // Save audit results
      await this.saveAuditResults()

      logger.info(`Security audit completed: ${this.auditResults.length} issues found`)
      return this.auditResults
    } catch (error) {
      logger.error('Security audit failed:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    } finally {
      this.isRunning = false
    }
  }

  // Audit authentication security
  private async auditAuthentication(): Promise<void> {
    try {
      // Check for weak passwords
      const weakPasswords = await db.user.findMany({
        where: {
          password: {
            not: null,
          },
        },
        select: {
          id: true,
          email: true,
          password: true,
        },
      })

      for (const user of weakPasswords) {
        if (user.password && this.isWeakPassword(user.password)) {
          this.addAuditResult({
            category: AUDIT_CATEGORIES.AUTHENTICATION,
            severity: 'high',
            message: 'User with weak password found',
            details: { userId: user.id, email: user.email },
          })
        }
      }

      // Check for users with no email verification
      const unverifiedUsers = await db.user.count({
        where: {
          emailVerified: null,
          createdAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Older than 24 hours
          },
        },
      })

      if (unverifiedUsers > 0) {
        this.addAuditResult({
          category: AUDIT_CATEGORIES.AUTHENTICATION,
          severity: 'medium',
          message: `${unverifiedUsers} users with unverified emails`,
        })
      }

      // Check for inactive admin accounts
      const inactiveAdmins = await db.user.count({
        where: {
          role: 'ADMIN',
          isActive: false,
        },
      })

      if (inactiveAdmins > 0) {
        this.addAuditResult({
          category: AUDIT_CATEGORIES.AUTHENTICATION,
          severity: 'medium',
          message: `${inactiveAdmins} inactive admin accounts`,
        })
      }
    } catch (error) {
      logger.error('Authentication audit failed:', error)
    }
  }

  // Audit authorization security
  private async auditAuthorization(): Promise<void> {
    try {
      // Check for users with excessive permissions
      const adminUsers = await db.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, email: true, createdAt: true },
      })

      for (const admin of adminUsers) {
        const daysSinceCreation = Math.floor(
          (Date.now() - admin.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysSinceCreation > 30) {
          // Check if admin has been active recently
          const recentActivity = await db.order.findFirst({
            where: {
              userId: admin.id,
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          })

          if (!recentActivity) {
            this.addAuditResult({
              category: AUDIT_CATEGORIES.AUTHORIZATION,
              severity: 'medium',
              message: 'Inactive admin account',
              details: { userId: admin.id, email: admin.email },
            })
          }
        }
      }
    } catch (error) {
      logger.error('Authorization audit failed:', error)
    }
  }

  // Audit input validation
  private async auditInputValidation(): Promise<void> {
    try {
      // Check for products with potentially malicious content
      const products = await db.product.findMany({
        select: {
          id: true,
          name: true,
          description: true,
        },
      })

      for (const product of products) {
        if (containsMaliciousPatterns(product.name) || (product.description && containsMaliciousPatterns(product.description))) {
          this.addAuditResult({
            category: AUDIT_CATEGORIES.INPUT_VALIDATION,
            severity: 'high',
            message: 'Product with potentially malicious content',
            details: { productId: product.id, name: product.name },
          })
        }
      }

      // Check for categories with malicious content
      const categories = await db.category.findMany({
        select: {
          id: true,
          name: true,
          description: true,
        },
      })

      for (const category of categories) {
        if (containsMaliciousPatterns(category.name) || containsMaliciousPatterns(category.description || '')) {
          this.addAuditResult({
            category: AUDIT_CATEGORIES.INPUT_VALIDATION,
            severity: 'high',
            message: 'Category with potentially malicious content',
            details: { categoryId: category.id, name: category.name },
          })
        }
      }
    } catch (error) {
      logger.error('Input validation audit failed:', error)
    }
  }

  // Audit SQL injection vulnerabilities
  private async auditSQLInjection(): Promise<void> {
    try {
      // Check for suspicious data in user inputs
      const reviews = await db.review.findMany({
        select: {
          id: true,
          comment: true,
        },
      })

      for (const review of reviews) {
        if (review.comment && this.containsSQLInjectionPatterns(review.comment)) {
          this.addAuditResult({
            category: AUDIT_CATEGORIES.SQL_INJECTION,
            severity: 'critical',
            message: 'Review with potential SQL injection patterns',
            details: { reviewId: review.id, comment: review.comment },
          })
        }
      }
    } catch (error) {
      logger.error('SQL injection audit failed:', error)
    }
  }

  // Audit XSS vulnerabilities
  private async auditXSS(): Promise<void> {
    try {
      // Check for XSS patterns in user-generated content
      const reviews = await db.review.findMany({
        select: {
          id: true,
          comment: true,
        },
      })

      for (const review of reviews) {
        if (review.comment && this.containsXSSPatterns(review.comment)) {
          this.addAuditResult({
            category: AUDIT_CATEGORIES.XSS,
            severity: 'high',
            message: 'Review with potential XSS patterns',
            details: { reviewId: review.id, comment: review.comment },
          })
        }
      }
    } catch (error) {
      logger.error('XSS audit failed:', error)
    }
  }

  // Audit CSRF protection
  private async auditCSRF(): Promise<void> {
    try {
      // Check if CSRF protection is properly configured
      const csrfSecret = process.env.CSRF_SECRET
      if (!csrfSecret || csrfSecret === 'default-secret') {
        this.addAuditResult({
          category: AUDIT_CATEGORIES.CSRF,
          severity: 'high',
          message: 'CSRF secret not properly configured',
        })
      }
    } catch (error) {
      logger.error('CSRF audit failed:', error)
    }
  }

  // Audit file upload security
  private async auditFileUpload(): Promise<void> {
    try {
      // Check for files with suspicious names
      const products = await db.product.findMany({
        select: {
          id: true,
          name: true,
          images: true,
        },
      })

      for (const product of products) {
        for (const image of product.images) {
          if (this.isSuspiciousFilename(image)) {
            this.addAuditResult({
              category: AUDIT_CATEGORIES.FILE_UPLOAD,
              severity: 'medium',
              message: 'Product with suspicious image filename',
              details: { productId: product.id, image },
            })
          }
        }
      }
    } catch (error) {
      logger.error('File upload audit failed:', error)
    }
  }

  // Audit rate limiting
  private async auditRateLimiting(): Promise<void> {
    try {
      // Check for excessive API usage patterns
      const recentOrders = await db.order.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
      })

      if (recentOrders > 1000) {
        this.addAuditResult({
          category: AUDIT_CATEGORIES.RATE_LIMITING,
          severity: 'medium',
          message: 'High volume of orders detected',
          details: { orderCount: recentOrders },
        })
      }
    } catch (error) {
      logger.error('Rate limiting audit failed:', error)
    }
  }

  // Audit data exposure
  private async auditDataExposure(): Promise<void> {
    try {
      // Check for sensitive data in logs or public fields
      const users = await db.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
        },
      })

      for (const user of users) {
        // Check if email contains sensitive patterns
        if (this.containsSensitivePatterns(user.email)) {
          this.addAuditResult({
            category: AUDIT_CATEGORIES.DATA_EXPOSURE,
            severity: 'medium',
            message: 'User email contains potentially sensitive information',
            details: { userId: user.id, email: user.email },
          })
        }
      }
    } catch (error) {
      logger.error('Data exposure audit failed:', error)
    }
  }

  // Audit configuration security
  private async auditConfiguration(): Promise<void> {
    try {
      // Check environment variables
      const requiredEnvVars = [
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL',
        'STRIPE_SECRET_KEY',
        'STRIPE_PUBLISHABLE_KEY',
      ]

      for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
          this.addAuditResult({
            category: AUDIT_CATEGORIES.CONFIGURATION,
            severity: 'critical',
            message: `Required environment variable missing: ${envVar}`,
          })
        }
      }

      // Check for default secrets
      if (process.env.NEXTAUTH_SECRET === 'your-secret-here') {
        this.addAuditResult({
          category: AUDIT_CATEGORIES.CONFIGURATION,
          severity: 'critical',
          message: 'Default NextAuth secret detected',
        })
      }
    } catch (error) {
      logger.error('Configuration audit failed:', error)
    }
  }

  // Helper methods
  private isWeakPassword(password: string): boolean {
    // Simple password strength check
    return password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)
  }

  private containsSQLInjectionPatterns(text: string): boolean {
    const patterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /(UNION\s+SELECT)/gi,
      /(DROP\s+TABLE)/gi,
      /(--|\/\*|\*\/)/gi,
    ]
    return patterns.some(pattern => pattern.test(text))
  }

  private containsXSSPatterns(text: string): boolean {
    const patterns = [
      /<script/gi,
      /<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
    ]
    return patterns.some(pattern => pattern.test(text))
  }

  private isSuspiciousFilename(filename: string): boolean {
    const patterns = [
      /\.\.\//g,
      /\.\.\\/g,
      /<script/gi,
      /javascript:/gi,
      /on\w+=/gi,
    ]
    return patterns.some(pattern => pattern.test(filename))
  }

  private containsSensitivePatterns(text: string): boolean {
    const patterns = [
      /password/gi,
      /secret/gi,
      /token/gi,
      /key/gi,
      /admin/gi,
    ]
    return patterns.some(pattern => pattern.test(text))
  }

  private addAuditResult(result: Omit<SecurityAuditResult, 'timestamp' | 'resolved'>): void {
    this.auditResults.push({
      ...result,
      timestamp: new Date(),
      resolved: false,
    })
  }

  private async saveAuditResults(): Promise<void> {
    // In a real implementation, you'd save these to a database
    // For now, we'll just log them
    for (const result of this.auditResults) {
      logger.info('Security audit result', result)
    }
  }

  // Get security metrics
  getMetrics(): SecurityMetrics {
    const total = this.auditResults.length
    const critical = this.auditResults.filter(r => r.severity === 'critical').length
    const high = this.auditResults.filter(r => r.severity === 'high').length
    const medium = this.auditResults.filter(r => r.severity === 'medium').length
    const low = this.auditResults.filter(r => r.severity === 'low').length
    const resolved = this.auditResults.filter(r => r.resolved).length

    return {
      totalAudits: total,
      criticalIssues: critical,
      highIssues: high,
      mediumIssues: medium,
      lowIssues: low,
      resolvedIssues: resolved,
      lastAudit: new Date(),
    }
  }

  // Get audit results by category
  getResultsByCategory(category: string): SecurityAuditResult[] {
    return this.auditResults.filter(result => result.category === category)
  }

  // Get audit results by severity
  getResultsBySeverity(severity: string): SecurityAuditResult[] {
    return this.auditResults.filter(result => result.severity === severity)
  }

  // Mark issue as resolved
  markResolved(index: number): void {
    if (index >= 0 && index < this.auditResults.length) {
      const result = this.auditResults[index]
      if (result) {
        result.resolved = true
      }
    }
  }
}

// Create singleton instance
export const securityAuditor = new SecurityAuditor()

// Utility functions
export async function runSecurityAudit(): Promise<SecurityAuditResult[]> {
  return securityAuditor.runFullAudit()
}

export function getSecurityMetrics(): SecurityMetrics {
  return securityAuditor.getMetrics()
}

export function getSecurityResultsByCategory(category: string): SecurityAuditResult[] {
  return securityAuditor.getResultsByCategory(category)
}

export function getSecurityResultsBySeverity(severity: string): SecurityAuditResult[] {
  return securityAuditor.getResultsBySeverity(severity)
}


