import { monitoring } from './monitoring'
import { logger } from './logger'

// Analytics configuration
const analyticsConfig = {
  enabled: process.env.ANALYTICS_ENABLED === 'true',
  debug: process.env.ANALYTICS_DEBUG === 'true',
  batchSize: parseInt(process.env.ANALYTICS_BATCH_SIZE || '10'),
  flushInterval: parseInt(process.env.ANALYTICS_FLUSH_INTERVAL || '5000'),
}

// Analytics event types
export const AnalyticsEvents = {
  // User events
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_PROFILE_UPDATE: 'user_profile_update',
  USER_PASSWORD_CHANGE: 'user_password_change',
  
  // Product events
  PRODUCT_VIEW: 'product_view',
  PRODUCT_SEARCH: 'product_search',
  PRODUCT_FILTER: 'product_filter',
  PRODUCT_SORT: 'product_sort',
  PRODUCT_REVIEW: 'product_review',
  PRODUCT_RATING: 'product_rating',
  
  // Cart events
  CART_ADD: 'cart_add',
  CART_REMOVE: 'cart_remove',
  CART_UPDATE: 'cart_update',
  CART_VIEW: 'cart_view',
  CART_ABANDON: 'cart_abandon',
  
  // Wishlist events
  WISHLIST_ADD: 'wishlist_add',
  WISHLIST_REMOVE: 'wishlist_remove',
  WISHLIST_VIEW: 'wishlist_view',
  
  // Order events
  ORDER_START: 'order_start',
  ORDER_UPDATE: 'order_update',
  ORDER_COMPLETE: 'order_complete',
  ORDER_CANCEL: 'order_cancel',
  ORDER_REFUND: 'order_refund',
  
  // Payment events
  PAYMENT_START: 'payment_start',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_METHOD_ADD: 'payment_method_add',
  PAYMENT_METHOD_REMOVE: 'payment_method_remove',
  
  // Navigation events
  PAGE_VIEW: 'page_view',
  PAGE_EXIT: 'page_exit',
  LINK_CLICK: 'link_click',
  BUTTON_CLICK: 'button_click',
  FORM_SUBMIT: 'form_submit',
  FORM_ABANDON: 'form_abandon',
  
  // Search events
  SEARCH_START: 'search_start',
  SEARCH_RESULTS: 'search_results',
  SEARCH_NO_RESULTS: 'search_no_results',
  SEARCH_FILTER: 'search_filter',
  SEARCH_SORT: 'search_sort',
  
  // Error events
  ERROR_404: 'error_404',
  ERROR_500: 'error_500',
  ERROR_VALIDATION: 'error_validation',
  ERROR_NETWORK: 'error_network',
  ERROR_PAYMENT: 'error_payment',
  
  // Performance events
  PERFORMANCE_SLOW: 'performance_slow',
  PERFORMANCE_ERROR: 'performance_error',
  PERFORMANCE_MEMORY: 'performance_memory',
  
  // Feature events
  FEATURE_USAGE: 'feature_usage',
  FEATURE_ERROR: 'feature_error',
  FEATURE_SUCCESS: 'feature_success',
} as const

// Analytics class
export class Analytics {
  private static instance: Analytics
  private eventQueue: Array<{ event: string; properties: Record<string, any>; timestamp: Date }> = []
  private flushTimer: NodeJS.Timeout | null = null
  private userId: string | null = null
  private sessionId: string | null = null

