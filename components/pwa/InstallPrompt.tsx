'use client'

import { useState, useEffect } from 'react'
import { usePWA } from './PWAProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Download, Smartphone, Monitor } from 'lucide-react'
import { clientLogger } from '@/lib/client-logger'

export default function InstallPrompt() {
  const { canInstall, installApp, isInstalled, isMobile, isIOS, isAndroid } = usePWA()
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Show prompt if app can be installed and not already installed
    if (canInstall && !isInstalled && !dismissed) {
      // Delay showing prompt to avoid being too aggressive
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 3000)

      return () => clearTimeout(timer)
    }
    
    // Return undefined for non-browser environments or when condition is false
    return undefined
  }, [canInstall, isInstalled, dismissed])

  // Don't show if already installed or dismissed
  if (isInstalled || !showPrompt || dismissed) {
    return null
  }

  const handleInstall = async () => {
    try {
      await installApp()
      setShowPrompt(false)
    } catch (error) {
      clientLogger.error('Installation failed', {}, error instanceof Error ? error : undefined)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    setShowPrompt(false)
    
    // Store dismissal in localStorage
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  // Check if user previously dismissed
  useEffect(() => {
    const wasDismissed = localStorage.getItem('pwa-install-dismissed')
    if (wasDismissed === 'true') {
      setDismissed(true)
    }
  }, [])

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card className="bg-white shadow-lg border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Download className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Install ZYRA Fashion</CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Get the full app experience
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="text-xs text-gray-600">
              {isMobile ? (
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4" />
                  <span>
                    {isIOS ? 'Add to Home Screen' : 'Install app for better experience'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4" />
                  <span>Install desktop app for better performance</span>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleInstall}
                size="sm"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-1" />
                Install
              </Button>
              <Button
                onClick={handleDismiss}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

