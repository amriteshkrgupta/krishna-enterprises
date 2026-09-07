'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Filter, X, ChevronDown, ChevronUp, Search, RotateCcw } from 'lucide-react';
import { useProducts, useCategories } from '@/hooks/useProducts';
import ProductGrid from '@/components/products/ProductGrid';
import { cn } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name A to Z' },
];

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Parse URL params
  const search = searchParams.get('search') ?? '';
  const category = searchParams.get('category') ?? '';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const inStock = searchParams.get('inStock') === 'true';
  const sort = searchParams.get('sort') ?? 'newest';
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  // Local filter state
  const [localSearch, setLocalSearch] = useState(search);
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  useEffect(() => {
    setLocalSearch(search);
    setLocalMin(minPrice);
    setLocalMax(maxPrice);
  }, [search, minPrice, maxPrice]);

  const { data: productsResult, isLoading } = useProducts({
    search,
    category,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    inStock: inStock || undefined,
    sort,
    page,
  });

  const { data: categories = [] } = useCategories();

  const products = productsResult?.products ?? [];
  const totalPages = productsResult?.pages ?? 1;
  const totalCount = productsResult?.total ?? 0;

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v === undefined || v === '') params.delete(k);
        else params.set(k, v);
      });
      params.set('page', '1');
      router.push(`/products?${params.toString()}`);
    },
    [searchParams, router],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: localSearch.trim() || undefined });
  };

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({
      minPrice: localMin || undefined,
      maxPrice: localMax || undefined,
    });
  };

  const clearAllFilters = () => {
    setLocalSearch('');
    setLocalMin('');
    setLocalMax('');
    router.push('/products');
  };

  const activeFilters: { label: string; remove: () => void }[] = [];
  if (search) activeFilters.push({ label: `"${search}"`, remove: () => updateParams({ search: undefined }) });
  if (category) activeFilters.push({ label: `Category: ${category}`, remove: () => updateParams({ category: undefined }) });
  if (minPrice) activeFilters.push({ label: `Min ₹${minPrice}`, remove: () => updateParams({ minPrice: undefined }) });
  if (maxPrice) activeFilters.push({ label: `Max ₹${maxPrice}`, remove: () => updateParams({ maxPrice: undefined }) });
  if (inStock) activeFilters.push({ label: 'In Stock Only', remove: () => updateParams({ inStock: undefined }) });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* ─── Breadcrumb & Title ────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {category
              ? categories.find((c) => c.slug === category)?.name || 'Products'
              : search
              ? `Results for "${search}"`
              : 'All Grocery Products'}
          </h1>
          <p className="text-sm text-gray-500">
            {isLoading ? 'Loading catalog...' : `Showing ${products.length} of ${totalCount} items`}
          </p>
        </div>

        {/* Mobile filter toggle & Sort Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-bold shadow-xs md:hidden transition-all",
              activeFilters.length > 0
                ? "border-green-600 bg-green-50 text-green-700"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            )}
          >
            <Filter className="h-4 w-4 text-green-600" />
            <span>Filters</span>
            {activeFilters.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-[10px] font-extrabold text-white">
                {activeFilters.length}
              </span>
            )}
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="hidden text-xs font-semibold text-gray-500 sm:inline">Sort:</span>
            <select
              value={sort}
              onChange={(e) => updateParams({ sort: e.target.value })}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm font-bold text-gray-700 shadow-xs focus:border-green-600 focus:outline-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Horizontal Quick-Category Pills */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none md:hidden">
        <button
          onClick={() => updateParams({ category: undefined })}
          className={cn(
            'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-all shadow-2xs',
            !category
              ? 'bg-green-600 text-white shadow-sm'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
          )}
        >
          All Items
        </button>
        {categories.map((c) => (
          <button
            key={c._id}
            onClick={() => updateParams({ category: c.slug })}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-all shadow-2xs',
              category === c.slug
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* ─── Active Filter Chips ───────────────────────────────────────── */}
      {activeFilters.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">Active Filters:</span>
          {activeFilters.map((f, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 border border-green-200"
            >
              {f.label}
              <button onClick={f.remove} className="hover:text-green-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={clearAllFilters}
            className="text-xs font-semibold text-red-600 hover:underline ml-2 flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" /> Clear all
          </button>
        </div>
      )}

      {/* ─── Layout: Sidebar Filters + Products Grid ────────────────────── */}
      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-20 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-6">
            {/* Search filter */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Search</h3>
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search item..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 py-2 pl-3 pr-8 text-sm focus:border-green-600 focus:outline-none"
                />
                <button type="submit" className="absolute right-2 top-2.5 text-gray-400 hover:text-green-600">
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Category Filter */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Categories</h3>
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                <button
                  onClick={() => updateParams({ category: undefined })}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-colors text-left',
                    !category ? 'bg-green-50 font-bold text-green-700' : 'text-gray-600 hover:bg-gray-50',
                  )}
                >
                  <span>All Categories</span>
                </button>
                {categories.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => updateParams({ category: c.slug })}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-colors text-left',
                      category === c.slug ? 'bg-green-50 font-bold text-green-700' : 'text-gray-600 hover:bg-gray-50',
                    )}
                  >
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Price (₹)</h3>
              <form onSubmit={handlePriceApply} className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={localMin}
                    onChange={(e) => setLocalMin(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-green-600 focus:outline-none"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={localMax}
                    onChange={(e) => setLocalMax(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-green-600 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-gray-100 hover:bg-gray-200 py-1.5 text-xs font-bold text-gray-700 transition-colors"
                >
                  Apply Price
                </button>
              </form>
            </div>

            {/* In Stock toggle */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => updateParams({ inStock: e.target.checked ? 'true' : undefined })}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-600"
                />
                <span className="text-sm font-medium text-gray-700">In Stock Only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Products Grid + Pagination */}
        <main className="flex-1">
          <ProductGrid products={products} isLoading={isLoading} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => updateParams({ page: p.toString() })}
                  className={cn(
                    'h-10 w-10 rounded-xl font-bold text-sm transition-all',
                    page === p
                      ? 'bg-green-600 text-white shadow-md'
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Drawer Slide-over */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative flex h-full w-full max-w-xs flex-col bg-white shadow-2xl z-10 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-green-600" />
                <h2 className="text-base font-extrabold text-gray-900">Filter Products</h2>
                {activeFilters.length > 0 && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                    {activeFilters.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Search Filter */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Search Items</h3>
                <form
                  onSubmit={(e) => {
                    handleSearch(e);
                    setSidebarOpen(false);
                  }}
                  className="relative"
                >
                  <input
                    type="text"
                    placeholder="Search name, tag..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 py-2 pl-3 pr-8 text-sm focus:border-green-600 focus:outline-none"
                  />
                  <button type="submit" className="absolute right-2 top-2.5 text-gray-400 hover:text-green-600">
                    <Search className="h-4 w-4" />
                  </button>
                </form>
              </div>

              {/* Category Filter */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Categories</h3>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  <button
                    onClick={() => {
                      updateParams({ category: undefined });
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all text-left',
                      !category ? 'bg-green-600 text-white shadow-xs' : 'text-gray-700 hover:bg-gray-100',
                    )}
                  >
                    <span>All Categories</span>
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => {
                        updateParams({ category: c.slug });
                        setSidebarOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all text-left',
                        category === c.slug ? 'bg-green-600 text-white shadow-xs' : 'text-gray-700 hover:bg-gray-100',
                      )}
                    >
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Price Range (₹)</h3>
                <form
                  onSubmit={(e) => {
                    handlePriceApply(e);
                    setSidebarOpen(false);
                  }}
                  className="space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min ₹"
                      value={localMin}
                      onChange={(e) => setLocalMin(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
                    />
                    <span className="text-gray-400 font-bold">-</span>
                    <input
                      type="number"
                      placeholder="Max ₹"
                      value={localMax}
                      onChange={(e) => setLocalMax(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-green-600 hover:bg-green-700 py-2.5 text-xs font-extrabold text-white transition-colors shadow-xs"
                  >
                    Apply Price Filter
                  </button>
                </form>
              </div>

              {/* In Stock toggle */}
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => {
                      updateParams({ inStock: e.target.checked ? 'true' : undefined });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
                  />
                  <span className="text-xs font-bold text-gray-800">In Stock Products Only</span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 p-4 space-y-2 bg-gray-50">
              {activeFilters.length > 0 && (
                <button
                  onClick={() => {
                    clearAllFilters();
                    setSidebarOpen(false);
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Reset All Filters
                </button>
              )}
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-full rounded-xl bg-green-600 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-green-700 transition-colors"
              >
                View Results ({products.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
