import { NextRequest, NextResponse } from 'next/server'
import { logger } from './logger'

// Performance monitoring configuration
const performanceConfig = {
  // Response time thresholds (in milliseconds)
  thresholds: {
    fast: 200,
    acceptable: 500,
    slow: 1000,
    verySlow: 2000,
  },
  
  // Memory usage thresholds (in MB)
  memoryThresholds: {
    warning: 512,
    critical: 1024,
  },
  
  // Cache hit rate thresholds
  cacheThresholds: {
    good: 0.8,
    acceptable: 0.6,
    poor: 0.4,
  },
}

// Performance metrics interface
interface PerformanceMetrics {
  responseTime: number
  memoryUsage: NodeJS.MemoryUsage
  cacheHitRate: number
  requestCount: number
  errorCount: number
  timestamp: Date
}

// Performance monitoring class
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetrics[] = []
  private requestCount = 0
  private errorCount = 0
  private cacheHits = 0
  private cacheMisses = 0

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Record request metrics
  recordRequest(responseTime: number, memoryUsage: NodeJS.MemoryUsage) {
    this.requestCount++
    
    const metrics: PerformanceMetrics = {
      responseTime,
      memoryUsage,
      cacheHitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      timestamp: new Date(),
    }
    
    this.metrics.push(metrics)
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }
    
    // Log slow requests
    if (responseTime > performanceConfig.thresholds.slow) {
      logger.warn(`Slow request detected: ${responseTime}ms`, {
        responseTime,
        memoryUsage: memoryUsage.heapUsed / 1024 / 1024, // MB
      })
    }
    
    // Log high memory usage
    const memoryMB = memoryUsage.heapUsed / 1024 / 1024
    if (memoryMB > performanceConfig.memoryThresholds.critical) {
      logger.error(`Critical memory usage: ${memoryMB}MB`, {
        memoryUsage,
        responseTime,
      })
    } else if (memoryMB > performanceConfig.memoryThresholds.warning) {
      logger.warn(`High memory usage: ${memoryMB}MB`, {
        memoryUsage,
        responseTime,
      })
    }
  }

  // Record cache hit
  recordCacheHit() {
    this.cacheHits++
  }

  // Record cache miss
  recordCacheMiss() {
    this.cacheMisses++
  }

  // Record error
  recordError() {
    this.errorCount++
  }

  // Get current metrics
  getCurrentMetrics(): PerformanceMetrics | null {
    if (this.metrics.length === 0) return null
    return this.metrics[this.metrics.length - 1] || null
  }

  // Get average response time
  getAverageResponseTime(): number {
    if (this.metrics.length === 0) return 0
    const total = this.metrics.reduce((sum, metric) => sum + metric.responseTime, 0)
    return total / this.metrics.length
  }

  // Get average memory usage
  getAverageMemoryUsage(): number {
    if (this.metrics.length === 0) return 0
    const total = this.metrics.reduce((sum, metric) => sum + metric.memoryUsage.heapUsed, 0)
    return total / this.metrics.length / 1024 / 1024 // MB
  }

  // Get cache hit rate
  getCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses
    return total > 0 ? this.cacheHits / total : 0
  }

  // Get performance summary
  getPerformanceSummary() {
    const current = this.getCurrentMetrics()
    const avgResponseTime = this.getAverageResponseTime()
    const avgMemoryUsage = this.getAverageMemoryUsage()
    const cacheHitRate = this.getCacheHitRate()
    
    return {
      current,
      averages: {
        responseTime: avgResponseTime,
        memoryUsage: avgMemoryUsage,
        cacheHitRate,
      },
      totals: {
        requests: this.requestCount,
        errors: this.errorCount,
        cacheHits: this.cacheHits,
        cacheMisses: this.cacheMisses,
      },
      health: {
        responseTime: this.getHealthStatus(avgResponseTime, 'responseTime'),
        memory: this.getHealthStatus(avgMemoryUsage, 'memory'),
        cache: this.getHealthStatus(cacheHitRate, 'cache'),
      },
    }
  }

  // Get health status
  private getHealthStatus(value: number, type: 'responseTime' | 'memory' | 'cache'): 'good' | 'warning' | 'critical' {
    switch (type) {
      case 'responseTime':
        if (value <= performanceConfig.thresholds.fast) return 'good'
        if (value <= performanceConfig.thresholds.acceptable) return 'warning'
        return 'critical'
      
      case 'memory':
        if (value <= performanceConfig.memoryThresholds.warning) return 'good'
        if (value <= performanceConfig.memoryThresholds.critical) return 'warning'
        return 'critical'
      
      case 'cache':
        if (value >= performanceConfig.cacheThresholds.good) return 'good'
        if (value >= performanceConfig.cacheThresholds.acceptable) return 'warning'
        return 'critical'
      
      default:
        return 'good'
    }
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = []
    this.requestCount = 0
    this.errorCount = 0
    this.cacheHits = 0
    this.cacheMisses = 0
  }
}

