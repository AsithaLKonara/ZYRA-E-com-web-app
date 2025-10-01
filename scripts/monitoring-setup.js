#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Monitoring setup script
class MonitoringSetup {
  constructor() {
    this.projectRoot = process.cwd()
    this.configDir = path.join(this.projectRoot, 'monitoring')
  }

  // Create monitoring directory
  createMonitoringDir() {
    console.log('📁 Creating monitoring directory...')
    
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true })
      console.log('✅ Monitoring directory created')
    } else {
      console.log('✅ Monitoring directory already exists')
    }
  }

  // Create Sentry configuration
  createSentryConfig() {
    console.log('🔍 Creating Sentry configuration...')
    
    const sentryConfig = `import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  debug: false,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  beforeSend(event) {
    // Filter out sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies
    }
    return event
  },
})`

    fs.writeFileSync(
      path.join(this.configDir, 'sentry.client.config.ts'),
      sentryConfig
    )

    const sentryServerConfig = `import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  debug: false,
  integrations: [
    new Sentry.NodeTracing(),
  ],
})`

    fs.writeFileSync(
      path.join(this.configDir, 'sentry.server.config.ts'),
      sentryServerConfig
    )

    console.log('✅ Sentry configuration created')
  }

  // Create Google Analytics configuration
  createGoogleAnalyticsConfig() {
    console.log('📊 Creating Google Analytics configuration...')
    
    const gaConfig = `// Google Analytics configuration
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    })
  }
}

// Track events
export const event = ({ action, category, label, value }: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}`

    fs.writeFileSync(
      path.join(this.configDir, 'google-analytics.ts'),
      gaConfig
    )

    console.log('✅ Google Analytics configuration created')
  }

  // Create performance monitoring
  createPerformanceMonitoring() {
    console.log('⚡ Creating performance monitoring...')
    
    const perfConfig = `import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

export function reportWebVitals(metric: any) {
  // Send to analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    })
  }

  // Send to custom analytics
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.track('Web Vital', {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      delta: metric.delta,
    })
  }
}

// Initialize performance monitoring
export function initPerformanceMonitoring() {
  if (typeof window !== 'undefined') {
    getCLS(reportWebVitals)
    getFID(reportWebVitals)
    getFCP(reportWebVitals)
    getLCP(reportWebVitals)
    getTTFB(reportWebVitals)
  }
}`

    fs.writeFileSync(
      path.join(this.configDir, 'performance.ts'),
      perfConfig
    )

    console.log('✅ Performance monitoring created')
  }

  // Create error tracking
  createErrorTracking() {
    console.log('🚨 Creating error tracking...')
    
    const errorConfig = `import { logger } from '@/lib/logger'

export class ErrorTracker {
  private static instance: ErrorTracker
  private errors: any[] = []

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker()
    }
    return ErrorTracker.instance
  }

  trackError(error: Error, context?: any) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
    }

    this.errors.push(errorInfo)
    logger.error('Client error tracked:', errorInfo)

    // Send to external service
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('Error', errorInfo)
    }
  }

  getErrors() {
    return this.errors
  }

  clearErrors() {
    this.errors = []
  }
}

export const errorTracker = ErrorTracker.getInstance()

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorTracker.trackError(event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    errorTracker.trackError(new Error(event.reason), {
      type: 'unhandledrejection',
    })
  })
}`

    fs.writeFileSync(
      path.join(this.configDir, 'error-tracking.ts'),
      errorConfig
    )

    console.log('✅ Error tracking created')
  }

  // Create monitoring dashboard
  createMonitoringDashboard() {
    console.log('📊 Creating monitoring dashboard...')
    
    const dashboardConfig = `// Monitoring dashboard configuration
export const monitoringConfig = {
  // Health check endpoints
  healthChecks: {
    database: '/api/health/database',
    cache: '/api/health/cache',
    external: '/api/health/external',
  },
  
  // Metrics endpoints
  metrics: {
    performance: '/api/metrics/performance',
    errors: '/api/metrics/errors',
    users: '/api/metrics/users',
  },
  
  // Alert thresholds
  thresholds: {
    responseTime: 2000, // 2 seconds
    errorRate: 0.05, // 5%
    cpuUsage: 0.8, // 80%
    memoryUsage: 0.9, // 90%
  },
  
  // Update intervals
  intervals: {
    healthCheck: 30000, // 30 seconds
    metrics: 60000, // 1 minute
    alerts: 5000, // 5 seconds
  },
}`

    fs.writeFileSync(
      path.join(this.configDir, 'dashboard.ts'),
      dashboardConfig
    )

    console.log('✅ Monitoring dashboard created')
  }

  // Run setup
  async run() {
    console.log('🚀 Setting up monitoring...')
    
    try {
      this.createMonitoringDir()
      this.createSentryConfig()
      this.createGoogleAnalyticsConfig()
      this.createPerformanceMonitoring()
      this.createErrorTracking()
      this.createMonitoringDashboard()
      
      console.log('✅ Monitoring setup completed successfully!')
    } catch (error) {
      console.error('❌ Monitoring setup failed:', error.message)
      process.exit(1)
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new MonitoringSetup()
  setup.run()
}

module.exports = MonitoringSetup




