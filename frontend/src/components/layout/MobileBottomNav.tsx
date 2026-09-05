'use client';

import { memo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Package, User, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

function MobileBottomNavComponent() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const toggleCart = useCartStore((s) => s.toggleCart);

  // ⚡ INP OPTIMIZATION: Primitive number selector for cart count
  const cartCount = useCartStore(
    useCallback((s) => s.items.reduce((sum, item) => sum + item.quantity, 0), [])
  );

  // Hide mobile bottom nav on admin routes
  if (pathname?.startsWith('/admin')) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-md px-2 py-1.5 md:hidden shadow-lg">
      <div className="flex items-center justify-around">
        <Link
          href="/"
          className={cn(
            'flex flex-col items-center py-1 px-3 text-[10px] font-bold transition-colors',
            pathname === '/' ? 'text-green-700 font-extrabold' : 'text-gray-500 hover:text-gray-900',
          )}
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </Link>

        <Link
          href="/products"
          className={cn(
            'flex flex-col items-center py-1 px-3 text-[10px] font-bold transition-colors',
            pathname === '/products' ? 'text-green-700 font-extrabold' : 'text-gray-500 hover:text-gray-900',
          )}
        >
          <ShoppingBag className="h-5 w-5" />
          <span>Products</span>
        </Link>

        <button
          type="button"
          onClick={toggleCart}
          className="relative flex flex-col items-center py-1 px-3 text-[10px] font-bold text-gray-500 hover:text-green-700 transition-colors"
        >
          <div className="relative">
            <ShoppingCart className="h-5 w-5 text-gray-700" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-black text-white shadow-xs">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </div>
          <span>Cart</span>
        </button>

        <Link
          href="/orders"
          className={cn(
            'flex flex-col items-center py-1 px-3 text-[10px] font-bold transition-colors',
            pathname === '/orders' ? 'text-green-700 font-extrabold' : 'text-gray-500 hover:text-gray-900',
          )}
        >
          <Package className="h-5 w-5" />
          <span>Orders</span>
        </Link>

        <Link
          href={user ? '/profile' : '/login'}
          className={cn(
            'flex flex-col items-center py-1 px-3 text-[10px] font-bold transition-colors',
            pathname === '/profile' || pathname === '/login' ? 'text-green-700 font-extrabold' : 'text-gray-500 hover:text-gray-900',
          )}
        >
          <User className="h-5 w-5" />
          <span>{user ? 'Account' : 'Login'}</span>
        </Link>
      </div>
    </div>
  );
}

const MobileBottomNav = memo(MobileBottomNavComponent);
export default MobileBottomNav;
