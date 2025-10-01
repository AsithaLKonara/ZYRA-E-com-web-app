"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin, 
  CreditCard,
  Download,
  RefreshCw,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"

// Mock order data
const mockOrder = {
  id: "ORD-001",
  orderNumber: "NEOSHOP-2024-001",
  date: "2024-01-15",
  status: "delivered",
  total: 299.99,
  subtotal: 275.00,
  tax: 22.00,
  shipping: 2.99,
  items: [
    {
      id: "1",
      name: "Premium Wireless Headphones",
      quantity: 1,
      price: 299.99,
      image: "/api/placeholder/80/80",
      description: "High-quality wireless headphones with noise cancellation"
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
  billingAddress: {
    name: "John Doe",
    street: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "US"
  },
  paymentMethod: {
    type: "Visa",
    last4: "4242",
    brand: "Visa"
  },
  trackingNumber: "1Z999AA1234567890",
  trackingUrl: "https://www.ups.com/track?trackingNumber=1Z999AA1234567890",
  estimatedDelivery: "2024-01-18",
  actualDelivery: "2024-01-17"
}

const statusSteps = [
  { key: "processing", label: "Order Placed", icon: Clock },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle }
]

const statusConfig = {
  processing: { label: "Processing", color: "bg-yellow-100 text-yellow-800" },
  shipped: { label: "Shipped", color: "bg-blue-100 text-blue-800" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" }
}

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string
  const { user, isAuthenticated, isLoading } = useAuth()
  const [order, setOrder] = useState(mockOrder)
  const [isLoadingOrder, setIsLoadingOrder] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoadingOrder(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setOrder(mockOrder)
      } catch (error) {
        console.error("Error fetching order:", error)
      } finally {
        setIsLoadingOrder(false)
      }
    }

    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  if (isLoading || isLoadingOrder) {
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
            <CardDescription>Please sign in to view order details</CardDescription>
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

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Order Not Found</CardTitle>
            <CardDescription>The order you're looking for doesn't exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/orders">Back to Orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusProgress = () => {
    switch (order.status) {
      case "processing": return 33
      case "shipped": return 66
      case "delivered": return 100
      default: return 0
    }
  }

  const handleReorder = () => {
    console.log("Reorder items")
    // Implement reorder functionality
  }

  const handleDownloadInvoice = () => {
    console.log("Download invoice")
    // Implement invoice download
  }

  const handleTrackPackage = () => {
    if (order.trackingUrl) {
      window.open(order.trackingUrl, "_blank")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{order.orderNumber}</h1>
              <p className="text-gray-600 mt-2">
                Ordered on {new Date(order.date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={statusConfig[order.status as keyof typeof statusConfig].color}>
                {statusConfig[order.status as keyof typeof statusConfig].label}
              </Badge>
              <span className="text-2xl font-bold">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Order Status Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={getStatusProgress()} className="h-2" />
              
              <div className="flex justify-between">
                {statusSteps.map((step, index) => {
                  const isActive = order.status === step.key
                  const isCompleted = statusSteps.findIndex(s => s.key === order.status) >= index
                  const Icon = step.icon
                  
                  return (
                    <div key={step.key} className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted 
                          ? "bg-green-500 text-white" 
                          : isActive 
                            ? "bg-blue-500 text-white" 
                            : "bg-gray-200 text-gray-500"
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={`text-sm mt-2 ${
                        isCompleted || isActive ? "text-gray-900 font-medium" : "text-gray-500"
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-lg">{item.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-lg">${(item.price * item.quantity).toFixed(2)}</p>
                        <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tracking Information */}
            {order.trackingNumber && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Tracking Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Tracking Number</p>
                      <p className="font-mono text-lg">{order.trackingNumber}</p>
                    </div>
                    
                    {order.estimatedDelivery && (
                      <div>
                        <p className="text-sm text-gray-600">Estimated Delivery</p>
                        <p className="text-lg">{new Date(order.estimatedDelivery).toLocaleDateString()}</p>
                      </div>
                    )}
                    
                    {order.actualDelivery && (
                      <div>
                        <p className="text-sm text-gray-600">Delivered On</p>
                        <p className="text-lg text-green-600">{new Date(order.actualDelivery).toLocaleDateString()}</p>
                      </div>
                    )}
                    
                    <Button onClick={handleTrackPackage} className="w-full">
                      Track Package
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>${order.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p className="font-medium">{order.shippingAddress.name}</p>
                  <p>{order.shippingAddress.street}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p className="font-medium">{order.paymentMethod.brand} ending in {order.paymentMethod.last4}</p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-2">
              {order.status === "delivered" && (
                <Button onClick={handleReorder} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reorder Items
                </Button>
              )}
              
              <Button variant="outline" onClick={handleDownloadInvoice} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}