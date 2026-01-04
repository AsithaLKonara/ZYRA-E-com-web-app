'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { logger } from '@/lib/logger'

interface ProtectedRouteProps {
  children: ReactNode
  requireAdmin?: boolean
  redirectTo?: string
  fallback?: ReactNode
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  redirectTo = '/auth/signin',
  fallback = null,
}: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        logger.warn('Unauthenticated user attempted to access protected route')
        router.push(redirectTo)
        return
      }

      if (requireAdmin && !isAdmin) {
        logger.warn('Non-admin user attempted to access admin route')
        router.push('/')
        return
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, requireAdmin, redirectTo, router])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Show fallback if not authenticated
  if (!isAuthenticated) {
    return fallback
  }

  // Show fallback if admin required but user is not admin
  if (requireAdmin && !isAdmin) {
    return fallback
  }

  return <>{children}</>
}




