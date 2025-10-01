'use client'

import { usePWA } from './PWAProvider'
import { Wifi, WifiOff, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function OfflineIndicator() {
  const { isOnline } = usePWA()

  if (isOnline) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
      <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
        <WifiOff className="h-4 w-4" />
        <AlertDescription className="flex items-center space-x-2">
          <span>You're offline. Some features may be limited.</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-xs">Offline</span>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}




