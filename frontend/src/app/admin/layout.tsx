'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, Tag, ShoppingBag, Users, Percent,
  Warehouse, LogOut, Leaf, Menu, X, ArrowLeft,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/admin/orders', label: 'Orders', icon: <ShoppingBag className="h-4 w-4" /> },
  { href: '/admin/customers', label: 'Customers', icon: <Users className="h-4 w-4" /> },
  { href: '/admin/products', label: 'Products', icon: <Package className="h-4 w-4" /> },
  { href: '/admin/categories', label: 'Categories', icon: <Tag className="h-4 w-4" /> },
  { href: '/admin/inventory', label: 'Inventory', icon: <Warehouse className="h-4 w-4" /> },
  { href: '/admin/offers', label: 'Offers & Coupons', icon: <Percent className="h-4 w-4" /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [sideOpen, setSideOpen] = useState(false);

  useEffect(() => {
    if (user !== null && user.role !== 'admin') {
      toast.error('Access denied');
      router.replace('/');
    }
  }, [user, router]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const Sidebar = () => (
    <nav className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 shadow-md">
          <Leaf className="h-5 w-5 text-white" />
        </span>
        <div>
          <p className="font-extrabold text-white text-sm leading-tight">Krishna Enterprises</p>
          <p className="text-xs text-slate-400">Admin Control Center</p>
        </div>
      </div>

      {/* Links */}
      <ul className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const active =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setSideOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all',
                  active
                    ? 'bg-green-600 text-white shadow-sm scale-[1.02]'
                    : 'text-slate-300 hover:bg-slate-700/60 hover:text-white',
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Back to store & user info */}
      <div className="border-t border-slate-700 p-4 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl bg-slate-700/40 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Storefront
        </Link>
        <div className="pt-2">
          <p className="text-[11px] font-mono text-slate-400 truncate">{user?.email || 'help.amriteshkumar@gmail.com'}</p>
          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-1.5 rounded-lg text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col bg-slate-800 lg:flex shadow-xl">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sideOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
            onClick={() => setSideOpen(false)}
          />
          <aside className="fixed left-0 top-0 z-50 flex h-full w-60 flex-col bg-slate-800 lg:hidden shadow-2xl">
            <Sidebar />
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 shadow-sm shrink-0">
          <button
            onClick={() => setSideOpen((v) => !v)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-extrabold text-gray-800 text-sm">Krishna Enterprises</span>
          <span className="text-gray-400 text-xs hidden sm:inline">| Sitamarhi Admin Panel</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:block text-xs text-gray-700 font-bold">{user?.name || 'Admin'}</span>
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-extrabold text-green-800 border border-green-200">
              Admin
            </span>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
