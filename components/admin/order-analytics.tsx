"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign,
  Users,
  ShoppingCart,
  Clock,
  CheckCircle
} from "lucide-react"

interface OrderAnalyticsProps {
  className?: string
}

// Mock analytics data
const mockAnalytics = {
  totalOrders: 1247,
  totalOrdersChange: 12.5,
  totalRevenue: 45678.90,
  totalRevenueChange: 18.3,
  averageOrderValue: 36.65,
  averageOrderValueChange: 5.2,
  conversionRate: 3.2,
  conversionRateChange: -0.8,
  ordersByStatus: {
    processing: 45,
    shipped: 123,
    delivered: 1056,
    cancelled: 23
  },
  ordersByDay: [
    { day: "Mon", orders: 45, revenue: 1650 },
    { day: "Tue", orders: 52, revenue: 1890 },
    { day: "Wed", orders: 38, revenue: 1420 },
    { day: "Thu", orders: 61, revenue: 2230 },
    { day: "Fri", orders: 48, revenue: 1750 },
    { day: "Sat", orders: 35, revenue: 1280 },
    { day: "Sun", orders: 29, revenue: 1050 }
  ],
  topProducts: [
    { name: "Premium Wireless Headphones", orders: 89, revenue: 26611 },
    { name: "Smart Fitness Watch", orders: 67, revenue: 13399 },
    { name: "Organic Cotton T-Shirt", orders: 156, revenue: 4679 },
    { name: "Bluetooth Speaker", orders: 43, revenue: 3869 },
    { name: "Leather Wallet", orders: 34, revenue: 1699 }
  ]
}

export function OrderAnalytics({ className }: OrderAnalyticsProps) {
  const analytics = mockAnalytics

  const formatChange = (change: number) => {
    const isPositive = change > 0
    return {
      value: `${isPositive ? '+' : ''}${change.toFixed(1)}%`,
      color: isPositive ? 'text-green-600' : 'text-red-600',
      icon: isPositive ? TrendingUp : TrendingDown
    }
  }

  const totalOrdersChange = formatChange(analytics.totalOrdersChange)
  const totalRevenueChange = formatChange(analytics.totalRevenueChange)
  const averageOrderValueChange = formatChange(analytics.averageOrderValueChange)
  const conversionRateChange = formatChange(analytics.conversionRateChange)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalOrders.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  <totalOrdersChange.icon className={`h-4 w-4 ${totalOrdersChange.color}`} />
                  <span className={`text-sm ${totalOrdersChange.color}`}>
                    {totalOrdersChange.value}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${analytics.totalRevenue.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  <totalRevenueChange.icon className={`h-4 w-4 ${totalRevenueChange.color}`} />
                  <span className={`text-sm ${totalRevenueChange.color}`}>
                    {totalRevenueChange.value}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">${analytics.averageOrderValue}</p>
                <div className="flex items-center mt-1">
                  <averageOrderValueChange.icon className={`h-4 w-4 ${averageOrderValueChange.color}`} />
                  <span className={`text-sm ${averageOrderValueChange.color}`}>
                    {averageOrderValueChange.value}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.conversionRate}%</p>
                <div className="flex items-center mt-1">
                  <conversionRateChange.icon className={`h-4 w-4 ${conversionRateChange.color}`} />
                  <span className={`text-sm ${conversionRateChange.color}`}>
                    {conversionRateChange.value}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
            <CardDescription>Current distribution of order statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.ordersByStatus).map(([status, count]) => {
                const total = Object.values(analytics.ordersByStatus).reduce((sum, val) => sum + val, 0)
                const percentage = ((count / total) * 100).toFixed(1)
                
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        status === 'processing' ? 'bg-yellow-500' :
                        status === 'shipped' ? 'bg-blue-500' :
                        status === 'delivered' ? 'bg-green-500' :
                        'bg-red-500'
                      }`}></div>
                      <span className="text-sm font-medium capitalize">{status}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{count}</span>
                      <span className="text-xs text-gray-500">({percentage}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best performing products by orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.orders} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${product.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Orders Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Orders</CardTitle>
          <CardDescription>Orders and revenue for the past week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.ordersByDay.map((day) => (
              <div key={day.day} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium w-8">{day.day}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(day.orders / 70) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{day.orders} orders</p>
                  <p className="text-xs text-gray-500">${day.revenue.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



