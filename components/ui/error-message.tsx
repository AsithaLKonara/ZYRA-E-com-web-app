"use client"

import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ErrorMessageProps {
  message?: string
  className?: string
}

export function ErrorMessage({ message = "An error occurred", className }: ErrorMessageProps) {
  return (
    <Alert variant="destructive" className={className} data-testid="error-message">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}



