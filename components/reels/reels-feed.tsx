'use client'

import { useState, useEffect, useCallback } from 'react'
import { VideoPlayer } from './video-player'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { clientLogger } from '@/lib/client-logger'

interface Reel {
  id: string
  title: string
  description?: string
  videoUrl: string
  thumbnailUrl?: string
  duration?: number
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  featured: boolean
  trendingScore: number
  createdAt: string
  publishedAt?: string
  admin: {
    id: string
    name: string
    avatar?: string
  }
  products: Array<{
    id: string
    name: string
    price: number
    images: string[]
    slug: string
    position: { x: number; y: number }
  }>
  hashtags: string[]
  userInteractions: Array<{
    id: string
    interactionType: string
    createdAt: string
  }>
  stats: {
    totalInteractions: number
    totalComments: number
  }
}

interface ReelsFeedProps {
  userId?: string
  featured?: boolean
  className?: string
}

export function ReelsFeed({ userId, featured, className }: ReelsFeedProps) {
  const [reels, setReels] = useState<Reel[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  // Load reels
  const loadReels = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10'
      })
      
      if (userId) params.append('userId', userId)
      if (featured) params.append('featured', 'true')

      const response = await fetch(`/api/reels?${params}`)
      const data = await response.json()

      if (data.success) {
        const newReels = data.data || []
        setReels(prev => reset ? newReels : [...prev, ...newReels])
        setHasMore(newReels.length === 10)
        setPage(pageNum)
      }
    } catch (error) {
      clientLogger.error('Failed to load reels', {}, error instanceof Error ? error : undefined)
    } finally {
      setLoading(false)
    }
  }, [userId, featured])

  // Load more reels
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadReels(page + 1, false)
    }
  }, [loading, hasMore, page, loadReels])

  // Handle scroll/swipe
  const handleScroll = useCallback((direction: 'up' | 'down') => {
    if (direction === 'up' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    } else if (direction === 'down' && currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1)
      
      // Load more if near end
      if (currentIndex >= reels.length - 3) {
        loadMore()
      }
    }
  }, [currentIndex, reels.length, loadMore])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        handleScroll('up')
        break
      case 'ArrowDown':
        event.preventDefault()
        handleScroll('down')
        break
      case ' ':
        event.preventDefault()
        // Toggle play/pause
        break
    }
  }, [handleScroll])

  // Handle wheel scroll
  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault()
    if (event.deltaY > 0) {
      handleScroll('down')
    } else {
      handleScroll('up')
    }
  }, [handleScroll])

  // Handle touch/swipe
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0]
    if (!touch) return;
    const startY = touch.clientY
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
    }
    
    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0]
      if (!touch) return;
      const endY = touch.clientY
      const diff = startY - endY
      
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          handleScroll('down')
        } else {
          handleScroll('up')
        }
      }
      
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
  }, [handleScroll])

  // Load initial reels
  useEffect(() => {
    loadReels(1, true)
  }, [loadReels])

  // Add event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('wheel', handleWheel, { passive: false })
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('wheel', handleWheel)
    }
  }, [handleKeyDown, handleWheel])

  // Handle interactions
  const handleLike = useCallback(async (reelId: string) => {
    if (!userId) return

    try {
      const response = await fetch(`/api/reels/${reelId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionType: 'LIKE',
          userId
        })
      })

      if (response.ok) {
        // Update local state
        setReels(prev => prev.map(reel => {
          if (reel.id === reelId) {
            const isLiked = reel.userInteractions.some(i => i.interactionType === 'LIKE')
            return {
              ...reel,
              likeCount: isLiked ? reel.likeCount - 1 : reel.likeCount + 1,
              userInteractions: isLiked 
                ? reel.userInteractions.filter(i => i.interactionType !== 'LIKE')
                : [...reel.userInteractions, { id: '', interactionType: 'LIKE', createdAt: new Date().toISOString() }]
            }
          }
          return reel
        }))
      }
    } catch (error) {
      clientLogger.error('Failed to like reel', {}, error instanceof Error ? error : undefined)
    }
  }, [userId])

  const handleComment = useCallback((reelId: string) => {
    // TODO: Open comment modal
    clientLogger.debug('Open comments for reel', { reelId })
  }, [])

  const handleShare = useCallback(async (reelId: string) => {
    try {
      const response = await fetch(`/api/reels/${reelId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionType: 'SHARE',
          userId: userId || 'anonymous'
        })
      })

      if (response.ok) {
        // Update local state
        setReels(prev => prev.map(reel => {
          if (reel.id === reelId) {
            return {
              ...reel,
              shareCount: reel.shareCount + 1
            }
          }
          return reel
        }))
      }

      // Share functionality
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this reel!',
          url: window.location.href
        })
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href)
      }
    } catch (error) {
      clientLogger.error('Failed to share reel', {}, error instanceof Error ? error : undefined)
    }
  }, [userId])

  const handleView = useCallback(async (reelId: string) => {
    if (!userId) return

    try {
      await fetch(`/api/reels/${reelId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionType: 'VIEW',
          userId
        })
      })
    } catch (error) {
      clientLogger.error('Failed to track view', {}, error instanceof Error ? error : undefined)
    }
  }, [userId])

  if (loading && reels.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-screen', className)}>
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (reels.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-screen', className)}>
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No reels found</h3>
          <p className="text-muted-foreground">Check back later for new content!</p>
        </div>
      </div>
    )
  }

  const currentReel = reels[currentIndex]
  const isLiked = currentReel?.userInteractions.some(i => i.interactionType === 'LIKE') || false

  return (
    <div 
      className={cn('relative w-full h-screen overflow-hidden', className)}
      onTouchStart={handleTouchStart}
    >
      {/* Current reel */}
      {currentReel && (
        <VideoPlayer
          key={currentReel.id}
          videoUrl={currentReel.videoUrl}
          thumbnailUrl={currentReel.thumbnailUrl}
          title={currentReel.title}
          description={currentReel.description}
          duration={currentReel.duration}
          viewCount={currentReel.viewCount}
          likeCount={currentReel.likeCount}
          commentCount={currentReel.commentCount}
          shareCount={currentReel.shareCount}
          isLiked={isLiked}
          isPlaying={true}
          onLike={() => handleLike(currentReel.id)}
          onComment={() => handleComment(currentReel.id)}
          onShare={() => handleShare(currentReel.id)}
          onView={() => handleView(currentReel.id)}
          products={currentReel.products}
        />
      )}

      {/* Navigation indicators */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
        {reels.map((_, index) => (
          <button
            key={index}
            className={cn(
              'w-2 h-8 rounded-full transition-all duration-200',
              index === currentIndex 
                ? 'bg-white' 
                : 'bg-white/30 hover:bg-white/50'
            )}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>

      {/* Load more indicator */}
      {loading && (
        <div className="absolute bottom-20 right-4">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
        </div>
      )}
    </div>
  )
}


