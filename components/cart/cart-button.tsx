'use client'

import { useState } from 'react'
import { useCartStore } from '@/lib/cart-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart } from 'lucide-react'

interface CartButtonProps {
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export function CartButton({ className, variant = 'outline', size = 'default' }: CartButtonProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { getTotalItems } = useCartStore()

  const totalItems = getTotalItems()

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`relative ${className}`}
        onClick={() => setIsSidebarOpen(true)}
      >
        <ShoppingCart className="h-4 w-4" />
        {totalItems > 0 && (
          <Badge
            variant="destructive"
            className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-xs"
          >
            {totalItems}
          </Badge>
        )}
      </Button>

      {/* Cart Sidebar would be imported and used here */}
      {/* <CartSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} /> */}
    </>
  )
}




