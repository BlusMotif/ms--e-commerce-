import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],

      // Add item to wishlist
      addToWishlist: (product) => {
        const { items } = get();
        
        // Check if item already exists
        const existingItem = items.find(item => item.id === product.id);
        
        if (existingItem) {
          toast.error('Already in wishlist');
          return;
        }

        set({
          items: [...items, {
            id: product.id,
            name: product.name,
            price: product.price,
            salePrice: product.salePrice,
            image: product.images?.[0] || product.image,
            stock: product.stock,
            categoryId: product.categoryId,
            addedAt: new Date().toISOString(),
          }],
        });

        toast.success('Added to wishlist!');
      },

      // Remove item from wishlist
      removeFromWishlist: (productId) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== productId),
        }));
        toast.success('Removed from wishlist');
      },

      // Toggle item in wishlist
      toggleWishlist: (product) => {
        const { items, addToWishlist, removeFromWishlist } = get();
        const existingItem = items.find(item => item.id === product.id);
        
        if (existingItem) {
          removeFromWishlist(product.id);
        } else {
          addToWishlist(product);
        }
      },

      // Check if item is in wishlist
      isInWishlist: (productId) => {
        const { items } = get();
        return items.some(item => item.id === productId);
      },

      // Clear entire wishlist
      clearWishlist: () => {
        set({ items: [] });
        toast.success('Wishlist cleared');
      },

      // Get wishlist count
      getWishlistCount: () => {
        return get().items.length;
      },
    }),
    {
      name: 'wishlist-storage',
    }
  )
);
