'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { analytics } from '@/lib/analytics'
import { monitoring } from '@/lib/monitoring'
import GoogleAnalytics from './GoogleAnalytics'
import GoogleTagManager from './GoogleTagManager'

interface AnalyticsContextType {
  analytics: typeof analytics
  monitoring: typeof monitoring
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null)

interface AnalyticsProviderProps {
  children: ReactNode
  googleAnalyticsId?: string
  googleTagManagerId?: string
  sentryDsn?: string
  debug?: boolean
}

export default function AnalyticsProvider({
  children,
  googleAnalyticsId,
  googleTagManagerId,
  sentryDsn,
  debug = false,
}: AnalyticsProviderProps) {
  useEffect(() => {
    // Initialize analytics
    if (typeof window !== 'undefined') {
      // Track page view
      analytics.trackPageView(window.location.pathname, document.title)
      
      // Track performance metrics
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            analytics.trackPerformance('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart, 'ms')
          } else if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming
            analytics.trackPerformance('resource_load_time', resourceEntry.duration, 'ms', {
              resource: resourceEntry.name,
              type: resourceEntry.initiatorType,
            })
          }
        })
      })
      
      observer.observe({ entryTypes: ['navigation', 'resource'] })
      
      // Track Core Web Vitals
      const vitalsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'largest-contentful-paint') {
            analytics.trackPerformance('lcp', entry.startTime, 'ms')
          } else if (entry.entryType === 'first-input') {
            const fidEntry = entry as PerformanceEventTiming
            analytics.trackPerformance('fid', fidEntry.processingStart - fidEntry.startTime, 'ms')
          } else if (entry.entryType === 'layout-shift') {
            analytics.trackPerformance('cls', (entry as any).value, 'score')
          }
        })
      })
      
      vitalsObserver.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
      
      // Track errors
      window.addEventListener('error', (event) => {
        analytics.trackError('javascript_error', event.error, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        })
      })
      
      window.addEventListener('unhandledrejection', (event) => {
        analytics.trackError('unhandled_promise_rejection', new Error(event.reason), {
          reason: event.reason,
        })
      })
      
      // Track user interactions
      document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement
        if (target) {
          analytics.track('click', {
            element: target.tagName,
            id: target.id,
            class: target.className,
            text: target.textContent?.substring(0, 100),
            href: target.getAttribute('href'),
          })
        }
      })
      
      // Track form submissions
      document.addEventListener('submit', (event) => {
        const form = event.target as HTMLFormElement
        if (form) {
          analytics.track('form_submit', {
            form_id: form.id,
            form_class: form.className,
            form_action: form.action,
            form_method: form.method,
          })
        }
      })
      
      // Track scroll depth
      let maxScrollDepth = 0
      const trackScrollDepth = () => {
        const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100)
        if (scrollDepth > maxScrollDepth) {
          maxScrollDepth = scrollDepth
          analytics.track('scroll_depth', {
            depth: scrollDepth,
            max_depth: maxScrollDepth,
          })
        }
      }
      
      window.addEventListener('scroll', trackScrollDepth, { passive: true })
      
      // Track time on page
      const startTime = Date.now()
      const trackTimeOnPage = () => {
        const timeOnPage = Math.round((Date.now() - startTime) / 1000)
        analytics.track('time_on_page', {
          seconds: timeOnPage,
        })
      }
      
      window.addEventListener('beforeunload', trackTimeOnPage)
      
      // Cleanup
      return () => {
        observer.disconnect()
        vitalsObserver.disconnect()
        window.removeEventListener('scroll', trackScrollDepth)
        window.removeEventListener('beforeunload', trackTimeOnPage)
      }
    }
    
    // Return undefined for non-browser environments
    return undefined
  }, [])

  return (
    <AnalyticsContext.Provider value={{ analytics, monitoring }}>
      {googleAnalyticsId && (
        <GoogleAnalytics measurementId={googleAnalyticsId} debug={debug} />
      )}
      {googleTagManagerId && (
        <GoogleTagManager gtmId={googleTagManagerId} debug={debug} />
      )}
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider')
  }
  return context
}

