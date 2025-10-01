"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { Product } from "@/lib/types/product"

interface WishlistStore {
  items: Product[]
  
  // Actions
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  clearWishlist: () => void
  
  // Getters
  getItemCount: () => number
  isInWishlist: (productId: string) => boolean
  getItem: (productId: string) => Product | undefined
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product) => {
        set((state) => {
          if (state.items.some(item => item.id === product.id)) {
            return state // Item already in wishlist
          }
          return {
            items: [...state.items, product]
          }
        })
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== productId)
        }))
      },

      clearWishlist: () => {
        set({ items: [] })
      },

      getItemCount: () => {
        return get().items.length
      },

      isInWishlist: (productId: string) => {
        return get().items.some(item => item.id === productId)
      },

      getItem: (productId: string) => {
        return get().items.find(item => item.id === productId)
      }
    }),
    {
      name: "wishlist-storage",
      partialize: (state) => ({ items: state.items })
    }
  )
)



