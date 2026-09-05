'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

// Sync server cart into Zustand store on mount
export function useSyncCart() {
  const setItems = useCartStore((s) => s.setItems);
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await apiGet<any>('/cart');
      const items = res.items || res.data?.items;
      if (Array.isArray(items) && items.length > 0) {
        setItems(items);
      }
      return items || [];
    },
    enabled: !!token,
    staleTime: 60 * 1000,
  });
}

// Add item to cart
export function useAddToCart() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);

  return useMutation({
    mutationFn: (payload: { productId: string; quantity: number }) =>
      apiPost<any>('/cart', payload),
    onSuccess: (res) => {
      const items = res.items || res.data?.items;
      if (Array.isArray(items)) {
        useCartStore.getState().setItems(items);
      }
      useCartStore.getState().openCart();
      qc.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err: unknown) => {
      if (!token) return;
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not add to cart';
      toast.error(msg);
    },
  });
}

// Update cart item quantity
export function useUpdateCartItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      apiPut<any>(`/cart/${productId}`, { quantity }),
    onSuccess: (res) => {
      const items = res.items || res.data?.items;
      if (Array.isArray(items)) {
        useCartStore.getState().setItems(items);
      }
      qc.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: () => toast.error('Failed to update cart quantity'),
  });
}

// Remove a single item from cart
export function useRemoveFromCart() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => apiDelete<any>(`/cart/${productId}`),
    onSuccess: (res) => {
      const items = res.items || res.data?.items;
      if (Array.isArray(items)) {
        useCartStore.getState().setItems(items);
      }
      qc.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item removed');
    },
    onError: () => toast.error('Failed to remove item'),
  });
}

// Clear entire cart
export function useClearCart() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => apiDelete<any>('/cart'),
    onSuccess: () => {
      useCartStore.getState().clearCart();
      qc.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: () => toast.error('Failed to clear cart'),
  });
}
