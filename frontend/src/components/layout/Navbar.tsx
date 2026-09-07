'use client';

import { useState, useRef, useEffect, memo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  ShoppingCart, Search, Menu, X, User, LogOut, Package,
  Leaf, ChevronDown, ShieldCheck, ArrowRight, Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { apiGet } from '@/lib/api';
import { cn, formatPrice } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'All Products', href: '/products' },
  { label: 'Categories', href: '/#categories' },
  { label: 'Deals & Featured', href: '/products?featured=true' },
];

function NavbarComponent() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const toggleCart = useCartStore((s) => s.toggleCart);

  // ⚡ INP OPTIMIZATION: Primitive number selector for cart count
  const cartCount = useCartStore(
    useCallback((s) => s.items.reduce((sum, item) => sum + item.quantity, 0), [])
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropOpen, setUserDropOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Live Auto-Suggestion Search with Debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await apiGet<any>(`/products?search=${encodeURIComponent(searchQuery.trim())}&limit=5`);
        const items = res?.products || res?.data?.products || [];
        setSuggestions(items);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setUserDropOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      setShowSuggestions(false);
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    },
    [searchQuery, router]
  );

  const handleLogout = useCallback(() => {
    logout();
    setUserDropOpen(false);
    router.push('/');
  }, [logout, router]);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 shadow-sm">
            <Leaf className="h-6 w-6 text-white" />
          </span>
          <div>
            <span className="text-lg font-extrabold text-gray-900 leading-none block">Krishna</span>
            <span className="text-xs font-semibold text-green-600 leading-none">Enterprises</span>
          </div>
        </Link>

        {/* Prominent Search Bar (Desktop) */}
        <div ref={searchRef} className="relative hidden flex-1 max-w-md md:block">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Search groceries, atta, rice, oil, spices..."
                value={searchQuery}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50/80 py-2.5 pl-10 pr-9 text-xs font-medium focus:border-green-600 focus:bg-white focus:outline-none transition-all shadow-inner"
              />
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              {isSearching && (
                <Loader2 className="absolute right-3.5 top-3 h-4 w-4 text-green-600 animate-spin" />
              )}
            </div>
          </form>

          {/* Floating Search Auto-Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 px-3 py-1">
                Suggested Products
              </div>
              <div className="divide-y divide-gray-50">
                {suggestions.map((p) => (
                  <Link
                    key={p._id}
                    href={`/products/${p.slug}`}
                    onClick={() => {
                      setShowSuggestions(false);
                      setSearchQuery('');
                    }}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-green-50/60 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-lg bg-gray-50 overflow-hidden border border-gray-100 shrink-0">
                        <img
                          src={p.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=80&q=80'}
                          alt={p.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                          {p.name}
                        </p>
                        <span className="text-[10px] text-gray-400">
                          {typeof p.category === 'object' ? p.category.name : 'Grocery'} {p.unit && `· ${p.unit}`}
                        </span>
                      </div>
                    </div>
                    <span className="font-extrabold text-xs text-green-700">
                      {formatPrice(p.discountPrice || p.price)}
                    </span>
                  </Link>
                ))}
              </div>
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="w-full mt-1.5 flex items-center justify-center gap-1 rounded-xl bg-gray-50 hover:bg-green-50 p-2 text-xs font-bold text-green-700 transition-colors"
              >
                View all results for &quot;{searchQuery}&quot; <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-bold transition-colors',
                pathname === link.href
                  ? 'bg-green-50 text-green-700 font-extrabold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Cart Button with Count Badge */}
          <button
            onClick={toggleCart}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors border border-gray-100"
            aria-label="Open cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-extrabold text-white shadow-xs">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>

          {/* Auth: User Dropdown or Login */}
          {user ? (
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setUserDropOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white p-1 pr-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 shadow-2xs transition-colors"
                aria-label="User profile menu"
                title={user.name}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white font-bold text-xs shadow-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
              </button>

              {userDropOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-gray-100 bg-white py-1 shadow-xl z-50 animate-in fade-in zoom-in-95">
                  <div className="border-b border-gray-100 px-4 py-2.5">
                    <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>

                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setUserDropOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-green-700 hover:bg-green-50"
                    >
                      <ShieldCheck className="h-4 w-4" /> Admin Dashboard
                    </Link>
                  )}

                  <Link
                    href="/orders"
                    onClick={() => setUserDropOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <Package className="h-4 w-4" /> My Orders
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setUserDropOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <User className="h-4 w-4" /> My Account
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border-t border-gray-50 mt-1"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/login"
                className="rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-green-600 px-3 py-1.5 text-xs font-extrabold text-white shadow-xs hover:bg-green-700 transition-colors"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 md:hidden hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5 text-gray-700" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer with Prominent Search Bar */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 pb-6 pt-3 md:hidden space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="🔍 Search groceries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-xs font-medium focus:outline-none focus:border-green-600"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </form>

          <nav className="flex flex-col space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2 text-xs font-extrabold text-gray-700 hover:bg-gray-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

const Navbar = memo(NavbarComponent);
export default Navbar;
