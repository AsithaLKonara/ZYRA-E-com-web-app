"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductCard } from "@/components/products/product-card"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, TrendingUp, Star, Sparkles, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductRecommendationsProps {
  type: 'similar' | 'trending' | 'personalized' | 'frequently_bought' | 'new_arrivals'
  productId?: string
  userId?: string
  category?: string
  limit?: number
  title?: string
  description?: string
  className?: string
}

const recommendationConfig = {
  similar: {
    icon: RefreshCw,
    title: "Similar Products",
    description: "You might also like these products"
  },
  trending: {
    icon: TrendingUp,
    title: "Trending Now",
    description: "Popular products everyone's buying"
  },
  personalized: {
    icon: Star,
    title: "Recommended for You",
    description: "Based on your preferences and purchase history"
  },
  frequently_bought: {
    icon: Sparkles,
    title: "Frequently Bought Together",
    description: "Customers who bought this also bought"
  },
  new_arrivals: {
    icon: Clock,
    title: "New Arrivals",
    description: "Fresh products just added to our store"
  }
}

export function ProductRecommendations({
  type,
  productId,
  userId,
  category,
  limit = 8,
  title,
  description,
  className
}: ProductRecommendationsProps) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const config = recommendationConfig[type]
  const displayTitle = title || config.title
  const displayDescription = description || config.description
  const Icon = config.icon

  useEffect(() => {
    fetchRecommendations()
  }, [type, productId, userId, category, limit])

  const fetchRecommendations = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        type,
        limit: limit.toString()
      })

      if (productId) params.set('productId', productId)
      if (userId) params.set('userId', userId)
      if (category) params.set('category', category)

      const response = await fetch(`/api/recommendations?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations')
      }

      const data = await response.json()
      setProducts(data.data.recommendations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchRecommendations()
  }

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: limit }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-6 w-6 text-muted-foreground" />
              <CardTitle>{displayTitle}</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
          <CardDescription>{displayDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-6 w-6 text-primary" />
            <CardTitle>{displayTitle}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {products.length}
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <CardDescription>{displayDescription}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div key={product.id} className="h-full">
              <ProductCard
                product={product}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
