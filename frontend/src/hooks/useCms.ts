'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut, apiPost } from '@/lib/api';
import { HomepageConfig, HomepageSection, HomepageVersion } from '@/types';

// Fetch public live or admin draft homepage configuration
export function useHomepageConfig(isPreview = false) {
  return useQuery<HomepageConfig>({
    queryKey: ['cms', 'homepage', isPreview ? 'draft' : 'published'],
    queryFn: async () => {
      const endpoint = isPreview ? '/cms/homepage/draft' : '/cms/homepage';
      const res = await apiGet<any>(endpoint);
      return res.data as HomepageConfig;
    },
    staleTime: isPreview ? 0 : 1000 * 60 * 2, // 2 minutes for public storefront
  });
}

// Save draft homepage
export function useSaveDraftHomepage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sections: HomepageSection[]) => {
      const res = await apiPut<any>('/cms/homepage/draft', { sections });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms', 'homepage'] });
    },
  });
}

// Publish draft homepage to live
export function usePublishHomepage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (note?: string) => {
      const res = await apiPost<any>('/cms/homepage/publish', { note });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms', 'homepage'] });
    },
  });
}

// Reset homepage to factory default
export function useResetHomepage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiPost<any>('/cms/homepage/reset');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms', 'homepage'] });
    },
  });
}

// Get homepage version history
export function useHomepageVersions() {
  return useQuery<HomepageVersion[]>({
    queryKey: ['cms', 'homepage', 'versions'],
    queryFn: async () => {
      const res = await apiGet<any>('/cms/homepage/versions');
      return (res.data || []) as HomepageVersion[];
    },
  });
}

// Rollback to specific version
export function useRollbackHomepage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (version: number) => {
      const res = await apiPost<any>(`/cms/homepage/rollback/${version}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms', 'homepage'] });
    },
  });
}
