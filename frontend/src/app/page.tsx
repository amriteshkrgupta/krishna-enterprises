'use client';

import Link from 'next/link';
import { ArrowRight, Truck, BadgeCheck, Shield, Phone, MessageSquare, Sparkles } from 'lucide-react';
import { useCategories, useFeaturedProducts, useProducts } from '@/hooks/useProducts';
import CategoryCard from '@/components/products/CategoryCard';
import ProductGrid from '@/components/products/ProductGrid';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const STORE_PHONE = '+91 72569 55630';
const RAW_PHONE = '917256955630';
const WA_MSG = 'Hello Krishna Enterprises, I would like to order fresh groceries in Madhuban, East Champaran!';

export default function HomePage() {
  const { data: categories = [], isLoading: catLoading } = useCategories();
  const { data: featuredProducts = [], isLoading: featLoading } = useFeaturedProducts();
  const { data: allProductsData, isLoading: allLoading } = useProducts({ limit: 8 });
  const allProducts = allProductsData?.products || [];

  const waUrl = `https://wa.me/${RAW_PHONE}?text=${encodeURIComponent(WA_MSG)}`;

  return (
    <div className="flex flex-col space-y-8 sm:space-y-12">
      {/* ── 1. Hero Banner Section ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-800 via-green-700 to-green-600 px-4 py-12 sm:py-16 text-white sm:px-6 shadow-xs">
        <div
          aria-hidden
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative mx-auto max-w-4xl text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1 text-xs font-bold backdrop-blur-md border border-white/20 text-green-100 shadow-2xs">
            🌿 Madhuban, East Champaran&apos;s Trusted Grocery Store
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
            Fresh Groceries Delivered To <br className="hidden sm:inline" />
            <span className="text-orange-300">Your Doorstep</span>
          </h1>
          <p className="mx-auto max-w-xl text-xs sm:text-sm text-green-100 leading-relaxed font-medium">
            Order atta, rice, dal, oil, spices and daily essentials online.
            Instant UPI QR scan &amp; pay. Doorstep delivery across Madhuban &amp; East Champaran, Bihar.
          </p>

          <div className="pt-2 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/products"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3 text-xs sm:text-sm font-black text-green-800 shadow-md hover:bg-gray-50 transition-all hover:scale-105"
            >
              Shop All Products <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/products?featured=true"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border-2 border-white/40 px-7 py-3 text-xs sm:text-sm font-bold text-white hover:bg-white/10 transition-all"
            >
              View Featured Deals
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. Categories Section (Clean Horizontal / Grid Icon Layout) ─────── */}
      <section id="categories" className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
              <span>Explore Categories</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Explore fresh daily staples and groceries</p>
          </div>
          <Link href="/products" className="text-xs font-extrabold text-green-700 hover:underline flex items-center gap-1">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {catLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">No categories available</div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8">
            {categories.map((cat) => (
              <CategoryCard key={cat._id} category={cat} />
            ))}
          </div>
        )}
      </section>

      {/* ── 3. Featured / Deals Products Section ──────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200 inline-flex items-center gap-1 mb-1">
                <Sparkles className="h-3 w-3" /> Special Offers
              </span>
              <h2 className="text-lg sm:text-xl font-black text-gray-900">Featured Deals</h2>
            </div>
            <Link
              href="/products?featured=true"
              className="text-xs font-extrabold text-green-700 hover:underline flex items-center gap-1"
            >
              View all deals <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <ProductGrid products={featuredProducts} isLoading={featLoading} />
        </div>
      </section>

      {/* ── 4. Popular Products Section ─────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-gray-900">Popular Staples</h2>
            <p className="text-xs text-gray-500 mt-0.5">Top-selling daily groceries at best market prices</p>
          </div>
          <Link href="/products" className="text-xs font-extrabold text-green-700 hover:underline flex items-center gap-1">
            Browse All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <ProductGrid products={allProducts} isLoading={allLoading} />
      </section>

      {/* ── 5. Why Choose Us Section ────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 w-full">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black text-gray-900 sm:text-2xl">
              Why Choose Krishna Enterprises?
            </h2>
            <p className="text-xs text-gray-500">Your local grocery partner in Madhuban, East Champaran</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 space-y-2 hover:border-green-200 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
                <Truck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-extrabold text-gray-900">Fast Local Delivery</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Choose your slot: Morning (9 AM - 1 PM) or Evening (4 PM - 8 PM) across Madhuban.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 space-y-2 hover:border-orange-200 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-extrabold text-gray-900">100% Fresh &amp; Authentic</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                All groceries sourced from certified brands and packed with hygiene &amp; quality assurance.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 space-y-2 hover:border-blue-200 transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-extrabold text-gray-900">Best Market Prices</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Competitive rates with special discounts on staples. FREE delivery on orders above ₹500.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Store Contact & Location Section ─────────────────────────────── */}
      <section className="bg-gradient-to-r from-green-900 to-green-800 py-10 px-4 text-white sm:px-6 shadow-md">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-0.5 text-[11px] font-bold text-green-300">
              📍 Shop Location
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white">Krishna Enterprises</h3>
            <p className="text-xs text-green-200 max-w-xl">
              Machhaha Chowk, Chakia - Madhuban - Sheohar Rd, Rupni, Jogaulia Tola Kharsal, Bihar 845420
            </p>
            <p className="text-xs text-green-300 font-bold">
              📞 Contact: {STORE_PHONE}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 shrink-0">
            <a
              href="tel:07256955630"
              className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black text-green-900 shadow-md hover:bg-gray-100 transition-all"
            >
              <Phone className="h-4 w-4" /> Call {STORE_PHONE}
            </a>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] px-5 py-3 text-xs font-black text-white shadow-md transition-all"
            >
              <MessageSquare className="h-4 w-4" /> WhatsApp Chat
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
