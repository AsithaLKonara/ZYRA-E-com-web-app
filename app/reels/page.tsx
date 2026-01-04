'use client'

import { EnhancedReelsFeed } from '@/components/reels/enhanced-reels-feed'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'

export default function ReelsPage() {
  const { user } = useAuth()
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  return (
    <div className="w-full h-screen bg-black">
      <EnhancedReelsFeed 
        userId={user?.id} 
        autoPlay={true}
        showNavigation={true}
        showControls={true}
      />
    </div>
  )
}


