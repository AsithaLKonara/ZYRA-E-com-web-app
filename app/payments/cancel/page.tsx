"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { XCircle, ArrowLeft, RefreshCw, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { PaymentStatus } from "@/components/payments/payment-status"

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Payment Status */}
        <PaymentStatus
          status="cancelled"
          className="mb-8"
        />

        {/* Cancellation Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Payment Cancelled
            </CardTitle>
            <CardDescription>
              Your payment was cancelled and no charges were made
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Your payment was cancelled before completion. No money has been charged to your account.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Common reasons for cancellation:</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• You clicked the back button during payment</li>
                <li>• The payment session expired</li>
                <li>• You decided not to complete the purchase</li>
                <li>• There was a technical issue</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
            <CardDescription>
              You can continue shopping or try again
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <ShoppingCart className="h-5 w-5 text-blue-500 mt-0.5" />
                </div>
                <div>
                  <p className="font-medium">Your cart is still saved</p>
                  <p className="text-sm text-gray-600">
                    All items in your cart are still available for checkout
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <RefreshCw className="h-5 w-5 text-green-500 mt-0.5" />
                </div>
                <div>
                  <p className="font-medium">Try again anytime</p>
                  <p className="text-sm text-gray-600">
                    You can complete your purchase whenever you're ready
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild className="flex-1">
            <Link href="/checkout">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="flex-1">
            <Link href="/cart">
              <ShoppingCart className="h-4 w-4 mr-2" />
              View Cart
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="flex-1">
            <Link href="/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Link>
          </Button>
        </div>

        {/* Support Information */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Need help? Contact our support team at{" "}
            <a href="mailto:support@zyra.com" className="text-primary hover:underline">
              support@zyra.com
            </a>
          </p>
          <p className="mt-2">
            Or call us at{" "}
            <a href="tel:+1-800-NEOSHOP" className="text-primary hover:underline">
              1-800-NEOSHOP
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}