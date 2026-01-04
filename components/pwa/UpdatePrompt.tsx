'use client'

import { useState, useEffect } from 'react'
import { usePWA } from './PWAProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, X, CheckCircle } from 'lucide-react'

export default function UpdatePrompt() {
  const { updateAvailable, updateApp } = usePWA()
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if (updateAvailable) {
      setShowPrompt(true)
    }
  }, [updateAvailable])

  if (!showPrompt) {
    return null
  }

  const handleUpdate = () => {
    updateApp()
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card className="bg-green-50 border-green-200 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-green-800">
                  Update Available
                </CardTitle>
                <CardDescription className="text-xs text-green-600">
                  A new version is ready to install
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="text-xs text-green-700">
              Get the latest features and improvements by updating the app.
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleUpdate}
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Update Now
              </Button>
              <Button
                onClick={handleDismiss}
                variant="outline"
                size="sm"
                className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
              >
                Later
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

