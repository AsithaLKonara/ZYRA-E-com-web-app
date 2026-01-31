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
import { AuthProvider } from "@/components/providers/auth-provider"
import { ErrorBoundary } from "@/components/error-boundary"
import { CartProvider } from "@/components/providers/cart-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: "ZYRA - Premium Women's Fashion | Elegant Clothing & Accessories",
  description: "Discover ZYRA's curated collection of premium women's fashion. From elegant dresses to everyday essentials, find your perfect style with quality clothing and accessories.",
  keywords: "women's fashion, women's clothing, dresses, tops, bottoms, fashion accessories, online boutique, premium fashion",
  authors: [{ name: "ZYRA Fashion Team" }],
  creator: "ZYRA Fashion",
  publisher: "ZYRA Fashion",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://zyra-fashion.com",
    siteName: "ZYRA Fashion",
    title: "ZYRA - Premium Women's Fashion",
    description: "Curated collection of premium women's fashion",
    images: [
      {
        url: "/cover.png",
        width: 1200,
        height: 630,
        alt: "ZYRA Fashion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZYRA - Premium Women's Fashion",
    description: "Curated collection of premium women's fashion",
    images: ["/cover.png"],
    creator: "@zyra_fashion",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  generator: 'Next.js'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
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
        </AuthProvider>
      </body>
    </html>
  )
}
