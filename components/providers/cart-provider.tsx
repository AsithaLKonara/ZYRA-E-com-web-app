"use client"

import { createContext, useContext, ReactNode } from "react"
import { useCartStore, CartItem } from "@/lib/stores/cart-store"
import { useWishlistStore } from "@/lib/stores/wishlist-store"
import { Product } from "@/lib/types/product"

interface CartContextType {
  // Cart
  cartItems: CartItem[]
  cartItemCount: number
  cartTotal: number
  isCartOpen: boolean
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateCartQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  
  // Wishlist
  wishlistItems: Product[]
  wishlistCount: number
  addToWishlist: (product: Product) => void
  removeFromWishlist: (productId: string) => void
  clearWishlist: () => void
  isInWishlist: (productId: string) => boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

interface CartProviderProps {
  children: ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const cartStore = useCartStore()
  const wishlistStore = useWishlistStore()

  const contextValue: CartContextType = {
    // Cart
    cartItems: cartStore.items,
    cartItemCount: cartStore.getItemCount(),
    cartTotal: cartStore.getTotalPrice(),
    isCartOpen: cartStore.isOpen,
    addToCart: cartStore.addItem,
    removeFromCart: cartStore.removeItem,
    updateCartQuantity: cartStore.updateQuantity,
    clearCart: cartStore.clearCart,
    toggleCart: cartStore.toggleCart,
    openCart: cartStore.openCart,
    closeCart: cartStore.closeCart,
    
    // Wishlist
    wishlistItems: wishlistStore.items,
    wishlistCount: wishlistStore.getItemCount(),
    addToWishlist: wishlistStore.addItem,
    removeFromWishlist: wishlistStore.removeItem,
    clearWishlist: wishlistStore.clearWishlist,
    isInWishlist: wishlistStore.isInWishlist,
  }

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  )
}

export function useCartContext() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCartContext must be used within a CartProvider")
  }
  return context
}
