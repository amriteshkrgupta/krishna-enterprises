'use client';

import { useEffect, useRef } from 'react';

export default function BhkSdkInitializer() {
  const initializedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate SDK initialization during re-renders or HMR
    if (initializedRef.current) return;

    const publicKey = process.env.NEXT_PUBLIC_BHK_PUBLIC_KEY?.trim();
    const merchantId = process.env.NEXT_PUBLIC_BHK_MERCHANT_ID?.trim();

    // Validate required credentials before invoking BHK SDK
    if (!publicKey || !merchantId) {
      if (process.env.NODE_ENV !== 'production') {
        console.info(
          '[BHK Widget] Configuration notice: NEXT_PUBLIC_BHK_PUBLIC_KEY or NEXT_PUBLIC_BHK_MERCHANT_ID is not configured. BHK SDK initialization safely skipped.'
        );
      }
      return;
    }

    try {
      const globalBhk = (window as any).BHK;
      if (globalBhk && typeof globalBhk.install === 'function') {
        globalBhk.install({
          publicKey,
          merchantId,
        });
        initializedRef.current = true;
        console.log('[BHK Widget] SDK initialized successfully.');
      } else if (globalBhk && typeof globalBhk.init === 'function') {
        globalBhk.init({
          publicKey,
          merchantId,
        });
        initializedRef.current = true;
        console.log('[BHK Widget] SDK initialized successfully.');
      }
    } catch (err) {
      console.warn('[BHK Widget] Failed to initialize SDK:', err);
    }
  }, []);

  return null;
}
