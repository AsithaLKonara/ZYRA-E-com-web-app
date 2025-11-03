"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { clientLogger } from "@/lib/client-logger"
import { 
  ArrowLeft, 
  Package, 
  User, 
  MapPin, 
  CreditCard,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { UserRole } from "@prisma/client"

// Mock order data
const mockOrder = {
  id: "ORD-001",
  orderNumber: "NEOSHOP-2024-001",
  customer: {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 (555) 123-4567"
  },
  date: "2024-01-15",
  status: "delivered",
  total: 299.99,
  subtotal: 275.00,
  tax: 22.00,
  shipping: 2.99,
  items: [
    {
      id: "1",
      productId: "1",
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
  paymentStatus: "paid",
  trackingNumber: "1Z999AA1234567890",
  estimatedDelivery: "2024-01-18",
  actualDelivery: "2024-01-17",
  notes: "Customer requested expedited shipping"
}

const statusOptions = [
  { value: "processing", label: "Processing", icon: Clock },
  { value: "shipped", label: "Shipped", icon: Truck },
  { value: "delivered", label: "Delivered", icon: CheckCircle },
  { value: "cancelled", label: "Cancelled", icon: AlertCircle }
]

const statusConfig = {
  processing: { label: "Processing", color: "bg-yellow-100 text-yellow-800" },
  shipped: { label: "Shipped", color: "bg-blue-100 text-blue-800" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" }
}

export default function AdminOrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string
  const { user, isAuthenticated, isLoading } = useAuth()
  const [order, setOrder] = useState(mockOrder)
  const [isLoadingOrder, setIsLoadingOrder] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoadingOrder(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setOrder(mockOrder)
      } catch (error) {
        clientLogger.error("Error fetching order", {}, error instanceof Error ? error : undefined)
      } finally {
        setIsLoadingOrder(false)
      }
    }

    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setOrder(prev => ({ ...prev, status: newStatus }))
    } catch (error) {
      clientLogger.error("Error updating order status", {}, error instanceof Error ? error : undefined)
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading || isLoadingOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Admin access required</CardDescription>
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
              <Link href="/admin/orders">Back to Orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/admin/orders">
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
            <div className="flex items-center gap-4">
              <Badge className={statusConfig[order.status as keyof typeof statusConfig].color}>
                {statusConfig[order.status as keyof typeof statusConfig].label}
              </Badge>
              <span className="text-2xl font-bold">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
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

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">{order.customer.name}</h4>
                    <p className="text-sm text-gray-600">{order.customer.email}</p>
                    <p className="text-sm text-gray-600">{order.customer.phone}</p>
                  </div>
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

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Payment Method</span>
                    <span className="text-sm font-medium">{order.paymentMethod.brand} ending in {order.paymentMethod.last4}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Payment Status</span>
                    <Badge className={order.paymentStatus === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                      {order.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Management */}
          <div className="space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
                <CardDescription>Update the order status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Current Status</label>
                  <Badge className={`mt-1 ${statusConfig[order.status as keyof typeof statusConfig].color}`}>
                    {statusConfig[order.status as keyof typeof statusConfig].label}
                  </Badge>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Update Status</label>
                  <Select
                    value={order.status}
                    onValueChange={handleStatusUpdate}
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => {
                        const Icon = option.icon
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center">
                              <Icon className="h-4 w-4 mr-2" />
                              {option.label}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {isUpdating && (
                  <div className="text-sm text-gray-600">
                    Updating status...
                  </div>
                )}
              </CardContent>
            </Card>

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

            {/* Tracking Information */}
            {order.trackingNumber && (
              <Card>
                <CardHeader>
                  <CardTitle>Tracking Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Tracking Number</label>
                      <p className="text-sm font-mono">{order.trackingNumber}</p>
                    </div>
                    {order.estimatedDelivery && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Estimated Delivery</label>
                        <p className="text-sm">{new Date(order.estimatedDelivery).toLocaleDateString()}</p>
                      </div>
                    )}
                    {order.actualDelivery && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Delivered On</label>
                        <p className="text-sm text-green-600">{new Date(order.actualDelivery).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Notes */}
            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{order.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button className="w-full">
                Send Update Email
              </Button>
              <Button variant="outline" className="w-full">
                Print Invoice
              </Button>
              <Button variant="outline" className="w-full">
                Generate Shipping Label
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



