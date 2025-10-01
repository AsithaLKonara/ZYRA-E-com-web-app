'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Heart, MessageCircle, Share, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface VideoPlayerProps {
  videoUrl: string
  thumbnailUrl?: string
  title: string
  description?: string
  duration?: number
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  isLiked?: boolean
  isPlaying?: boolean
  onPlay?: () => void
  onPause?: () => void
  onLike?: () => void
  onComment?: () => void
  onShare?: () => void
  onView?: () => void
  products?: Array<{
    id: string
    name: string
    price: number
    images: string[]
    slug: string
    position: { x: number; y: number }
  }>
  className?: string
}

export function VideoPlayer({
  videoUrl,
  thumbnailUrl,
  title,
  description,
  duration,
  viewCount,
  likeCount,
  commentCount,
  shareCount,
  isLiked = false,
  isPlaying = false,
  onPlay,
  onPause,
  onLike,
  onComment,
  onShare,
  onView,
  products = [],
  className
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [showControls, setShowControls] = useState(false)

  // Handle video events
  const handlePlay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play()
      onPlay?.()
    }
  }, [onPlay])

  const handlePause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
      onPause?.()
    }
  }, [onPause])

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }, [])

  const handleLoadedData = useCallback(() => {
    setIsVideoLoaded(true)
    onView?.()
  }, [onView])

  const handleClick = useCallback(() => {
    if (isPlaying) {
      handlePause()
    } else {
      handlePlay()
    }
  }, [isPlaying, handlePlay, handlePause])

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }, [isMuted])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  // Auto-play when component mounts
  useEffect(() => {
    if (videoRef.current && isPlaying) {
      videoRef.current.play()
    }
  }, [isPlaying])

  return (
    <div className={cn('relative w-full h-screen bg-black overflow-hidden', className)}>
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        preload="metadata"
        poster={thumbnailUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedData={handleLoadedData}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Click overlay for play/pause */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={handleClick}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      />

      {/* Video Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-end justify-between">
          {/* Left side - Video info */}
          <div className="flex-1 pr-4">
            <h3 className="text-white text-lg font-semibold mb-1 line-clamp-2">
              {title}
            </h3>
            {description && (
              <p className="text-white/80 text-sm line-clamp-2 mb-2">
                {description}
              </p>
            )}
            <div className="flex items-center gap-4 text-white/60 text-sm">
              <span>{formatCount(viewCount)} views</span>
              {duration && (
                <span>{formatTime(duration)}</span>
              )}
            </div>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex flex-col items-center gap-4">
            {/* Like button */}
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white"
              onClick={onLike}
            >
              <Heart className={cn('w-6 h-6', isLiked && 'fill-red-500 text-red-500')} />
            </Button>
            <span className="text-white text-xs">{formatCount(likeCount)}</span>

            {/* Comment button */}
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white"
              onClick={onComment}
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
            <span className="text-white text-xs">{formatCount(commentCount)}</span>

            {/* Share button */}
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white"
              onClick={onShare}
            >
              <Share className="w-6 h-6" />
            </Button>
            <span className="text-white text-xs">{formatCount(shareCount)}</span>
          </div>
        </div>
      </div>

      {/* Product overlays */}
      {products.map((product, index) => (
        <div
          key={product.id}
          className="absolute"
          style={{
            left: `${product.position.x * 100}%`,
            top: `${product.position.y * 100}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/90 hover:bg-white text-black font-medium shadow-lg"
            onClick={() => window.open(`/products/${product.slug}`, '_blank')}
          >
            <ShoppingBag className="w-4 h-4 mr-1" />
            ${product.price}
          </Button>
        </div>
      ))}

      {/* Controls overlay */}
      {showControls && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="w-16 h-16 rounded-full bg-black/50 hover:bg-black/70 text-white"
            onClick={handleClick}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8" />
            )}
          </Button>
        </div>
      )}

      {/* Mute button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white"
        onClick={toggleMute}
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5" />
        ) : (
          <Volume2 className="w-5 h-5" />
        )}
      </Button>

      {/* Progress bar */}
      {duration && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div
            className="h-full bg-white"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}


