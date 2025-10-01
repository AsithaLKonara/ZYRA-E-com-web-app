'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface PWAContextType {
  isOnline: boolean
  isInstalled: boolean
  canInstall: boolean
  installPrompt: any
  installApp: () => Promise<void>
  updateAvailable: boolean
  updateApp: () => void
  isStandalone: boolean
  isMobile: boolean
  isIOS: boolean
  isAndroid: boolean
}

const PWAContext = createContext<PWAContextType | null>(null)

interface PWAProviderProps {
  children: ReactNode
}

export default function PWAProvider({ children }: PWAProviderProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [isInstalled, setIsInstalled] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)

  useEffect(() => {
    // Check online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check if app is installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (window.navigator as any).standalone === true
      const isInstalled = isStandalone || isIOSStandalone
      
      setIsInstalled(isInstalled)
      setIsStandalone(isStandalone)
    }

    // Check device type
    const checkDevice = () => {
      const userAgent = navigator.userAgent
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
      const isIOS = /iPad|iPhone|iPod/.test(userAgent)
      const isAndroid = /Android/.test(userAgent)
      
      setIsMobile(isMobile)
      setIsIOS(isIOS)
      setIsAndroid(isAndroid)
    }

    // Check if app can be installed
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      setCanInstall(true)
    }

    // Check for app updates
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setCanInstall(false)
      setInstallPrompt(null)
    }

    // Service Worker update handling
    const handleServiceWorkerUpdate = () => {
      setUpdateAvailable(true)
    }

    // Register service worker
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js')
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  handleServiceWorkerUpdate()
                }
              })
            }
          })
          
          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
              handleServiceWorkerUpdate()
            }
          })
        } catch (error) {
          console.error('Service Worker registration failed:', error)
        }
      }
    }

    // Initialize
    checkInstalled()
    checkDevice()
    registerServiceWorker()

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Install app
  const installApp = async () => {
    if (installPrompt) {
      const result = await installPrompt.prompt()
      console.log('Install prompt result:', result)
      
      if (result.outcome === 'accepted') {
        console.log('App installed successfully')
      } else {
        console.log('App installation declined')
      }
      
      setInstallPrompt(null)
      setCanInstall(false)
    }
  }

  // Update app
  const updateApp = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          window.location.reload()
        }
      })
    }
  }

  const value: PWAContextType = {
    isOnline,
    isInstalled,
    canInstall,
    installPrompt,
    installApp,
    updateAvailable,
    updateApp,
    isStandalone,
    isMobile,
    isIOS,
    isAndroid,
  }

  return (
    <PWAContext.Provider value={value}>
      {children}
    </PWAContext.Provider>
  )
}

export function usePWA() {
  const context = useContext(PWAContext)
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider')
  }
  return context
}




