"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Package, Truck, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckoutSummaryProps {
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
    image?: string
  }>
  subtotal: number
  shipping: number
  tax: number
  total: number
  onProceedToPayment?: () => void
  isProcessing?: boolean
  className?: string
}

export function CheckoutSummary({
  items,
  subtotal,
  shipping,
  tax,
  total,
  onProceedToPayment,
  isProcessing = false,
  className
}: CheckoutSummaryProps) {
  const formatPrice = (price: number) => `$${price.toFixed(2)}`

  return (
    <div className={cn("space-y-6", className)}>
      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Order Summary
          </CardTitle>
          <CardDescription>
            Review your items and total
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Items */}
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center space-x-3">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-md"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Qty: {item.quantity}
                  </p>
                </div>
                <div className="text-sm font-medium">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
          
          <Separator />
          
          {/* Pricing Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span>
                {shipping === 0 ? "Free" : formatPrice(shipping)}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>{formatPrice(tax)}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Method</span>
              <Badge variant="outline">Standard Shipping</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Delivery</span>
              <span className="text-sm text-gray-600">3-5 business days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Cost</span>
              <span className="text-sm">
                {shipping === 0 ? "Free" : formatPrice(shipping)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Method</span>
              <span className="text-sm text-gray-600">Credit Card</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Security</span>
              <Badge variant="secondary" className="text-xs">
                SSL Encrypted
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proceed Button */}
      {onProceedToPayment && (
        <Button
          onClick={onProceedToPayment}
          disabled={isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Package className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Proceed to Payment
            </>
          )}
        </Button>
      )}

      {/* Security Notice */}
      <div className="text-center text-xs text-gray-500">
        <p>🔒 Your payment information is secure and encrypted</p>
        <p>We never store your credit card details</p>
      </div>
    </div>
  )
}