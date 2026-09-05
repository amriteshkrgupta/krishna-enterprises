import { QueryClient } from '@tanstack/react-query';

// PRD Section 3.A: Dynamic Data Sync & Real-Time Cache Management
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Mark data stale immediately so revalidation occurs on mount/focus
      gcTime: 1000 * 60 * 5, // Keep unused cache for 5 minutes in memory
      retry: 2,
      refetchOnWindowFocus: true, // Auto-refetch when user switches tabs or returns to app
      refetchOnReconnect: true,   // Auto-refetch when network connectivity is restored
      refetchOnMount: true,       // Auto-refetch on component mount
    },
    mutations: {
      retry: 0,
    },
  },
});