  private constructor() {
    this.initializeSession()
    this.startFlushTimer()
  }

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics()
    }
    return Analytics.instance
  }

  // Initialize session
  private initializeSession() {
    if (typeof window !== 'undefined') {
      this.sessionId = this.getOrCreateSessionId()
      this.userId = this.getUserId()
    }
  }

  // Get or create session ID
  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('analytics_session_id', sessionId)
    }
    return sessionId
  }

  // Get user ID
  private getUserId(): string | null {
    return localStorage.getItem('user_id') || null
  }

  // Start flush timer
  private startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    
    this.flushTimer = setInterval(() => {
      this.flushEvents()
    }, analyticsConfig.flushInterval)
  }

  // Track event
  track(event: string, properties: Record<string, any> = {}) {
    if (!analyticsConfig.enabled) return

    try {
      const eventData = {
        event,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
          session_id: this.sessionId,
          user_id: this.userId,
          page_url: typeof window !== 'undefined' ? window.location.href : '',
          page_title: typeof window !== 'undefined' ? document.title : '',
          referrer: typeof window !== 'undefined' ? document.referrer : '',
          user_agent: typeof window !== 'undefined' ? navigator.userAgent : '',
        },
        timestamp: new Date(),
      }

      // Add to queue
      this.eventQueue.push(eventData)

      // Flush if batch size reached
      if (this.eventQueue.length >= analyticsConfig.batchSize) {
        this.flushEvents()
      }

      // Send to monitoring
      monitoring.trackEvent({
        event,
        properties,
        userId: this.userId || undefined,
        sessionId: this.sessionId || undefined,
      })

      if (analyticsConfig.debug) {
        logger.info('Analytics event tracked:', eventData)
      }
    } catch (error) {
      logger.error('Analytics tracking failed:', {}, error instanceof Error ? error : new Error(String(error)))
    }
  }

  // Flush events
  private async flushEvents() {
    if (this.eventQueue.length === 0) return

    try {
      const events = [...this.eventQueue]
      this.eventQueue = []

      // Send to analytics providers
      await this.sendToProviders(events)

      if (analyticsConfig.debug) {
        logger.info(`Flushed ${events.length} analytics events`)
      }
    } catch (error) {
      logger.error('Analytics flush failed:', {}, error instanceof Error ? error : new Error(String(error)))
      // Re-add events to queue for retry
      this.eventQueue.unshift(...this.eventQueue)
    }
  }

  // Send to analytics providers
  private async sendToProviders(events: Array<{ event: string; properties: Record<string, any>; timestamp: Date }>) {
    // Send to custom analytics endpoint
    if (process.env.ANALYTICS_ENDPOINT) {
      try {
        await fetch(process.env.ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ events }),
        })
      } catch (error) {
        logger.error('Custom analytics endpoint failed:', {}, error instanceof Error ? error : new Error(String(error)))
      }
    }

    // Send to Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      events.forEach(eventData => {
        (window as any).gtag('event', eventData.event, eventData.properties)
      })
    }

    // Send to Mixpanel
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      events.forEach(eventData => {
        (window as any).mixpanel.track(eventData.event, eventData.properties)
      })
    }

    // Send to Amplitude
    if (typeof window !== 'undefined' && (window as any).amplitude) {
      events.forEach(eventData => {
        (window as any).amplitude.getInstance().logEvent(eventData.event, eventData.properties)
      })
    }
  }

  // Set user ID
  setUserId(userId: string) {
    this.userId = userId
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_id', userId)
    }
  }

  // Set user properties
  setUserProperties(properties: Record<string, any>) {
    // User properties will be included in trackEvent calls via userId
  }

  // Track page view
  trackPageView(page: string, title?: string) {
    this.track(AnalyticsEvents.PAGE_VIEW, {
      page,
      title: title || (typeof window !== 'undefined' ? document.title : ''),
    })
  }

  // Track e-commerce event
  trackEcommerce(event: string, properties: Record<string, any>) {
    this.track(event, {
      ...properties,
      ecommerce: true,
    })
  }

  // Track user action
  trackUserAction(action: string, properties: Record<string, any> = {}) {
    this.track(AnalyticsEvents.USER_SIGNUP, {
      action,
      ...properties,
    })
  }

  // Track product interaction
  trackProductInteraction(action: string, productId: string, properties: Record<string, any> = {}) {
    this.track(action, {
      product_id: productId,
      ...properties,
    })
  }

  // Track cart interaction
  trackCartInteraction(action: string, properties: Record<string, any> = {}) {
    this.track(action, {
      ...properties,
    })
  }

  // Track order event
  trackOrderEvent(event: string, orderId: string, properties: Record<string, any> = {}) {
    this.track(event, {
      order_id: orderId,
      ...properties,
    })
  }

  // Track payment event
  trackPaymentEvent(event: string, properties: Record<string, any> = {}) {
    this.track(event, {
      ...properties,
    })
  }

  // Track search event
  trackSearchEvent(event: string, query: string, properties: Record<string, any> = {}) {
    this.track(event, {
      query,
      ...properties,
    })
  }

  // Track error event
  trackError(event: string, error: Error, properties: Record<string, any> = {}) {
    this.track(event, {
      error_message: error.message,
      error_stack: error.stack,
      ...properties,
    })
  }

  // Track performance event
  trackPerformance(event: string, value: number, unit: string, properties: Record<string, any> = {}) {
    this.track(event, {
      value,
      unit,
      ...properties,
    })
  }

  // Get analytics data
  getAnalyticsData() {
    return {
      events: this.eventQueue.length,
      userId: this.userId,
      sessionId: this.sessionId,
      enabled: analyticsConfig.enabled,
      debug: analyticsConfig.debug,
    }
  }

  // Clear analytics data
  clearAnalyticsData() {
    this.eventQueue = []
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('analytics_session_id')
      localStorage.removeItem('user_id')
    }
  }

  // Destroy analytics instance
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    this.flushEvents()
  }
}

