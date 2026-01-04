"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaymentStatusProps {
  status: "pending" | "processing" | "succeeded" | "failed" | "cancelled"
  amount?: number
  currency?: string
  onRetry?: () => void
  className?: string
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: "Pending",
    description: "Your payment is being processed",
    variant: "secondary" as const,
    color: "text-yellow-600"
  },
  processing: {
    icon: RefreshCw,
    label: "Processing",
    description: "Your payment is being verified",
    variant: "secondary" as const,
    color: "text-blue-600"
  },
  succeeded: {
    icon: CheckCircle,
    label: "Success",
    description: "Your payment was successful",
    variant: "default" as const,
    color: "text-green-600"
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    description: "Your payment could not be processed",
    variant: "destructive" as const,
    color: "text-red-600"
  },
  cancelled: {
    icon: AlertCircle,
    label: "Cancelled",
    description: "Your payment was cancelled",
    variant: "outline" as const,
    color: "text-gray-600"
  }
}

export function PaymentStatus({ 
  status, 
  amount, 
  currency = "USD", 
  onRetry, 
  className 
}: PaymentStatusProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <Icon className={cn("h-12 w-12 mx-auto", config.color)} />
        </div>
        <CardTitle className="text-2xl">{config.label}</CardTitle>
        <CardDescription className="text-lg">
          {config.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="text-center space-y-4">
        {amount && (
          <div className="text-3xl font-bold text-gray-900">
            {currency} ${amount.toFixed(2)}
          </div>
        )}
        
        <Badge variant={config.variant} className="text-sm">
          {config.label}
        </Badge>
        
        {status === "failed" && onRetry && (
          <Button onClick={onRetry} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
        
        {status === "succeeded" && (
          <div className="text-sm text-gray-600">
            <p>You will receive a confirmation email shortly.</p>
            <p>Your order is being prepared for shipment.</p>
          </div>
        )}
        
        {status === "pending" && (
          <div className="text-sm text-gray-600">
            <p>Please wait while we process your payment.</p>
            <p>This may take a few moments.</p>
          </div>
        )}
        
        {status === "processing" && (
          <div className="text-sm text-gray-600">
            <p>We're verifying your payment details.</p>
            <p>Please don't close this page.</p>
          </div>
        )}
        
        {status === "cancelled" && (
          <div className="text-sm text-gray-600">
            <p>Your payment was cancelled.</p>
            <p>No charges have been made to your account.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}