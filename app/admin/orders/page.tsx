"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Package,
  Calendar,
  User,
  DollarSign
} from "lucide-react"
import Link from "next/link"
import { UserRole } from "@prisma/client"

// Mock order data
const mockOrders = [
  {
    id: "ORD-001",
    orderNumber: "NEOSHOP-2024-001",
    customer: {
      id: "1",
      name: "John Doe",
      email: "john@example.com"
    },
    date: "2024-01-15",
    status: "delivered",
    total: 299.99,
    items: [
      {
        id: "1",
        name: "Premium Wireless Headphones",
        quantity: 1,
        price: 299.99
      }
    ],
    paymentStatus: "paid",
    shippingAddress: {
      name: "John Doe",
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001"
    }
  },
  {
    id: "ORD-002",
    orderNumber: "NEOSHOP-2024-002",
    customer: {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com"
    },
    date: "2024-01-14",
    status: "shipped",
    total: 149.99,
    items: [
      {
        id: "3",
        name: "Organic Cotton T-Shirt",
        quantity: 2,
        price: 29.99
      }
    ],
    paymentStatus: "paid",
    shippingAddress: {
      name: "Jane Smith",
      street: "456 Oak Ave",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90210"
    }
  },
  {
    id: "ORD-003",
    orderNumber: "NEOSHOP-2024-003",
    customer: {
      id: "3",
      name: "Bob Johnson",
      email: "bob@example.com"
    },
    date: "2024-01-13",
    status: "processing",
    total: 89.99,
    items: [
      {
        id: "5",
        name: "Bluetooth Speaker",
        quantity: 1,
        price: 89.99
      }
    ],
    paymentStatus: "pending",
    shippingAddress: {
      name: "Bob Johnson",
      street: "789 Pine St",
      city: "Chicago",
      state: "IL",
      zipCode: "60601"
    }
  }
]

const statusConfig = {
  processing: { label: "Processing", color: "bg-yellow-100 text-yellow-800" },
  shipped: { label: "Shipped", color: "bg-blue-100 text-blue-800" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
  returned: { label: "Returned", color: "bg-gray-100 text-gray-800" }
}

const paymentStatusConfig = {
  paid: { label: "Paid", color: "bg-green-100 text-green-800" },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  failed: { label: "Failed", color: "bg-red-100 text-red-800" },
  refunded: { label: "Refunded", color: "bg-gray-100 text-gray-800" }
}

export default function AdminOrdersPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [orders, setOrders] = useState(mockOrders)
  const [filteredOrders, setFilteredOrders] = useState(mockOrders)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  useEffect(() => {
    let filtered = orders

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    // Filter by payment status
    if (paymentStatusFilter !== "all") {
      filtered = filtered.filter(order => order.paymentStatus === paymentStatusFilter)
    }

    // Filter by date
    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()
      
      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
      }
      
      filtered = filtered.filter(order => new Date(order.date) >= filterDate)
    }

    setFilteredOrders(filtered)
  }, [orders, searchQuery, statusFilter, paymentStatusFilter, dateFilter])

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      )
    )
  }

  if (isLoading) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-2">Manage and track customer orders</p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search orders, customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Order Status" />
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
                <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Payment Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Orders ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Order</th>
                    <th className="text-left py-3 px-4">Customer</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Payment</th>
                    <th className="text-left py-3 px-4">Total</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium">{order.orderNumber}</p>
                          <p className="text-sm text-gray-500">{order.items.length} item(s)</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium">{order.customer.name}</p>
                          <p className="text-sm text-gray-500">{order.customer.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm">
                            {new Date(order.date).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={statusConfig[order.status as keyof typeof statusConfig].color}>
                          {statusConfig[order.status as keyof typeof statusConfig].label}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={paymentStatusConfig[order.paymentStatus as keyof typeof paymentStatusConfig].color}>
                          {paymentStatusConfig[order.paymentStatus as keyof typeof paymentStatusConfig].label}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="font-medium">${order.total.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/orders/${order.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/orders/${order.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-600">
                  {searchQuery || statusFilter !== "all" || paymentStatusFilter !== "all" || dateFilter !== "all"
                    ? "Try adjusting your filters to see more orders."
                    : "No orders have been placed yet."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



