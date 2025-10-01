"use client"

import { useState } from "react"
import Link from "next/link"
import { ShoppingCart, User, Menu, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { SmartSearch } from "@/components/features/smart-search"
import { NotificationCenter } from "@/components/features/notification-center"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [cartCount] = useState(3) // This would come from global state

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3">
          <img src="/logo.png" alt="ZYRA" className="h-10 w-auto" />
          <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            ZYRA
          </span>
        </Link>

        {/* Smart Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <SmartSearch />
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <ThemeToggle />

          {/* Notifications */}
          <NotificationCenter />

          {/* Wishlist */}
          <Button variant="ghost" size="icon" className="relative">
            <Heart className="h-5 w-5" />
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">2</Badge>
          </Button>

          {/* Cart */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            aria-label="Shopping cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">{cartCount}</Badge>
            )}
          </Button>

          {/* User Account */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <User className="h-5 w-5" />
            </Button>
            
            {/* User Menu Dropdown */}
            {isMenuOpen && (
              <div 
                className="absolute right-0 top-full mt-2 w-48 bg-background border rounded-md shadow-lg z-50"
                data-testid="user-menu"
              >
                <div className="py-1">
                  <a href="/profile" className="block px-4 py-2 text-sm hover:bg-muted">Profile</a>
                  <a href="/orders" className="block px-4 py-2 text-sm hover:bg-muted">Orders</a>
                  <a href="/wishlist" className="block px-4 py-2 text-sm hover:bg-muted">Wishlist</a>
                  <hr className="my-1" />
                  <a href="/auth/signin" className="block px-4 py-2 text-sm hover:bg-muted">Sign In</a>
                  <a href="/auth/signup" className="block px-4 py-2 text-sm hover:bg-muted">Sign Up</a>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            data-testid="mobile-menu-button"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden border-t p-4">
        <SmartSearch />
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div 
          className="md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          data-testid="mobile-menu"
        >
          <div className="container py-4 space-y-2">
            <Link href="/" className="block py-2 text-sm font-medium transition-colors hover:text-primary">
              Home
            </Link>
            <Link href="/products" className="block py-2 text-sm font-medium transition-colors hover:text-primary">
              Products
            </Link>
            <Link href="/categories" className="block py-2 text-sm font-medium transition-colors hover:text-primary">
              Categories
            </Link>
            <Link href="/about" className="block py-2 text-sm font-medium transition-colors hover:text-primary">
              About
            </Link>
            <Link href="/contact" className="block py-2 text-sm font-medium transition-colors hover:text-primary">
              Contact
            </Link>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="hidden md:flex border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-12 items-center space-x-8">
          <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
            Home
          </Link>
          <Link href="/products" className="text-sm font-medium transition-colors hover:text-primary">
            Products
          </Link>
          <Link href="/categories" className="text-sm font-medium transition-colors hover:text-primary">
            Categories
          </Link>
          <Link href="/about" className="text-sm font-medium transition-colors hover:text-primary">
            About
          </Link>
          <Link href="/contact" className="text-sm font-medium transition-colors hover:text-primary">
            Contact
          </Link>
        </div>
      </nav>
    </header>
  )
}
