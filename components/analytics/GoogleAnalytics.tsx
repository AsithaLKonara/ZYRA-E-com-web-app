'use client'

import Script from 'next/script'
import { useEffect } from 'react'
import { analytics } from '@/lib/analytics'

interface GoogleAnalyticsProps {
  measurementId: string
  debug?: boolean
}

export default function GoogleAnalytics({ measurementId, debug = false }: GoogleAnalyticsProps) {
  useEffect(() => {
    // Initialize Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', measurementId, {
        page_title: document.title,
        page_location: window.location.href,
        debug_mode: debug,
      })
    }
  }, [measurementId, debug])

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_title: document.title,
              page_location: window.location.href,
              debug_mode: ${debug}
            });
          `,
        }}
      />
    </>
  )
}