// Performance tracking for API routes
export function trackApiPerformance() {
  const startTime = Date.now()
  const startMemory = process.memoryUsage()
  
  return {
    end: () => {
      const endTime = Date.now()
      const endMemory = process.memoryUsage()
      const responseTime = endTime - startTime
      
      // Record metrics
      const monitor = PerformanceMonitor.getInstance()
      monitor.recordRequest(responseTime, endMemory)
    }
  }
}

// Image optimization utilities
export const imageOptimization = {
  // Generate responsive image sizes
  generateImageSizes: (width: number, height: number) => {
    const sizes = [320, 640, 768, 1024, 1280, 1920]
    return sizes
      .filter(size => size <= width)
      .map(size => ({
        width: size,
        height: Math.round((height * size) / width),
        url: `?w=${size}&h=${Math.round((height * size) / width)}`,
      }))
  },
  
  // Generate WebP image URL
  generateWebPUrl: (originalUrl: string) => {
    const url = new URL(originalUrl)
    url.searchParams.set('format', 'webp')
    return url.toString()
  },
  
  // Generate AVIF image URL
  generateAVIFUrl: (originalUrl: string) => {
    const url = new URL(originalUrl)
    url.searchParams.set('format', 'avif')
    return url.toString()
  },
}

// Bundle analysis utilities
export const bundleAnalysis = {
  // Analyze bundle size
  analyzeBundleSize: (bundlePath: string) => {
    const fs = require('fs')
    const path = require('path')
    
    try {
      const stats = fs.statSync(bundlePath)
      const sizeInMB = stats.size / 1024 / 1024
      
      return {
        size: stats.size,
        sizeInMB: sizeInMB,
        sizeInKB: stats.size / 1024,
        isLarge: sizeInMB > 1, // Consider large if > 1MB
        recommendations: sizeInMB > 1 ? [
          'Consider code splitting',
          'Remove unused dependencies',
          'Use dynamic imports',
          'Optimize images',
        ] : [],
      }
    } catch (error) {
      logger.error('Bundle analysis failed:', error)
      return null
    }
  },
  
  // Get dependency sizes
  getDependencySizes: () => {
    const packageJson = require('../../package.json')
    const dependencies = Object.keys(packageJson.dependencies || {})
    
    return dependencies.map(dep => {
      try {
        const depPath = require.resolve(dep)
        const stats = require('fs').statSync(depPath)
        return {
          name: dep,
          size: stats.size,
          sizeInMB: stats.size / 1024 / 1024,
        }
      } catch (error) {
        return {
          name: dep,
          size: 0,
          sizeInMB: 0,
        }
      }
    })
  },
}

// Performance optimization utilities
export const performanceUtils = {
  // Debounce function
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  },
  
  // Throttle function
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  },
  
  // Lazy load component
  lazyLoad: (importFunc: () => Promise<any>) => {
    const { lazy } = require('react')
    return lazy(importFunc)
  },
  
  // Preload critical resources
  preloadCriticalResources: (resources: string[]) => {
    if (typeof window !== 'undefined') {
      resources.forEach(resource => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.href = resource
        link.as = resource.endsWith('.css') ? 'style' : 'script'
        document.head.appendChild(link)
      })
    }
  },
  
  // Optimize images
  optimizeImage: (src: string, width?: number, height?: number, quality?: number) => {
    const url = new URL(src)
    if (width) url.searchParams.set('w', width.toString())
    if (height) url.searchParams.set('h', height.toString())
    if (quality) url.searchParams.set('q', quality.toString())
    return url.toString()
  },
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()


