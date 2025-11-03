'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { clientLogger } from '@/lib/client-logger';
import { 
  CheckCircle, 
  ArrowRight, 
  Download, 
  Mail, 
  Truck,
  Home,
  ShoppingBag
} from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    city: string;
    state: string;
    zipCode: string;
  };
  orderItems: Array<{
    id: string;
    product: {
      name: string;
      imageUrl: string;
    };
    quantity: number;
    price: number;
  }>;
}

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const orderId = searchParams.get('orderId');
  const paymentId = searchParams.get('paymentId');

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    } else {
      setIsLoading(false);
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const orderData = await response.json();
        setOrder(orderData);
      }
    } catch (error) {
      clientLogger.error('Failed to fetch order', {}, error instanceof Error ? error : undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <CheckCircle className="h-16 w-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Order not found
          </h1>
          <p className="text-gray-600 mb-4">
            We couldn't find the order you're looking for
          </p>
          <Button onClick={() => router.push('/')}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Order Confirmed!
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Thank you for your purchase. Your order has been successfully placed.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Order #{order.orderNumber}
              </Badge>
              <Badge className={`text-lg px-4 py-2 ${getStatusColor(order.status)}`}>
                {order.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Details */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number</span>
                    <span className="font-medium">{order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date</span>
                    <span className="font-medium">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="font-semibold text-lg">{formatPrice(order.totalAmount)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <p className="font-medium">
                      {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                    </p>
                    <p>{order.shippingAddress.address1}</p>
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Items */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                          {item.product.imageUrl ? (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-100">
                              <span className="text-xs text-gray-400">No Image</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{item.product.name}</h4>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">
                        {formatPrice(order.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium">
                        {formatPrice(order.totalAmount - order.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>{formatPrice(order.totalAmount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Next Steps */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Confirmation Email</h3>
                  <p className="text-sm text-gray-600">
                    You'll receive an order confirmation email shortly with all the details.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                    <Truck className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Shipping Updates</h3>
                  <p className="text-sm text-gray-600">
                    We'll send you tracking information once your order ships.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mb-4">
                    <Download className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Order Management</h3>
                  <p className="text-sm text-gray-600">
                    Track your order and manage your account from your dashboard.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button
              size="lg"
              onClick={() => router.push('/orders')}
              className="flex items-center gap-2"
            >
              <ShoppingBag className="h-5 w-5" />
              View All Orders
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/products')}
              className="flex items-center gap-2"
            >
              Continue Shopping
              <ArrowRight className="h-5 w-5" />
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/')}
              className="flex items-center gap-2"
            >
              <Home className="h-5 w-5" />
              Go Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}




