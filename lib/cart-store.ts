import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product } from '@/types'

// Cart store interface
interface CartStore {
  items: CartItem[]
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  getItemQuantity: (productId: string) => number
  isInCart: (productId: string) => boolean
}

// Cart store implementation
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product, quantity: number = 1) => {
        set((state) => {
          const existingItem = state.items.find(item => item.productId === product.id)
          
          if (existingItem) {
            // Update existing item quantity
            return {
              items: state.items.map(item =>
                item.productId === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            }
          } else {
            // Add new item
            const newItem: CartItem = {
              id: `${product.id}-${Date.now()}`,
              productId: product.id,
              quantity,
              product,
              createdAt: new Date(),
              updatedAt: new Date(),
              userId: '', // This would be set by the actual user context
              user: {} as any, // This would be set by the actual user context
            }
            
            return {
              items: [...state.items, newItem],
            }
          }
        })
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter(item => item.productId !== productId),
        }))
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }

        set((state) => ({
          items: state.items.map(item =>
            item.productId === productId
              ? { ...item, quantity, updatedAt: new Date() }
              : item
          ),
        }))
      },

      clearCart: () => {
        set({ items: [] })
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          return total + (item.product.price * item.quantity)
        }, 0)
      },

      getItemQuantity: (productId: string) => {
        const item = get().items.find(item => item.productId === productId)
        return item ? item.quantity : 0
      },

      isInCart: (productId: string) => {
        return get().items.some(item => item.productId === productId)
      },
    }),
    {
      name: 'cart-storage',
      version: 1,
    }
  )
)

