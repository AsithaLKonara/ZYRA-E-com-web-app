'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { clientLogger } from '@/lib/client-logger';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Heart, 
  MessageCircle, 
  Share, 
  ShoppingBag,
  MoreHorizontal,
  Bookmark,
  Flag,
  Copy,
  ExternalLink,
  Loader2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  slug: string;
  position: { x: number; y: number };
  isFeatured?: boolean;
}

interface User {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  verified?: boolean;
  followerCount?: number;
}

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  title: string;
  description?: string;
  duration?: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  bookmarkCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  isPlaying?: boolean;
  autoPlay?: boolean;
  showProgress?: boolean;
  user?: User;
  products?: Product[];
  hashtags?: string[];
  onPlay?: () => void;
  onPause?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onView?: () => void;
  onProductClick?: (product: Product) => void;
  onUserClick?: (user: User) => void;
  onHashtagClick?: (hashtag: string) => void;
  className?: string;
}

export function EnhancedVideoPlayer({
  videoUrl,
  thumbnailUrl,
  title,
  description,
  duration,
  viewCount,
  likeCount,
  commentCount,
  shareCount,
  bookmarkCount = 0,
  isLiked = false,
  isBookmarked = false,
  isPlaying = false,
  autoPlay = true,
  showProgress = true,
  user,
  products = [],
  hashtags = [],
  onPlay,
  onPause,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onView,
  onProductClick,
  onUserClick,
  onHashtagClick,
  className
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState<Product | null>(null);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showShareAnimation, setShowShareAnimation] = useState(false);
  const [showCommentAnimation, setShowCommentAnimation] = useState(false);
  
  const { toast } = useToast();

  // Handle video events
  const handlePlay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play();
      onPlay?.();
    }
  }, [onPlay]);

  const handlePause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      onPause?.();
    }
  }, [onPause]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleLoadedData = useCallback(() => {
    setIsVideoLoaded(true);
    setIsLoading(false);
    onView?.();
  }, [onView]);

  const handleError = useCallback(() => {
    setError('Failed to load video');
    setIsLoading(false);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  }, [isPlaying, handlePlay, handlePause]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  }, []);

  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    if (videoRef.current && duration && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      videoRef.current.currentTime = newTime;
    }
  }, [duration]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clickX = e.clientX - rect.left;
    const centerX = rect.width / 2;
    
    // Animate like heart
    if (clickX < centerX) {
      onLike?.();
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 1000);
      
      // Add haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
    }
  }, [onLike]);

  const handleProductClick = useCallback((product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onProductClick?.(product);
  }, [onProductClick]);

  const handleUserClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onUserClick?.(user!);
  }, [onUserClick, user]);

  const handleHashtagClick = useCallback((hashtag: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onHashtagClick?.(hashtag);
  }, [onHashtagClick]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied!',
        description: 'Video link has been copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Failed to copy link',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleReport = useCallback(() => {
    // TODO: Implement report functionality
    toast({
      title: 'Report submitted',
      description: 'Thank you for helping us improve our community',
    });
  }, [toast]);

  // Enhanced interaction handlers with animations and haptic feedback
  const handleLike = useCallback(() => {
    onLike?.();
    setShowLikeAnimation(true);
    setTimeout(() => setShowLikeAnimation(false), 1000);
    
    // Add haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }
  }, [onLike]);

  const handleComment = useCallback(() => {
    onComment?.();
    setShowCommentAnimation(true);
    setTimeout(() => setShowCommentAnimation(false), 1000);
    
    // Add haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, [onComment]);

  const handleShare = useCallback(() => {
    onShare?.();
    setShowShareAnimation(true);
    setTimeout(() => setShowShareAnimation(false), 1000);
    
    // Add haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, [onShare]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const progress = useMemo(() => {
    return duration ? (currentTime / duration) * 100 : 0;
  }, [currentTime, duration]);

  // Auto-play when component mounts
  useEffect(() => {
    if (videoRef.current && autoPlay && isPlaying) {
      videoRef.current.play().catch((error) => {
        clientLogger.error('Video play failed', {}, error instanceof Error ? error : undefined);
      });
    }
  }, [autoPlay, isPlaying]);

  // Intersection Observer for auto-play
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting && autoPlay) {
          handlePlay();
        } else {
          handlePause();
        }
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [autoPlay, handlePlay, handlePause]);

  return (
    <div 
      ref={containerRef}
      className={cn('relative w-full h-screen bg-black overflow-hidden select-none', className)}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
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
        onError={handleError}
        onLoadStart={() => setIsLoading(true)}
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white">
            <p className="text-lg font-semibold mb-2">Video Error</p>
            <p className="text-sm text-gray-300">{error}</p>
          </div>
        </div>
      )}

      {/* Click overlay for play/pause */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={handleClick}
      />

      {/* Left side overlay - User info */}
      {user && (
        <div className="absolute bottom-20 left-4 max-w-xs">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-12 h-12 border-2 border-white">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <button
                onClick={handleUserClick}
                className="flex items-center gap-2 text-white font-semibold hover:underline"
              >
                @{user.username}
                {user.verified && (
                  <Badge variant="secondary" className="text-xs bg-blue-500">
                    ✓
                  </Badge>
                )}
              </button>
              {user.followerCount && (
                <p className="text-white/70 text-sm">
                  {formatCount(user.followerCount)} followers
                </p>
              )}
            </div>
          </div>

          {/* Video description */}
          <div className="text-white mb-2">
            <p className="text-sm leading-relaxed">
              {title}
            </p>
            {description && (
              <p className="text-sm text-white/80 mt-1">
                {description}
              </p>
            )}
          </div>

          {/* Hashtags */}
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {hashtags.map((hashtag, index) => (
                <button
                  key={index}
                  onClick={(e) => handleHashtagClick(hashtag, e)}
                  className="text-blue-400 hover:underline text-sm"
                >
                  #{hashtag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Right side overlay - Action buttons */}
      <div className="absolute bottom-20 right-4 flex flex-col items-center gap-4">
        {/* Like button */}
        <div className="flex flex-col items-center relative">
          <Button
            variant="ghost"
            size="icon"
            className="w-14 h-14 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm"
            onClick={handleLike}
          >
            <Heart className={cn(
              'w-7 h-7 transition-all duration-200',
              isLiked && 'fill-red-500 text-red-500 scale-110'
            )} />
          </Button>
          <span className="text-white text-xs font-medium mt-1">
            {formatCount(likeCount)}
          </span>
          
          {/* Like animation overlay */}
          {showLikeAnimation && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="animate-ping">
                <Heart className="w-12 h-12 fill-red-500 text-red-500" />
              </div>
            </div>
          )}
        </div>

        {/* Comment button */}
        <div className="flex flex-col items-center relative">
          <Button
            variant="ghost"
            size="icon"
            className="w-14 h-14 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm"
            onClick={handleComment}
          >
            <MessageCircle className={cn(
              'w-7 h-7 transition-all duration-200',
              showCommentAnimation && 'scale-110 text-blue-400'
            )} />
          </Button>
          <span className="text-white text-xs font-medium mt-1">
            {formatCount(commentCount)}
          </span>
          
          {/* Comment animation overlay */}
          {showCommentAnimation && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="animate-pulse">
                <MessageCircle className="w-12 h-12 text-blue-400" />
              </div>
            </div>
          )}
        </div>

        {/* Bookmark button */}
        <div className="flex flex-col items-center">
          <Button
            variant="ghost"
            size="icon"
            className="w-14 h-14 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm"
            onClick={onBookmark}
          >
            <Bookmark className={cn(
              'w-7 h-7 transition-all duration-200',
              isBookmarked && 'fill-yellow-500 text-yellow-500'
            )} />
          </Button>
          <span className="text-white text-xs font-medium mt-1">
            {formatCount(bookmarkCount)}
          </span>
        </div>

        {/* Share button */}
        <div className="flex flex-col items-center relative">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-14 h-14 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm"
              >
                <Share className={cn(
                  'w-7 h-7 transition-all duration-200',
                  showShareAnimation && 'scale-110 text-green-400'
                )} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleShare}>
                <Share className="w-4 h-4 mr-2" />
                Share Video
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="text-white text-xs font-medium mt-1">
            {formatCount(shareCount)}
          </span>
          
          {/* Share animation overlay */}
          {showShareAnimation && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="animate-bounce">
                <Share className="w-12 h-12 text-green-400" />
              </div>
            </div>
          )}
        </div>

        {/* More options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-14 h-14 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm"
            >
              <MoreHorizontal className="w-7 h-7" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleReport}>
              <Flag className="w-4 h-4 mr-2" />
              Report
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Volume2 className="w-4 h-4 mr-2" />
              Adjust Volume
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ChevronUp className="w-4 h-4 mr-2" />
              Speed: {playbackRate}x
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Product overlays */}
      {products.map((product, index) => (
        <div
          key={product.id}
          className="absolute cursor-pointer group"
          style={{
            left: `${product.position.x * 100}%`,
            top: `${product.position.y * 100}%`,
            transform: 'translate(-50%, -50%)'
          }}
          onClick={(e) => handleProductClick(product, e)}
        >
          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/90 hover:bg-white text-black font-medium shadow-lg backdrop-blur-sm"
            >
              <ShoppingBag className="w-4 h-4 mr-1" />
              ${product.price}
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-red-600 ml-1 line-through">
                  ${product.originalPrice}
                </span>
              )}
            </Button>
            
            {product.isFeatured && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">
                Featured
              </Badge>
            )}
          </div>
        </div>
      ))}

      {/* Controls overlay */}
      {showControls && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Button
            variant="ghost"
            size="icon"
            className="w-20 h-20 rounded-full bg-black/50 hover:bg-black/70 text-white pointer-events-auto"
            onClick={handleClick}
          >
            {isPlaying ? (
              <Pause className="w-10 h-10" />
            ) : (
              <Play className="w-10 h-10" />
            )}
          </Button>
        </div>
      )}

      {/* Volume controls */}
      {showControls && (
        <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-auto">
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white"
            onClick={toggleMute}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>
          
          <div className="w-20 h-1 bg-white/20 rounded-full overflow-hidden">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-full h-full opacity-0 cursor-pointer"
            />
            <div
              className="h-full bg-white rounded-full transition-all duration-200"
              style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Progress bar */}
      {showProgress && duration && (
        <div
          ref={progressRef}
          className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 cursor-pointer"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-white transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Time display */}
      {showProgress && duration && (
        <div className="absolute bottom-2 right-4 text-white text-xs bg-black/50 px-2 py-1 rounded">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      )}
    </div>
  );
}
