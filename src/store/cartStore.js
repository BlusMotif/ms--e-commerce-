import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, quantity = 1, selectedSize = null) => {
        const items = get().items;
        const existingItemIndex = items.findIndex(
          item => item.id === product.id && item.selectedSize === selectedSize
        );

        if (existingItemIndex > -1) {
          const updatedItems = [...items];
          updatedItems[existingItemIndex].quantity += quantity;
          set({ items: updatedItems });
        } else {
          set({
            items: [...items, { ...product, quantity, selectedSize }]
          });
        }
      },

      removeItem: (productId, selectedSize = null) => {
        set({
          items: get().items.filter(
            item => !(item.id === productId && item.selectedSize === selectedSize)
          )
        });
      },

      updateQuantity: (productId, quantity, selectedSize = null) => {
        const items = get().items;
        const updatedItems = items.map(item =>
          item.id === productId && item.selectedSize === selectedSize
            ? { ...item, quantity }
            : item
        );
        set({ items: updatedItems });
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
