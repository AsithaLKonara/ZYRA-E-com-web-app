"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Package, ArrowRight, Download } from "lucide-react"
import Link from "next/link"
import { PaymentStatus } from "@/components/payments/payment-status"

interface PaymentSuccessData {
  paymentIntentId: string
  amount: number
  currency: string
  status: string
  orderId?: string
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const [paymentData, setPaymentData] = useState<PaymentSuccessData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const paymentIntentId = searchParams.get("payment_intent")
    const amount = searchParams.get("amount")
    const currency = searchParams.get("currency")
    const status = searchParams.get("status")

    if (paymentIntentId && amount && currency && status) {
      setPaymentData({
        paymentIntentId,
        amount: parseFloat(amount) / 100, // Convert from cents
        currency: currency.toUpperCase(),
        status: status,
        orderId: searchParams.get("order_id") || undefined
      })
    }
    
    setIsLoading(false)
  }, [searchParams])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
    )
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Payment Information Not Found</CardTitle>
            <CardDescription>
              We couldn't find the payment information. Please contact support if you need assistance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Payment Status */}
        <PaymentStatus
          status={paymentData.status as any}
          amount={paymentData.amount}
          currency={paymentData.currency}
          className="mb-8"
        />

        {/* Order Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Information
            </CardTitle>
            <CardDescription>
              Your order details and next steps
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Payment ID</p>
                <p className="text-sm font-mono">{paymentData.paymentIntentId}</p>
              </div>
              
              {paymentData.orderId && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Order ID</p>
                  <p className="text-sm font-mono">{paymentData.orderId}</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Amount</p>
                <p className="text-lg font-semibold">
                  {paymentData.currency} ${paymentData.amount.toFixed(2)}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <Badge variant="default" className="text-sm">
                  {paymentData.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
            <CardDescription>
              Here's what happens after your successful payment
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                </div>
                <div>
                  <p className="font-medium">Payment Confirmed</p>
                  <p className="text-sm text-gray-600">
                    Your payment has been successfully processed
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <Package className="h-5 w-5 text-blue-500 mt-0.5" />
                </div>
                <div>
                  <p className="font-medium">Order Processing</p>
                  <p className="text-sm text-gray-600">
                    We're preparing your items for shipment
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                </div>
                <div>
                  <p className="font-medium">Confirmation Email</p>
                  <p className="text-sm text-gray-600">
                    You'll receive an email with order details shortly
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild className="flex-1">
            <Link href="/orders">
              <Package className="h-4 w-4 mr-2" />
              View Orders
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="flex-1">
            <Link href="/products">
              <ArrowRight className="h-4 w-4 mr-2" />
              Continue Shopping
            </Link>
          </Button>
          
          <Button variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
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
        </div>
      </div>
    </div>
  )
}