"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductRatingProps {
  rating: number
  reviewCount: number
  showReviewCount?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export function ProductRating({ 
  rating, 
  reviewCount, 
  showReviewCount = true,
  size = "md",
  className 
}: ProductRatingProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  }

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  }

  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center" data-testid="product-rating">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star
            key={`full-${i}`}
            className={cn(
              "fill-yellow-400 text-yellow-400",
              sizeClasses[size]
            )}
          />
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star
              className={cn(
                "text-gray-300",
                sizeClasses[size]
              )}
            />
            <Star
              className={cn(
                "absolute top-0 left-0 fill-yellow-400 text-yellow-400 overflow-hidden",
                sizeClasses[size]
              )}
              style={{ width: "50%" }}
            />
          </div>
        )}
        
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(
              "text-gray-300",
              sizeClasses[size]
            )}
          />
        ))}
      </div>
      
      {showReviewCount && (
        <span 
          className={cn(
            "text-muted-foreground",
            textSizeClasses[size]
          )}
          data-testid="review-count"
        >
          ({reviewCount.toLocaleString()})
        </span>
      )}
    </div>
  )
}



