'use client';

import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import CartSidebar from '@/components/cart/CartSidebar';
import BhkSdkInitializer from '@/components/providers/BhkSdkInitializer';

export default function Providers({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore((s) => s.initAuth);

  // Initialize auth from localStorage on mount
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <BhkSdkInitializer />
      {children}

      {/* Global cart sidebar rendered at root */}
      <CartSidebar />

      {/* Toast notifications */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            borderRadius: '12px',
            fontSize: '14px',
            padding: '10px 16px',
          },
          success: {
            iconTheme: { primary: '#16a34a', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </QueryClientProvider>
  );
}
