'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { logger } from '@/lib/logger'

// Auth hook interface
interface UseAuthReturn {
  user: any
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isCustomer: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: { name?: string; avatar?: string }) => Promise<void>
}

// Custom auth hook
export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession()
  const router = useRouter()

  const isLoading = status === 'loading'
  const isAuthenticated = !!session?.user
  const isAdmin = session?.user?.role === 'ADMIN'
  const isCustomer = session?.user?.role === 'CUSTOMER'

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signin/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          redirect: false,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Sign in failed')
      }

      // Refresh the session
      window.location.reload()
    } catch (error) {
      logger.error('Sign in error:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
      })
      
      router.push('/')
      window.location.reload()
    } catch (error) {
      logger.error('Sign out error:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Update profile function
  const updateProfile = async (data: { name?: string; avatar?: string }) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Profile update failed')
      }

      // Refresh the session
      window.location.reload()
    } catch (error) {
      logger.error('Profile update error:', {}, error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  return {
    user: session?.user,
    isLoading,
    isAuthenticated,
    isAdmin,
    isCustomer,
    signIn,
    signOut,
    updateProfile,
  }
}

// Protected route hook
export function useProtectedRoute(redirectTo: string = '/auth/signin') {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  return { isAuthenticated, isLoading }
}

// Admin route hook
export function useAdminRoute(redirectTo: string = '/') {
  const { isAdmin, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push(redirectTo)
    }
  }, [isAdmin, isLoading, router, redirectTo])

  return { isAdmin, isLoading }
}

// Auth status hook
export function useAuthStatus() {
  const { data: session, status } = useSession()

  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: !!session?.user,
    isAdmin: session?.user?.role === 'ADMIN',
    isCustomer: session?.user?.role === 'CUSTOMER',
    status,
  }
}




