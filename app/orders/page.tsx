"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { clientLogger } from "@/lib/client-logger"
import { 
  Package, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  RefreshCw,
  Calendar,
  MapPin,
  CreditCard
} from "lucide-react"
import Link from "next/link"

// Mock order data
const mockOrders = [
  {
    id: "ORD-001",
    orderNumber: "NEOSHOP-2024-001",
    date: "2024-01-15",
    status: "delivered",
    total: 299.99,
    items: [
      {
        id: "1",
        name: "Premium Wireless Headphones",
        quantity: 1,
        price: 299.99,
        image: "/api/placeholder/60/60"
      }
    ],
    shippingAddress: {
      name: "John Doe",
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "US"
    },
    paymentMethod: "Visa ending in 4242",
    trackingNumber: "1Z999AA1234567890"
  },
  {
    id: "ORD-002",
    orderNumber: "NEOSHOP-2024-002",
    date: "2024-01-14",
    status: "shipped",
    total: 149.99,
    items: [
      {
        id: "3",
        name: "Organic Cotton T-Shirt",
        quantity: 2,
        price: 29.99,
        image: "/api/placeholder/60/60"
      },
      {
        id: "6",
        name: "Leather Wallet",
        quantity: 1,
        price: 49.99,
        image: "/api/placeholder/60/60"
      }
    ],
    shippingAddress: {
      name: "John Doe",
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "US"
    },
    paymentMethod: "Mastercard ending in 5555",
    trackingNumber: "1Z999BB1234567890"
  },
  {
    id: "ORD-003",
    orderNumber: "NEOSHOP-2024-003",
    date: "2024-01-13",
    status: "processing",
    total: 89.99,
    items: [
      {
        id: "5",
        name: "Bluetooth Speaker",
        quantity: 1,
        price: 89.99,
        image: "/api/placeholder/60/60"
      }
    ],
    shippingAddress: {
      name: "John Doe",
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "US"
    },
    paymentMethod: "PayPal",
    trackingNumber: null
  },
  {
    id: "ORD-004",
    orderNumber: "NEOSHOP-2024-004",
    date: "2024-01-12",
    status: "cancelled",
    total: 199.99,
    items: [
      {
        id: "2",
        name: "Smart Fitness Watch",
        quantity: 1,
        price: 199.99,
        image: "/api/placeholder/60/60"
      }
    ],
    shippingAddress: {
      name: "John Doe",
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "US"
    },
    paymentMethod: "Visa ending in 4242",
    trackingNumber: null
  }
]

const statusConfig = {
  processing: { label: "Processing", color: "bg-yellow-100 text-yellow-800" },
  shipped: { label: "Shipped", color: "bg-blue-100 text-blue-800" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
  returned: { label: "Returned", color: "bg-gray-100 text-gray-800" }
}

export default function OrdersPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [orders, setOrders] = useState(mockOrders)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please sign in to view your orders</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesDate = dateFilter === "all" || 
                       (dateFilter === "last30" && new Date(order.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) ||
                       (dateFilter === "last90" && new Date(order.date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
    
    return matchesSearch && matchesStatus && matchesDate
  })

  const handleReorder = (orderId: string) => {
    clientLogger.info('Reorder order', { orderId })
    // Implement reorder functionality
  }

  const handleTrackOrder = (orderId: string) => {
    clientLogger.info('Track order', { orderId })
    // Implement tracking functionality
  }

  const handleDownloadInvoice = (orderId: string) => {
    clientLogger.info('Download invoice for order', { orderId })
    // Implement invoice download
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
          <p className="text-gray-600 mt-2">Track and manage your orders</p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search orders or products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="last30">Last 30 Days</SelectItem>
                    <SelectItem value="last90">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || statusFilter !== "all" || dateFilter !== "all"
                    ? "Try adjusting your filters to see more orders."
                    : "You haven't placed any orders yet."}
                </p>
                <Button asChild>
                  <Link href="/products">Start Shopping</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(order.date).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusConfig[order.status as keyof typeof statusConfig].color}>
                        {statusConfig[order.status as keyof typeof statusConfig].label}
                      </Badge>
                      <span className="text-lg font-bold">${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Order Items */}
                  <div className="space-y-3 mb-6">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Order Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h5 className="font-medium text-sm text-gray-700 mb-1">Shipping Address</h5>
                      <div className="text-sm text-gray-600">
                        <p>{order.shippingAddress.name}</p>
                        <p>{order.shippingAddress.street}</p>
                        <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-sm text-gray-700 mb-1">Payment Method</h5>
                      <p className="text-sm text-gray-600">{order.paymentMethod}</p>
                    </div>
                    
                    {order.trackingNumber && (
                      <div>
                        <h5 className="font-medium text-sm text-gray-700 mb-1">Tracking Number</h5>
                        <p className="text-sm text-gray-600 font-mono">{order.trackingNumber}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/orders/${order.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                    
                    {order.status === "delivered" && (
                      <Button variant="outline" size="sm" onClick={() => handleReorder(order.id)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reorder
                      </Button>
                    )}
                    
                    {order.trackingNumber && (
                      <Button variant="outline" size="sm" onClick={() => handleTrackOrder(order.id)}>
                        <Package className="h-4 w-4 mr-2" />
                        Track Package
                      </Button>
                    )}
                    
                    <Button variant="outline" size="sm" onClick={() => handleDownloadInvoice(order.id)}>
                      <Download className="h-4 w-4 mr-2" />
                      Invoice
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}