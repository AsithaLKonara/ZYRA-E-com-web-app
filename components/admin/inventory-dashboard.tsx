'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { logger } from '@/lib/logger'
import { CURRENCY } from '@/lib/constants'

interface InventoryMetrics {
  totalProducts: number
  totalStock: number
  averageStock: number
  lowStockCount: number
  outOfStockCount: number
  totalValue: number
}

interface Product {
  id: string
  name: string
  sku: string
  stock: number
  price: number
  category: {
    name: string
  }
  totalSales: number
}

interface InventoryData {
  products: Product[]
  metrics: InventoryMetrics
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function InventoryDashboard() {
  const [data, setData] = useState<InventoryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [stockStatus, setStockStatus] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    loadInventoryData()
  }, [search, stockStatus, page])

  const loadInventoryData = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(stockStatus && { stockStatus }),
      })

      const response = await fetch(`/api/admin/inventory?${params}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.error || 'Failed to load inventory data')
      }
    } catch (error) {
      logger.error('Error loading inventory data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load inventory data')
    } finally {
      setIsLoading(false)
    }
  }

  const getStockStatusBadge = (stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>
    } else if (stock <= 10) {
      return <Badge variant="secondary">Low Stock</Badge>
    } else {
      return <Badge variant="default">In Stock</Badge>
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadInventoryData()
  }

  const handleStockStatusChange = (status: string) => {
    setStockStatus(status)
    setPage(1)
  }

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.totalStock}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {data.metrics.lowStockCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data.metrics.outOfStockCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
          <CardDescription>
            Manage your product inventory and stock levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="flex gap-2">
                <Input
                  placeholder="Search products by name or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit">Search</Button>
              </div>
            </form>

            <div className="flex gap-2">
              <Button
                variant={stockStatus === '' ? 'default' : 'outline'}
                onClick={() => handleStockStatusChange('')}
              >
                All
              </Button>
              <Button
                variant={stockStatus === 'in-stock' ? 'default' : 'outline'}
                onClick={() => handleStockStatusChange('in-stock')}
              >
                In Stock
              </Button>
              <Button
                variant={stockStatus === 'low-stock' ? 'default' : 'outline'}
                onClick={() => handleStockStatusChange('low-stock')}
              >
                Low Stock
              </Button>
              <Button
                variant={stockStatus === 'out-of-stock' ? 'default' : 'outline'}
                onClick={() => handleStockStatusChange('out-of-stock')}
              >
                Out of Stock
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            Showing {data.products.length} of {data.pagination.total} products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        SKU: {product.sku} • {product.category.name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Stock</p>
                    <p className="font-medium">{product.stock}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="font-medium">
                      {CURRENCY.SYMBOL}{product.price.toFixed(2)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="font-medium">
                      {CURRENCY.SYMBOL}{(product.price * product.stock).toFixed(2)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Sales</p>
                    <p className="font-medium">{product.totalSales}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStockStatusBadge(product.stock)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}




