"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const isLoading = status === "loading"
  const isAuthenticated = !!session?.user

  useEffect(() => {
    if (status === "unauthenticated") {
      // Optionally redirect to signin if needed
      // router.push("/auth/signin")
    }
  }, [status, router])

  return {
    user: session?.user,
    isAuthenticated,
    isLoading,
    session
  }
}

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/signin")
    }
  }, [isAuthenticated, isLoading, router])

  return { isAuthenticated, isLoading }
}



