'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useToast } from './use-toast';

export interface WishlistItem {
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
  addedAt: Date;
}

interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  
  // Actions
  addItem: (productId: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearWishlist: () => void;
  isInWishlist: (productId: string) => boolean;
  
  // Computed values
  itemCount: number;
}

const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      addItem: async (productId: string) => {
        set({ isLoading: true });
        
        try {
          // Check if item already exists
          const existingItem = get().items.find(
            (item) => item.productId === productId
          );
          
          if (existingItem) {
            set({ isLoading: false });
            return;
          }
          
          // Fetch product details from API
          const response = await fetch(`/api/products/${productId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch product details');
          }
          
          const product = await response.json();
          
          const newItem: WishlistItem = {
            id: `wishlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            productId,
            product,
            addedAt: new Date(),
          };
          
          set((state) => ({
            items: [...state.items, newItem],
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      removeItem: async (productId: string) => {
        set({ isLoading: true });
        
        try {
          // Optional: Remove from server-side wishlist
          // await fetch(`/api/wishlist/${productId}`, { method: 'DELETE' });
          
          set((state) => ({
            items: state.items.filter((item) => item.productId !== productId),
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      clearWishlist: () => {
        set({ items: [] });
      },

      isInWishlist: (productId: string) => {
        return get().items.some((item) => item.productId === productId);
      },

      // Computed values
      get itemCount() {
        return get().items.length;
      },
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// Export a wrapper that adds the addToWishlist and removeFromWishlist aliases
export const useWishlist = () => {
  const store = useWishlistStore();
  return {
    ...store,
    addToWishlist: store.addItem, // Alias for backward compatibility
    removeFromWishlist: store.removeItem, // Alias for backward compatibility
  };
};

// Custom hook for easier usage
export const useWishlistActions = () => {
  const { addItem, removeItem, clearWishlist, isInWishlist } = useWishlistStore();
  const { toast } = useToast();

  const handleAddItem = async (productId: string) => {
    try {
      await addItem(productId);
      toast({
        title: 'Added to Wishlist',
        description: 'Item has been added to your wishlist',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add item to wishlist',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      await removeItem(productId);
      toast({
        title: 'Removed from Wishlist',
        description: 'Item has been removed from your wishlist',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove item from wishlist',
        variant: 'destructive',
      });
    }
  };

  const handleToggleItem = async (productId: string) => {
    if (isInWishlist(productId)) {
      await handleRemoveItem(productId);
    } else {
      await handleAddItem(productId);
    }
  };

  const handleClearWishlist = () => {
    clearWishlist();
    toast({
      title: 'Wishlist Cleared',
      description: 'All items have been removed from your wishlist',
    });
  };

  return {
    addItem: handleAddItem,
    removeItem: handleRemoveItem,
    toggleItem: handleToggleItem,
    clearWishlist: handleClearWishlist,
    isInWishlist,
  };
};

export default useWishlist;




