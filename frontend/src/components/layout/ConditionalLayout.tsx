'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const isCheckout = pathname.startsWith('/checkout');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50 pb-16 md:pb-0">
      <Navbar />
      <main className="flex-1">{children}</main>
      {isCheckout ? (
        <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
          <p className="flex items-center justify-center gap-1.5 font-medium">
            <span>Need help?</span>
            <a href="tel:+917256955630" className="font-extrabold text-gray-900 hover:text-green-700">
              +91 72569 55630
            </a>
            <span>·</span>
            <a
              href="https://wa.me/917256955630?text=Hello%20Krishna%20Enterprises%2C%20I%20need%20help%20with%20my%20order"
              target="_blank"
              rel="noopener noreferrer"
              className="font-extrabold text-green-700 hover:underline"
            >
              WhatsApp
            </a>
          </p>
        </footer>
      ) : (
        <Footer />
      )}
      <MobileBottomNav />
    </div>
  );
}