// Analytics utilities
export const analyticsUtils = {
  // Track page load time
  trackPageLoadTime: (loadTime: number) => {
    const analytics = Analytics.getInstance()
    analytics.trackPerformance(AnalyticsEvents.PERFORMANCE_SLOW, loadTime, 'ms', {
      metric: 'page_load_time',
    })
  },

  // Track API response time
  trackApiResponseTime: (url: string, method: string, responseTime: number) => {
    const analytics = Analytics.getInstance()
    analytics.trackPerformance(AnalyticsEvents.PERFORMANCE_SLOW, responseTime, 'ms', {
      metric: 'api_response_time',
      url,
      method,
    })
  },

  // Track database query time
  trackDatabaseQueryTime: (query: string, responseTime: number) => {
    const analytics = Analytics.getInstance()
    analytics.trackPerformance(AnalyticsEvents.PERFORMANCE_SLOW, responseTime, 'ms', {
      metric: 'database_query_time',
      query: query.substring(0, 100),
    })
  },

  // Track memory usage
  trackMemoryUsage: (memoryUsage: number) => {
    const analytics = Analytics.getInstance()
    analytics.trackPerformance(AnalyticsEvents.PERFORMANCE_MEMORY, memoryUsage, 'MB', {
      metric: 'memory_usage',
    })
  },

  // Track feature usage
  trackFeatureUsage: (feature: string, properties: Record<string, any> = {}) => {
    const analytics = Analytics.getInstance()
    analytics.track(AnalyticsEvents.FEATURE_USAGE, {
      feature,
      ...properties,
    })
  },

  // Track conversion funnel
  trackConversionFunnel: (step: string, properties: Record<string, any> = {}) => {
    const analytics = Analytics.getInstance()
    analytics.track('conversion_funnel', {
      step,
      ...properties,
    })
  },

  // Track A/B test
  trackABTest: (testName: string, variant: string, properties: Record<string, any> = {}) => {
    const analytics = Analytics.getInstance()
    analytics.track('ab_test', {
      test_name: testName,
      variant,
      ...properties,
    })
  },
}

// Export singleton instance
export const analytics = Analytics.getInstance()

// Initialize analytics
if (typeof window !== 'undefined') {
  // Track page view on load
  window.addEventListener('load', () => {
    analytics.trackPageView(window.location.pathname, document.title)
  })

  // Track page exit
  window.addEventListener('beforeunload', () => {
    analytics.track(AnalyticsEvents.PAGE_EXIT, {
      page: window.location.pathname,
    })
  })

  // Track performance metrics
  window.addEventListener('load', () => {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
    analyticsUtils.trackPageLoadTime(loadTime)
  })
}

