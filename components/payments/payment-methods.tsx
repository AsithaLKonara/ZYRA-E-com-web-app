"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, Plus, Trash2, Edit, Check } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { clientLogger } from "@/lib/client-logger"

interface PaymentMethod {
  id: string
  type: "card"
  card: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  }
  isDefault: boolean
}

interface PaymentMethodsProps {
  className?: string
}

export function PaymentMethods({ className }: PaymentMethodsProps) {
  const { toast } = useToast()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/payments/methods")
      const data = await response.json()
      
      if (response.ok) {
        setPaymentMethods(data.paymentMethods || [])
      } else {
        throw new Error(data.error || "Failed to fetch payment methods")
      }
    } catch (error) {
      clientLogger.error("Error fetching payment methods", {}, error instanceof Error ? error : undefined)
      toast({
        title: "Error",
        description: "Failed to load payment methods",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPaymentMethod = async () => {
    try {
      setIsAdding(true)
      // In a real implementation, this would open Stripe's payment method setup
      // For now, we'll simulate adding a payment method
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Success",
        description: "Payment method added successfully"
      })
      
      setIsDialogOpen(false)
      fetchPaymentMethods()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add payment method",
        variant: "destructive"
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleSetDefault = async (methodId: string) => {
    try {
      const response = await fetch(`/api/payments/methods/${methodId}/default`, {
        method: "POST"
      })
      
      if (response.ok) {
        setPaymentMethods(prev => 
          prev.map(method => ({
            ...method,
            isDefault: method.id === methodId
          }))
        )
        toast({
          title: "Success",
          description: "Default payment method updated"
        })
      } else {
        throw new Error("Failed to update default payment method")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update default payment method",
        variant: "destructive"
      })
    }
  }

  const handleDeletePaymentMethod = async (methodId: string) => {
    if (!confirm("Are you sure you want to delete this payment method?")) {
      return
    }

    try {
      const response = await fetch(`/api/payments/methods/${methodId}`, {
        method: "DELETE"
      })
      
      if (response.ok) {
        setPaymentMethods(prev => prev.filter(method => method.id !== methodId))
        toast({
          title: "Success",
          description: "Payment method deleted successfully"
        })
      } else {
        throw new Error("Failed to delete payment method")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete payment method",
        variant: "destructive"
      })
    }
  }

  const getCardBrandIcon = (brand: string) => {
    const brandLower = brand.toLowerCase()
    if (brandLower.includes("visa")) return "💳"
    if (brandLower.includes("mastercard")) return "💳"
    if (brandLower.includes("amex")) return "💳"
    if (brandLower.includes("discover")) return "💳"
    return "💳"
  }

  const formatExpiryDate = (month: number, year: number) => {
    return `${month.toString().padStart(2, "0")}/${year.toString().slice(-2)}`
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </CardTitle>
          <CardDescription>
            Manage your saved payment methods
          </CardDescription>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Method
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
              <DialogDescription>
                Add a new payment method to your account
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  In a real implementation, this would integrate with Stripe's payment method setup.
                  For now, this is a demo interface.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={handleAddPaymentMethod} 
                disabled={isAdding}
                className="w-full"
              >
                {isAdding ? "Adding..." : "Add Payment Method"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Methods</h3>
            <p className="text-gray-600 mb-4">
              You haven't added any payment methods yet.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Payment Method
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">
                    {getCardBrandIcon(method.card.brand)}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {method.card.brand.toUpperCase()} •••• {method.card.last4}
                      </span>
                      {method.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Expires {formatExpiryDate(method.card.exp_month, method.card.exp_year)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!method.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(method.id)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Set Default
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePaymentMethod(method.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}