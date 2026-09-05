'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import { Order } from '@/types';

export interface PlaceOrderPayload {
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  deliverySlot: 'morning' | 'afternoon' | 'evening';
  paymentMethod: 'COD' | 'online';
  couponCode?: string;
  notes?: string;
}

export interface AdminOrderFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

// My Orders
export function useMyOrders(page = 1) {
  return useQuery({
    queryKey: ['orders', 'my', page],
    queryFn: async () => {
      const res = await apiGet<any>('/orders', { page, limit: 10 });
      return {
        orders: res.orders || res.data || [],
        total: res.total || 0,
        pages: res.pages || 1,
      };
    },
  });
}

// Single Order by ID
export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: async () => {
      const res = await apiGet<any>(`/orders/${id}`);
      return (res.order || res.data || res) as Order;
    },
    enabled: !!id,
  });
}

// Place Order
export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PlaceOrderPayload) => apiPost<any>('/orders', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['cart'] });
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to place order';
      toast.error(msg);
    },
  });
}

// Cancel Order
export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiPut<any>(`/orders/${id}/cancel`, { reason }),
    onSuccess: () => {
      toast.success('Order cancelled successfully');
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
    onError: () => toast.error('Failed to cancel order'),
  });
}

// Admin: All Orders
export function useAdminOrders(filters: AdminOrderFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'orders', filters],
    queryFn: async () => {
      const res = await apiGet<any>('/orders/admin/all', filters as Record<string, unknown>);
      return {
        orders: res.orders || [],
        total: res.total || 0,
        pages: res.pages || 1,
      };
    },
  });
}

// Admin: Update Order Status
export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      apiPut<any>(`/orders/admin/${id}/status`, { status, note }),
    onSuccess: () => {
      toast.success('Order status updated');
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: () => toast.error('Failed to update status'),
  });
}
