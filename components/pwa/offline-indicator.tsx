"use client"

import { useState, useEffect } from "react"
import { WifiOff, Wifi } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // Set initial state
    setIsOnline(navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <Alert className="fixed top-16 left-4 right-4 z-50 border-orange-200 bg-orange-50" data-testid="offline-indicator">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        You're currently offline. Some features may be limited.
      </AlertDescription>
    </Alert>
  )
}



