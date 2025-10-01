import { NextRequest } from "next/server"
import { headers } from "next/headers"

export interface PaymentSecurityConfig {
  enableFraudDetection: boolean
  enableRateLimiting: boolean
  enableIPWhitelist: boolean
  maxAmountPerTransaction: number
  maxTransactionsPerHour: number
  blockedCountries: string[]
  allowedPaymentMethods: string[]
}

const defaultConfig: PaymentSecurityConfig = {
  enableFraudDetection: true,
  enableRateLimiting: true,
  enableIPWhitelist: false,
  maxAmountPerTransaction: 10000, // $100.00
  maxTransactionsPerHour: 10,
  blockedCountries: ["AF", "IR", "KP", "SY"], // High-risk countries
  allowedPaymentMethods: ["card", "bank_transfer"]
}

export class PaymentSecurityManager {
  private config: PaymentSecurityConfig
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>()

  constructor(config: Partial<PaymentSecurityConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  async validatePaymentRequest(req: NextRequest, amount: number, currency: string = "USD"): Promise<{
    isValid: boolean
    error?: string
    riskScore?: number
  }> {
    try {
      // 1. Rate Limiting Check
      if (this.config.enableRateLimiting) {
        const rateLimitResult = this.checkRateLimit(req)
        if (!rateLimitResult.isValid) {
          return {
            isValid: false,
            error: "Too many payment attempts. Please try again later.",
            riskScore: 100
          }
        }
      }

      // 2. Amount Validation
      if (amount > this.config.maxAmountPerTransaction) {
        return {
          isValid: false,
          error: `Payment amount exceeds maximum allowed limit of $${this.config.maxAmountPerTransaction}`,
          riskScore: 90
        }
      }

      // 3. Geographic Validation
      const geoResult = await this.validateGeographicLocation(req)
      if (!geoResult.isValid) {
        return {
          isValid: false,
          error: "Payments from your location are not currently supported",
          riskScore: 80
        }
      }

      // 4. Fraud Detection
      let fraudResult: { riskScore?: number; isValid?: boolean } = { riskScore: 0 }
      if (this.config.enableFraudDetection) {
        fraudResult = await this.detectFraud(req, amount)
        if (!fraudResult.isValid) {
          return {
            isValid: false,
            error: "Payment flagged for potential fraud. Please contact support.",
            riskScore: fraudResult.riskScore || 95
          }
        }
      }

      // 5. IP Reputation Check
      const ipResult = await this.checkIPReputation(req)
      if (!ipResult.isValid) {
        return {
          isValid: false,
          error: "Payment request blocked due to security concerns",
          riskScore: ipResult.riskScore || 85
        }
      }

      return {
        isValid: true,
        riskScore: Math.max(
          geoResult.riskScore || 0,
          fraudResult.riskScore || 0,
          ipResult.riskScore || 0
        )
      }

    } catch (error) {
      console.error("Payment security validation error:", error)
      return {
        isValid: false,
        error: "Security validation failed. Please try again.",
        riskScore: 50
      }
    }
  }

  private checkRateLimit(req: NextRequest): { isValid: boolean } {
    const clientIP = this.getClientIP(req)
    const now = Date.now()
    const hourInMs = 60 * 60 * 1000

    const current = this.rateLimitMap.get(clientIP)
    
    if (!current) {
      this.rateLimitMap.set(clientIP, { count: 1, resetTime: now + hourInMs })
      return { isValid: true }
    }

    if (now > current.resetTime) {
      this.rateLimitMap.set(clientIP, { count: 1, resetTime: now + hourInMs })
      return { isValid: true }
    }

    if (current.count >= this.config.maxTransactionsPerHour) {
      return { isValid: false }
    }

    current.count++
    return { isValid: true }
  }

  private async validateGeographicLocation(req: NextRequest): Promise<{
    isValid: boolean
    riskScore?: number
  }> {
    try {
      const clientIP = this.getClientIP(req)
      
      // In a real implementation, you would use a geolocation service
      // For now, we'll simulate based on headers
      const country = req.headers.get("cf-ipcountry") || "US"
      
      if (this.config.blockedCountries.includes(country)) {
        return {
          isValid: false,
          riskScore: 90
        }
      }

      // High-risk countries get higher risk scores
      const highRiskCountries = ["CN", "RU", "BR", "IN"]
      const riskScore = highRiskCountries.includes(country) ? 30 : 10

      return {
        isValid: true,
        riskScore
      }

    } catch (error) {
      console.error("Geographic validation error:", error)
      return {
        isValid: true,
        riskScore: 20
      }
    }
  }

  private async detectFraud(req: NextRequest, amount: number): Promise<{
    isValid: boolean
    riskScore?: number
  }> {
    try {
      let riskScore = 0

      // Check for suspicious patterns
      const userAgent = req.headers.get("user-agent") || ""
      const referer = req.headers.get("referer") || ""

      // Suspicious user agents
      if (userAgent.includes("bot") || userAgent.includes("crawler")) {
        riskScore += 40
      }

      // Missing or suspicious referer
      if (!referer || referer.includes("suspicious-site.com")) {
        riskScore += 20
      }

      // Unusual amount patterns
      if (amount % 100 === 0 && amount > 1000) {
        riskScore += 15 // Round numbers over $10 might be suspicious
      }

      // Check for rapid successive requests
      const clientIP = this.getClientIP(req)
      const recentRequests = this.getRecentRequests(clientIP)
      if (recentRequests > 3) {
        riskScore += 25
      }

      return {
        isValid: riskScore < 70,
        riskScore
      }

    } catch (error) {
      console.error("Fraud detection error:", error)
      return {
        isValid: true,
        riskScore: 10
      }
    }
  }

  private async checkIPReputation(req: NextRequest): Promise<{
    isValid: boolean
    riskScore?: number
  }> {
    try {
      const clientIP = this.getClientIP(req)
      
      // In a real implementation, you would check against IP reputation databases
      // For now, we'll do basic validation
      
      // Check for private/local IPs (shouldn't be making payments)
      if (this.isPrivateIP(clientIP)) {
        return {
          isValid: false,
          riskScore: 100
        }
      }

      // Check for known VPN/proxy patterns (simplified)
      if (this.isLikelyVPN(clientIP)) {
        return {
          isValid: true,
          riskScore: 40
        }
      }

      return {
        isValid: true,
        riskScore: 5
      }

    } catch (error) {
      console.error("IP reputation check error:", error)
      return {
        isValid: true,
        riskScore: 15
      }
    }
  }

  private getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for")
    const realIP = req.headers.get("x-real-ip")
    const cfConnectingIP = req.headers.get("cf-connecting-ip")
    
    return cfConnectingIP || realIP || forwarded?.split(",")[0] || "unknown"
  }

  private isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/
    ]
    
    return privateRanges.some(range => range.test(ip))
  }

  private isLikelyVPN(ip: string): boolean {
    // Simplified VPN detection - in reality you'd use a proper service
    // This is just for demonstration
    return false
  }

  private getRecentRequests(clientIP: string): number {
    // In a real implementation, this would check a database or cache
    // For now, return 0
    return 0
  }

  async logSecurityEvent(
    event: string,
    details: Record<string, any>,
    riskScore: number
  ): Promise<void> {
    try {
      // In a real implementation, you would log to a security monitoring system
      console.log("Security Event:", {
        event,
        details,
        riskScore,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error("Failed to log security event:", error)
    }
  }
}

export const paymentSecurity = new PaymentSecurityManager()

