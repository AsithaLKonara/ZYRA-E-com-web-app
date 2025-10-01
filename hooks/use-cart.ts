'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useToast } from './use-toast';

interface CartItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    inStock: boolean;
    stockQuantity: number;
  };
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
  
  // Actions
  addItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  
  // Computed values
  itemCount: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

const TAX_RATE = 0.08; // 8% tax rate
const FREE_SHIPPING_THRESHOLD = 50; // Free shipping over $50
const SHIPPING_COST = 9.99; // Standard shipping cost

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      isLoading: false,

      addItem: async (productId: string, quantity: number) => {
        set({ isLoading: true });
        
        try {
          // Fetch product details from API
          const response = await fetch(`/api/products/${productId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch product details');
          }
          
          const product = await response.json();
          
          set((state) => {
            const existingItem = state.items.find(
              (item) => item.productId === productId
            );
            
            if (existingItem) {
              // Update existing item quantity
              const newQuantity = existingItem.quantity + quantity;
              if (newQuantity > product.stockQuantity) {
                throw new Error('Insufficient stock');
              }
              
              return {
                items: state.items.map((item) =>
                  item.productId === productId
                    ? { ...item, quantity: newQuantity }
                    : item
                ),
                isLoading: false,
              };
            } else {
              // Add new item
              if (quantity > product.stockQuantity) {
                throw new Error('Insufficient stock');
              }
              
              const newItem: CartItem = {
                id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                productId,
                product,
                quantity,
              };
              
              return {
                items: [...state.items, newItem],
                isLoading: false,
              };
            }
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      removeItem: async (itemId: string) => {
        set({ isLoading: true });
        
        try {
          // Optional: Remove from server-side cart
          // await fetch(`/api/cart/${itemId}`, { method: 'DELETE' });
          
          set((state) => ({
            items: state.items.filter((item) => item.id !== itemId),
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      updateQuantity: async (itemId: string, quantity: number) => {
        if (quantity < 1) return;
        
        set({ isLoading: true });
        
        try {
          // Optional: Update server-side cart
          // await fetch(`/api/cart/${itemId}`, {
          //   method: 'PUT',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify({ quantity }),
          // });
          
          set((state) => ({
            items: state.items.map((item) =>
              item.id === itemId ? { ...item, quantity } : item
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      clearCart: () => {
        set({ items: [], isOpen: false });
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      openCart: () => {
        set({ isOpen: true });
      },

      closeCart: () => {
        set({ isOpen: false });
      },

      // Computed values
      get itemCount() {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      get subtotal() {
        return get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },

      get tax() {
        return get().subtotal * TAX_RATE;
      },

      get shipping() {
        return get().subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
      },

      get total() {
        return get().subtotal + get().tax + get().shipping;
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// Custom hook for easier usage
export const useCartActions = () => {
  const { addItem, removeItem, updateQuantity, clearCart, toggleCart, openCart, closeCart } = useCart();
  const { toast } = useToast();

  const handleAddItem = async (productId: string, quantity: number = 1) => {
    try {
      await addItem(productId, quantity);
      toast({
        title: 'Added to Cart',
        description: 'Item has been added to your cart',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add item to cart',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(itemId);
      toast({
        title: 'Item Removed',
        description: 'Item has been removed from your cart',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove item',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    try {
      await updateQuantity(itemId, quantity);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update quantity',
        variant: 'destructive',
      });
    }
  };

  const handleClearCart = () => {
    clearCart();
    toast({
      title: 'Cart Cleared',
      description: 'All items have been removed from your cart',
    });
  };

  return {
    addItem: handleAddItem,
    removeItem: handleRemoveItem,
    updateQuantity: handleUpdateQuantity,
    clearCart: handleClearCart,
    toggleCart,
    openCart,
    closeCart,
  };
};

export default useCart;




