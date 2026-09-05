import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  // Computed
  itemCount: () => number;
  subtotal: () => number;
  // Actions
  setItems: (items: CartItem[]) => void;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      setItems: (items) => set({ items }),

      addItem: (newItem) => {
        const newId = newItem.product._id || (newItem.product as any).id;
        const existing = get().items.find(
          (i) => (i.product._id || (i.product as any).id) === newId,
        );
        if (existing) {
          set({
            items: get().items.map((i) =>
              (i.product._id || (i.product as any).id) === newId
                ? { ...i, quantity: i.quantity + newItem.quantity }
                : i,
            ),
          });
        } else {
          set({ items: [...get().items, newItem] });
        }
      },

      removeItem: (productId) =>
        set({
          items: get().items.filter(
            (i) => i.product._id !== productId && (i.product as any).id !== productId,
          ),
        }),

      updateQuantity: (productId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            (i.product._id === productId || (i.product as any).id === productId)
              ? { ...i, quantity: qty }
              : i,
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
    }),
    {
      name: 'ke_cart',
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
