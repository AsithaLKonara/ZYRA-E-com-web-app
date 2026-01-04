"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  ShoppingCart, 
  Heart,
  Star,
  DollarSign
} from "lucide-react"

interface ProductAnalyticsProps {
  productId: string
  className?: string
}

// Mock analytics data
const mockAnalytics = {
  views: 1250,
  viewsChange: 12.5,
  addToCart: 89,
  addToCartChange: -3.2,
  wishlist: 45,
  wishlistChange: 8.1,
  orders: 23,
  ordersChange: 15.3,
  revenue: 6899.99,
  revenueChange: 22.7,
  rating: 4.3,
  reviewCount: 128,
  conversionRate: 2.6,
  conversionRateChange: 0.8
}

export function ProductAnalytics({ productId, className }: ProductAnalyticsProps) {
  const analytics = mockAnalytics

  const formatChange = (change: number) => {
    const isPositive = change > 0
    return {
      value: `${isPositive ? '+' : ''}${change.toFixed(1)}%`,
      color: isPositive ? 'text-green-600' : 'text-red-600',
      icon: isPositive ? TrendingUp : TrendingDown
    }
  }

  const viewsChange = formatChange(analytics.viewsChange)
  const addToCartChange = formatChange(analytics.addToCartChange)
  const wishlistChange = formatChange(analytics.wishlistChange)
  const ordersChange = formatChange(analytics.ordersChange)
  const revenueChange = formatChange(analytics.revenueChange)
  const conversionChange = formatChange(analytics.conversionRateChange)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Views</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.views.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  <viewsChange.icon className={`h-4 w-4 ${viewsChange.color}`} />
                  <span className={`text-sm ${viewsChange.color}`}>
                    {viewsChange.value}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Add to Cart</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.addToCart}</p>
                <div className="flex items-center mt-1">
                  <addToCartChange.icon className={`h-4 w-4 ${addToCartChange.color}`} />
                  <span className={`text-sm ${addToCartChange.color}`}>
                    {addToCartChange.value}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Wishlist</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.wishlist}</p>
                <div className="flex items-center mt-1">
                  <wishlistChange.icon className={`h-4 w-4 ${wishlistChange.color}`} />
                  <span className={`text-sm ${wishlistChange.color}`}>
                    {wishlistChange.value}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${analytics.revenue.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  <revenueChange.icon className={`h-4 w-4 ${revenueChange.color}`} />
                  <span className={`text-sm ${revenueChange.color}`}>
                    {revenueChange.value}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Key performance indicators for this product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Orders</span>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold">{analytics.orders}</span>
                <div className="flex items-center">
                  <ordersChange.icon className={`h-4 w-4 ${ordersChange.color}`} />
                  <span className={`text-sm ${ordersChange.color}`}>
                    {ordersChange.value}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Conversion Rate</span>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold">{analytics.conversionRate}%</span>
                <div className="flex items-center">
                  <conversionChange.icon className={`h-4 w-4 ${conversionChange.color}`} />
                  <span className={`text-sm ${conversionChange.color}`}>
                    {conversionChange.value}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Average Rating</span>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-lg font-bold ml-1">{analytics.rating}</span>
                </div>
                <Badge variant="outline">{analytics.reviewCount} reviews</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Product updated</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New review received</p>
                  <p className="text-xs text-gray-500">5 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Stock level updated</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Price updated</p>
                  <p className="text-xs text-gray-500">2 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



