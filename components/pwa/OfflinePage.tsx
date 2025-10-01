'use client'

import { useEffect, useState } from 'react'
import { usePWA } from './PWAProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WifiOff, RefreshCw, Home, ShoppingCart, Heart, User } from 'lucide-react'
import Link from 'next/link'

export default function OfflinePage() {
  const { isOnline } = usePWA()
  const [cachedData, setCachedData] = useState({
    products: [],
    categories: [],
    cart: [],
    wishlist: [],
  })

  useEffect(() => {
    // Load cached data when offline
    if (!isOnline) {
      loadCachedData()
    }
  }, [isOnline])

  const loadCachedData = async () => {
    try {
      // Load cached products
      const cachedProducts = localStorage.getItem('cached-products')
      if (cachedProducts) {
        setCachedData(prev => ({
          ...prev,
          products: JSON.parse(cachedProducts)
        }))
      }

      // Load cached categories
      const cachedCategories = localStorage.getItem('cached-categories')
      if (cachedCategories) {
        setCachedData(prev => ({
          ...prev,
          categories: JSON.parse(cachedCategories)
        }))
      }

      // Load cart data
      const cartData = localStorage.getItem('cart')
      if (cartData) {
        setCachedData(prev => ({
          ...prev,
          cart: JSON.parse(cartData)
        }))
      }

      // Load wishlist data
      const wishlistData = localStorage.getItem('wishlist')
      if (wishlistData) {
        setCachedData(prev => ({
          ...prev,
          wishlist: JSON.parse(wishlistData)
        }))
      }
    } catch (error) {
      console.error('Error loading cached data:', error)
    }
  }

  const handleRetry = () => {
    window.location.reload()
  }

  if (isOnline) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Offline Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiOff className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You're Offline
          </h1>
          <p className="text-gray-600">
            Don't worry! You can still browse cached content and your saved items.
          </p>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>
              Access your saved content while offline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleRetry}
              className="w-full"
              variant="default"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Cached Content */}
        {cachedData.products.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cached Products</CardTitle>
              <CardDescription>
                {cachedData.products.length} products available offline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cachedData.products.slice(0, 3).map((product: any) => (
                  <div key={product.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                    <div className="w-10 h-10 bg-gray-200 rounded"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-gray-500">${product.price}</p>
                    </div>
                  </div>
                ))}
                {cachedData.products.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{cachedData.products.length - 3} more products
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cart & Wishlist */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {cachedData.cart.length}
              </p>
              <p className="text-xs text-gray-500">items saved</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Heart className="w-4 h-4 mr-2" />
                Wishlist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {cachedData.wishlist.length}
              </p>
              <p className="text-xs text-gray-500">items saved</p>
            </CardContent>
          </Card>
        </div>

        {/* Offline Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Offline Features</CardTitle>
            <CardDescription>
              What you can do while offline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Browse cached products</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>View your cart and wishlist</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Read product descriptions</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Add items to cart (syncs when online)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Place orders (requires connection)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Status */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>No internet connection</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Your changes will sync when you're back online
          </p>
        </div>
      </div>
    </div>
  )
}




