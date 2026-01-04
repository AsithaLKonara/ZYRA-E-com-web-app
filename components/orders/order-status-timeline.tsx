"use client"

import { CheckCircle, Clock, Package, Truck, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface OrderStatusTimelineProps {
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  className?: string
}

const statusSteps = [
  {
    key: "pending",
    label: "Order Placed",
    description: "Your order has been received",
    icon: CheckCircle
  },
  {
    key: "processing", 
    label: "Processing",
    description: "We're preparing your order",
    icon: Package
  },
  {
    key: "shipped",
    label: "Shipped",
    description: "Your order is on the way",
    icon: Truck
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "Your order has arrived",
    icon: Home
  }
]

export function OrderStatusTimeline({ status, className }: OrderStatusTimelineProps) {
  const getStatusIndex = (status: string) => {
    switch (status) {
      case "pending": return 0
      case "processing": return 1
      case "shipped": return 2
      case "delivered": return 3
      case "cancelled": return -1
      default: return 0
    }
  }

  const currentIndex = getStatusIndex(status)
  const isCancelled = status === "cancelled"

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {statusSteps.map((step, index) => {
          const Icon = step.icon
          const isCompleted = index <= currentIndex && !isCancelled
          const isCurrent = index === currentIndex && !isCancelled
          const isUpcoming = index > currentIndex && !isCancelled

          return (
            <div key={step.key} className="flex flex-col items-center relative">
              {/* Connector Line */}
              {index < statusSteps.length - 1 && (
                <div 
                  className={cn(
                    "absolute top-6 left-1/2 w-full h-0.5 -translate-y-1/2",
                    isCompleted ? "bg-green-500" : "bg-gray-200"
                  )}
                />
              )}

              {/* Icon */}
              <div
                className={cn(
                  "relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors",
                  isCompleted && "bg-green-500 border-green-500 text-white",
                  isCurrent && "bg-blue-500 border-blue-500 text-white",
                  isUpcoming && "bg-gray-100 border-gray-300 text-gray-400",
                  isCancelled && "bg-red-100 border-red-300 text-red-400"
                )}
              >
                <Icon className="h-6 w-6" />
              </div>

              {/* Label */}
              <div className="mt-2 text-center">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isCompleted && "text-green-600",
                    isCurrent && "text-blue-600", 
                    isUpcoming && "text-gray-500",
                    isCancelled && "text-red-500"
                  )}
                >
                  {step.label}
                </p>
                <p
                  className={cn(
                    "text-xs mt-1",
                    isCompleted && "text-green-500",
                    isCurrent && "text-blue-500",
                    isUpcoming && "text-gray-400",
                    isCancelled && "text-red-400"
                  )}
                >
                  {step.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {isCancelled && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium">
            <Clock className="h-4 w-4 mr-1" />
            Order Cancelled
          </div>
        </div>
      )}
    </div>
  )
}