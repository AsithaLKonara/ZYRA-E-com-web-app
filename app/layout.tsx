import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { LoadingProvider } from "@/components/providers/loading-provider"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"
import { HeaderSkeleton } from "@/components/ui/loading-skeleton"
import { InstallPrompt } from "@/components/pwa/install-prompt"
import { OfflineIndicator } from "@/components/pwa/offline-indicator"
import { SessionProvider } from "next-auth/react"
import { ErrorBoundary } from "@/components/error-boundary"
import { CartProvider } from "@/components/providers/cart-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "NEOSHOP ULTRA - Smart E-Commerce Platform",
  description: "The most customizable and scalable e-commerce platform",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <ErrorBoundary>
              <CartProvider>
                <LoadingProvider>
                  <Suspense fallback={<HeaderSkeleton />}>{children}</Suspense>
                  <Toaster />
                  <InstallPrompt />
                  <OfflineIndicator />
                </LoadingProvider>
              </CartProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
