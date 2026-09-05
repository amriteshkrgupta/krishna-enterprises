'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { Category, Product } from '@/types';

export interface ProductParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: string;
  featured?: boolean;
}

export interface ProductsDataResult {
  products: Product[];
  total: number;
  page: number;
  pages: number;
}

// All Products
export function useProducts(params: ProductParams = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const res = await apiGet<any>('/products', params as Record<string, unknown>);
      return {
        products: res.products || res.data?.products || [],
        total: res.total || 0,
        page: res.page || 1,
        pages: res.pages || 1,
      };
    },
  });
}

// Single Product by slug
export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const res = await apiGet<any>(`/products/${slug}`);
      return (res.product || res.data || res) as Product;
    },
    enabled: !!slug,
  });
}

// Featured Products
export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const res = await apiGet<any>('/products/featured');
      return (res.products || res.data || []) as Product[];
    },
  });
}

// All Categories
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiGet<any>('/categories');
      return (res.categories || res.data || []) as Category[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Search Products
export function useSearchProducts(query: string) {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: async () => {
      const res = await apiGet<any>('/products/search', { q: query });
      return (res.products || res.data || []) as Product[];
    },
    enabled: query.trim().length >= 2,
  });
}

// Admin: All Products
export function useAdminProducts(params: ProductParams = {}) {
  return useQuery({
    queryKey: ['admin', 'products', params],
    queryFn: async () => {
      const res = await apiGet<any>('/products', params as Record<string, unknown>);
      return {
        products: res.products || [],
        total: res.total || 0,
        page: res.page || 1,
        pages: res.pages || 1,
      };
    },
  });
}
