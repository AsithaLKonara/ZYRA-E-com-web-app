'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { EnhancedVideoPlayer } from './enhanced-video-player';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { clientLogger } from '@/lib/client-logger';
import { 
  Loader2, 
  ChevronUp, 
  ChevronDown,
  Volume2,
  VolumeX,
  Settings,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Reel {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  bookmarkCount?: number;
  featured: boolean;
  trendingScore: number;
  createdAt: string;
  publishedAt?: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    verified?: boolean;
    followerCount?: number;
  };
  products: Array<{
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    images: string[];
    slug: string;
    position: { x: number; y: number };
    isFeatured?: boolean;
  }>;
  hashtags: string[];
  userInteractions: Array<{
    id: string;
    interactionType: string;
    createdAt: string;
  }>;
  stats: {
    totalInteractions: number;
    totalComments: number;
  };
}

interface EnhancedReelsFeedProps {
  userId?: string;
  featured?: boolean;
  category?: string;
  className?: string;
  autoPlay?: boolean;
  showNavigation?: boolean;
  showControls?: boolean;
}

interface TouchState {
  startY: number;
  startTime: number;
  isDragging: boolean;
  currentY: number;
  velocity: number;
}

export function EnhancedReelsFeed({ 
  userId, 
  featured, 
  category,
  className,
  autoPlay = true,
  showNavigation = true,
  showControls = true
}: EnhancedReelsFeedProps) {
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const touchState = useRef<TouchState>({
    startY: 0,
    startTime: 0,
    isDragging: false,
    currentY: 0,
    velocity: 0
  });

  // Load reels
  const loadReels = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10'
      });
      
      if (userId) params.append('userId', userId);
      if (featured) params.append('featured', 'true');
      if (category) params.append('category', category);

      const response = await fetch(`/api/reels?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reels');
      }
      
      const data = await response.json();

      if (data.success) {
        const newReels = data.data || [];
        setReels(prev => reset ? newReels : [...prev, ...newReels]);
        setHasMore(newReels.length === 10);
        setPage(pageNum);
      } else {
        throw new Error(data.message || 'Failed to load reels');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reels');
    } finally {
      setLoading(false);
    }
  }, [userId, featured, category]);

  // Load more reels
  const loadMore = useCallback(() => {
    if (!loading && hasMore && !error) {
      loadReels(page + 1, false);
    }
  }, [loading, hasMore, error, page, loadReels]);

  // Navigation functions with haptic feedback
  const goToNext = useCallback(() => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(prev => prev + 1);
      
      // Add haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      // Load more if near end
      if (currentIndex >= reels.length - 3) {
        loadMore();
      }
    }
  }, [currentIndex, reels.length, loadMore]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      
      // Add haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  }, [currentIndex]);

  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < reels.length) {
      setCurrentIndex(index);
    }
  }, [reels.length]);

  // Advanced touch handling with gesture recognition
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchState.current = {
      startY: touch.clientY,
      startTime: Date.now(),
      isDragging: true,
      currentY: touch.clientY,
      velocity: 0
    };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState.current.isDragging) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    const currentTime = Date.now();
    const deltaY = touch.clientY - touchState.current.startY;
    const deltaTime = currentTime - touchState.current.startTime;
    
    touchState.current.currentY = touch.clientY;
    touchState.current.velocity = deltaY / deltaTime;
    
    // Enhanced visual feedback for drag
    if (containerRef.current) {
      const progress = Math.abs(deltaY) / window.innerHeight;
      const clampedProgress = Math.min(progress, 1);
      
      // Add more dynamic visual feedback
      containerRef.current.style.transform = `translateY(${deltaY * 0.1}px) scale(${1 - clampedProgress * 0.02})`;
      containerRef.current.style.opacity = `${1 - clampedProgress * 0.3}`;
      
      // Add blur effect for better visual feedback
      containerRef.current.style.filter = `blur(${clampedProgress * 2}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchState.current.isDragging) return;
    
    const touch = e.changedTouches[0];
    if (!touch) return;
    const deltaY = touch.clientY - touchState.current.startY;
    const velocity = touchState.current.velocity;
    const threshold = 50;
    const velocityThreshold = 0.5;
    
    // Reset visual feedback with smooth transition
    if (containerRef.current) {
      containerRef.current.style.transition = 'all 0.3s ease-out';
      containerRef.current.style.transform = '';
      containerRef.current.style.opacity = '';
      containerRef.current.style.filter = '';
      
      // Remove transition after animation completes
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.transition = '';
        }
      }, 300);
    }
    
    // Determine if we should navigate with improved thresholds
    if (Math.abs(deltaY) > threshold || Math.abs(velocity) > velocityThreshold) {
      if (deltaY < 0 || velocity < -velocityThreshold) {
        // Swipe up - next video
        goToNext();
      } else if (deltaY > 0 || velocity > velocityThreshold) {
        // Swipe down - previous video
        goToPrevious();
      }
    }
    
    touchState.current.isDragging = false;
  }, [goToNext, goToPrevious]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        goToNext();
        break;
      case 'ArrowDown':
        event.preventDefault();
        goToPrevious();
        break;
      case ' ':
        event.preventDefault();
        setIsPlaying(prev => !prev);
        break;
      case 'm':
      case 'M':
        event.preventDefault();
        setIsMuted(prev => !prev);
        break;
    }
  }, [goToNext, goToPrevious]);

  // Wheel navigation
  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    
    // Throttle wheel events
    if (Math.abs(event.deltaY) > 10) {
      if (event.deltaY > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  }, [goToNext, goToPrevious]);

  // Interaction handlers
  const handleLike = useCallback(async (reelId: string) => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/reels/${reelId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionType: 'LIKE',
          userId
        })
      });

      if (response.ok) {
        setReels(prev => prev.map(reel => {
          if (reel.id === reelId) {
            const isLiked = reel.userInteractions.some(i => i.interactionType === 'LIKE');
            return {
              ...reel,
              likeCount: isLiked ? reel.likeCount - 1 : reel.likeCount + 1,
              userInteractions: isLiked 
                ? reel.userInteractions.filter(i => i.interactionType !== 'LIKE')
                : [...reel.userInteractions, { id: '', interactionType: 'LIKE', createdAt: new Date().toISOString() }]
            };
          }
          return reel;
        }));
      }
    } catch (error) {
      clientLogger.error('Failed to like reel', {}, error instanceof Error ? error : undefined);
    }
  }, [userId]);

  const handleComment = useCallback((reelId: string) => {
    // TODO: Open comment modal
    clientLogger.debug('Open comments for reel', { reelId });
  }, []);

  const handleShare = useCallback(async (reelId: string) => {
    try {
      const response = await fetch(`/api/reels/${reelId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionType: 'SHARE',
          userId: userId || 'anonymous'
        })
      });

      if (response.ok) {
        setReels(prev => prev.map(reel => {
          if (reel.id === reelId) {
            return {
              ...reel,
              shareCount: reel.shareCount + 1
            };
          }
          return reel;
        }));
      }

      // Share functionality
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this reel!',
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch (error) {
      clientLogger.error('Failed to share reel', {}, error instanceof Error ? error : undefined);
    }
  }, [userId]);

  const handleView = useCallback(async (reelId: string) => {
    if (!userId) return;

    try {
      await fetch(`/api/reels/${reelId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interactionType: 'VIEW',
          userId
        })
      });
    } catch (error) {
      clientLogger.error('Failed to track view', {}, error instanceof Error ? error : undefined);
    }
  }, [userId]);

  const handleProductClick = useCallback((product: any) => {
    window.open(`/products/${product.slug}`, '_blank');
  }, []);

  const handleUserClick = useCallback((user: any) => {
    window.open(`/profile/${user.username}`, '_blank');
  }, []);

  const handleHashtagClick = useCallback((hashtag: string) => {
    // Navigate to hashtag page or search
    window.location.href = `/search?q=%23${hashtag}`;
  }, []);

  // Load initial reels
  useEffect(() => {
    loadReels(1, true);
  }, [loadReels]);

  // Add event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('wheel', handleWheel);
    };
  }, [handleKeyDown, handleWheel]);

  // Auto-play management
  useEffect(() => {
    if (autoPlay) {
      setIsPlaying(true);
    }
  }, [currentIndex, autoPlay]);

  const currentReel = reels[currentIndex];
  const isLiked = currentReel?.userInteractions.some(i => i.interactionType === 'LIKE') || false;
  const isBookmarked = currentReel?.userInteractions.some(i => i.interactionType === 'BOOKMARK') || false;

  if (loading && reels.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-screen', className)}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading reels...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex items-center justify-center h-screen', className)}>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => loadReels(1, true)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-screen', className)}>
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No reels found</h3>
          <p className="text-muted-foreground mb-4">
            {featured ? 'No featured reels available' : 'Check back later for new content!'}
          </p>
          <Button onClick={() => loadReels(1, true)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative w-full h-screen overflow-hidden bg-black', className)}>
      {/* Current reel */}
      {currentReel && (
        <div
          ref={containerRef}
          className="w-full h-full"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <EnhancedVideoPlayer
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
            bookmarkCount={currentReel.bookmarkCount}
            isLiked={isLiked}
            isBookmarked={isBookmarked}
            isPlaying={isPlaying}
            autoPlay={autoPlay}
            user={currentReel.user}
            products={currentReel.products}
            hashtags={currentReel.hashtags}
            onLike={() => handleLike(currentReel.id)}
            onComment={() => handleComment(currentReel.id)}
            onShare={() => handleShare(currentReel.id)}
            onView={() => handleView(currentReel.id)}
            onProductClick={handleProductClick}
            onUserClick={handleUserClick}
            onHashtagClick={handleHashtagClick}
          />
        </div>
      )}

      {/* Navigation controls */}
      {showNavigation && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 z-10">
          {reels.map((_, index) => (
            <button
              key={index}
              className={cn(
                'w-2 h-8 rounded-full transition-all duration-200 backdrop-blur-sm',
                index === currentIndex 
                  ? 'bg-white' 
                  : 'bg-white/30 hover:bg-white/50'
              )}
              onClick={() => goToIndex(index)}
            />
          ))}
        </div>
      )}

      {/* Global controls */}
      {showControls && (
        <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
            className="bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
        </div>
      )}

      {/* Navigation arrows */}
      {showNavigation && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm z-10"
          >
            <ChevronUp className="w-6 h-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            disabled={currentIndex === reels.length - 1}
            className="absolute left-4 bottom-1/2 transform translate-y-1/2 bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm z-10"
          >
            <ChevronDown className="w-6 h-6" />
          </Button>
        </>
      )}

      {/* Load more indicator */}
      {loading && (
        <div className="absolute bottom-20 right-4 z-10">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
        </div>
      )}

      {/* Progress indicator */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-10">
        <div
          className="h-full bg-white transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / reels.length) * 100}%` }}
        />
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="absolute bottom-4 left-4 text-white/60 text-xs z-10">
        <p>↑↓ Navigate • Space Play/Pause • M Mute</p>
      </div>
    </div>
  );
}
