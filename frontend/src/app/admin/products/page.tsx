'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Edit2, Trash2, CheckCircle2, XCircle,
  AlertTriangle, Filter, Package, ArrowUpDown, Layers, RefreshCw
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAdminProducts, useCategories } from '@/hooks/useProducts';
import { apiDelete, apiPut, apiPost } from '@/lib/api';
import { Product } from '@/types';
import DataTable, { Column } from '@/components/ui/DataTable';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatPrice, truncate, formatProductUnit } from '@/lib/utils';

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useAdminProducts({ search, category, page, limit: 100 });
  const { data: catData = [] } = useCategories();

  const rawProducts: Product[] = (data as any)?.products ?? [];
  const categories = catData;

  // PRD-F6: Dual filter system for Category & Stock Status
  const filteredProducts = useMemo(() => {
    return rawProducts.filter((p) => {
      const stock = p.stock || 0;
      if (stockStatusFilter === 'out_of_stock' && stock > 0) return false;
      if (stockStatusFilter === 'low_stock' && (stock >= 50 || stock === 0)) return false;
      if (stockStatusFilter === 'in_stock' && stock < 50) return false;
      return true;
    });
  }, [rawProducts, stockStatusFilter]);

  // PRD-F7: Server/client pagination
  const totalCount = filteredProducts.length;
  const totalPages = Math.ceil(totalCount / limit) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredProducts.slice(start, start + limit);
  }, [filteredProducts, page, limit]);

  // Mutations
  const deleteMut = useMutation({
    mutationFn: (id: string) => apiDelete<any>(`/products/admin/${id}`),
    onSuccess: () => {
      toast.success('Product removed successfully');
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to remove product'),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiPut<any>(`/products/admin/${id}`, { isActive }),
    onSuccess: () => {
      toast.success('Product status updated');
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: () => toast.error('Failed to update product'),
  });

  const updateStockMut = useMutation({
    mutationFn: ({ id, newStock }: { id: string; newStock: number }) =>
      apiPut<any>(`/products/admin/${id}/stock`, { stock: newStock }),
    onSuccess: () => {
      toast.success('Stock updated');
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: () => toast.error('Failed to update stock'),
  });

  // PRD-F9: Bulk actions
  const bulkActionMut = useMutation({
    mutationFn: ({ action, addStock }: { action: string; addStock?: number }) =>
      apiPost<any>('/products/admin/bulk-action', { ids: selectedIds, action, addStock }),
    onSuccess: (res: any) => {
      toast.success(res.message || 'Bulk action applied');
      setSelectedIds([]);
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: () => toast.error('Bulk action failed'),
  });

  // Checkbox handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedProducts.map((p) => p._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const isAllSelected =
    paginatedProducts.length > 0 && paginatedProducts.every((p) => selectedIds.includes(p._id));

  // PRD-F3: Structured Columns definition
  const columns: Column<Product>[] = [
    {
      key: '_id',
      header: (
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row._id)}
          onChange={(e) => handleSelectOne(row._id, e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
        />
      ),
    },
    {
      key: 'name',
      header: 'Product Details & Package Size',
      render: (row) => {
        const catSlug = typeof row.category === 'object' && row.category ? (row.category as any).slug : 'gen';
        const skuStr = `SKU: ${catSlug.toUpperCase().slice(0, 6)}-${row._id.slice(-6).toUpperCase()}`;
        const formattedUnit = formatProductUnit(row.unit, row.name, row.description);

        return (
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-gray-50 border border-gray-100 shadow-2xs">
              <img
                src={row.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80'}
                alt={row.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div>
              <p className="font-extrabold text-xs text-gray-900 leading-snug">
                {row.name} <span className="font-semibold text-gray-500">({formattedUnit})</span>
              </p>
              <p className="text-[10px] text-gray-400 font-mono tracking-tight">{skuStr}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => (
        <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
          {typeof row.category === 'object' && row.category !== null ? (row.category as any).name : (row as any).categoryName || 'Grocery'}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Pricing (Selling / MRP)',
      render: (row) => {
        const sellingPrice = row.discountPrice && row.discountPrice < row.price ? row.discountPrice : row.price;
        const mrp = row.discountPrice && row.discountPrice < row.price ? row.price : null;
        const savingsPercent = mrp ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;

        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xs text-gray-900">{formatPrice(sellingPrice)}</span>
              {mrp && (
                <span className="text-[11px] text-gray-400 line-through">{formatPrice(mrp)}</span>
              )}
            </div>
            {savingsPercent > 0 && (
              <span className="inline-block rounded bg-orange-100 px-1.5 py-0.2 text-[9px] font-black text-orange-700">
                Save {savingsPercent}%
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'stock',
      header: 'Stock Count & Alerts',
      render: (row) => {
        const stock = row.stock || 0;
        let badgeClass = 'bg-green-100 text-green-800 border-green-200';
        let label = `${stock} In Stock`;

        // PRD-F8: Low stock threshold visual badges
        if (stock === 0) {
          badgeClass = 'bg-red-100 text-red-800 border-red-200';
          label = 'Out of Stock (0)';
        } else if (stock < 50) {
          badgeClass = 'bg-amber-100 text-amber-900 border-amber-200';
          label = `${stock} (Low Stock)`;
        }

        return (
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-extrabold ${badgeClass}`}>
              {stock < 50 && <AlertTriangle className="h-3 w-3" />}
              {label}
            </span>
          </div>
        );
      },
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <button
          type="button"
          onClick={() => toggleMut.mutate({ id: row._id, isActive: !row.isActive })}
          className="flex items-center gap-1 text-xs font-bold transition hover:opacity-80"
        >
          {row.isActive ? (
            <span className="flex items-center gap-1 text-green-700 font-extrabold">
              <CheckCircle2 className="h-4 w-4" /> Active
            </span>
          ) : (
            <span className="flex items-center gap-1 text-gray-400 font-bold">
              <XCircle className="h-4 w-4" /> Inactive
            </span>
          )}
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {/* Quick stock add */}
          <button
            type="button"
            title="Add +10 Stock"
            onClick={() => updateStockMut.mutate({ id: row._id, newStock: (row.stock || 0) + 10 })}
            className="rounded-lg bg-gray-100 hover:bg-gray-200 px-2 py-1 text-[10px] font-black text-gray-700 transition"
          >
            +10
          </button>
          <button
            type="button"
            title="Add +50 Stock"
            onClick={() => updateStockMut.mutate({ id: row._id, newStock: (row.stock || 0) + 50 })}
            className="rounded-lg bg-green-50 hover:bg-green-100 px-2 py-1 text-[10px] font-black text-green-700 transition"
          >
            +50
          </button>

          <Link
            href={`/admin/products/${row._id}/edit`}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition"
            title="Edit Product"
          >
            <Edit2 className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setDeleteId(row._id)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
            title="Deactivate Product"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Add New Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Product Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your local Sitamarhi grocery inventory, pricing, packaging and visibility
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-1.5 rounded-xl bg-green-600 hover:bg-green-700 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition-all self-start sm:self-auto hover:scale-[1.01]"
        >
          <Plus className="h-4 w-4" /> Add New Product
        </Link>
      </div>

      {/* PRD-F5 & PRD-F6: Real-time Search & Dual Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search products by name, brand, SKU, tag..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-xs font-medium focus:border-green-600 focus:outline-none shadow-2xs"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </div>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-bold text-gray-700 focus:border-green-600 focus:outline-none bg-white"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={stockStatusFilter}
            onChange={(e) => {
              setStockStatusFilter(e.target.value as any);
              setPage(1);
            }}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-bold text-gray-700 focus:border-green-600 focus:outline-none bg-white"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock (≥ 50)</option>
            <option value="low_stock">⚠️ Low Stock (&lt; 50)</option>
            <option value="out_of_stock">🚨 Out of Stock (0)</option>
          </select>
        </div>
      </div>

      {/* PRD-F9: Bulk Processing Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900 px-5 py-3 text-white shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs font-black">
              {selectedIds.length}
            </span>
            <span className="text-xs font-bold">Selected Items</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => bulkActionMut.mutate({ action: 'activate' })}
              className="rounded-xl bg-green-600 hover:bg-green-500 px-3 py-1.5 text-xs font-bold text-white transition"
            >
              Set Active
            </button>
            <button
              type="button"
              onClick={() => bulkActionMut.mutate({ action: 'deactivate' })}
              className="rounded-xl bg-slate-700 hover:bg-slate-600 px-3 py-1.5 text-xs font-bold text-white transition"
            >
              Set Inactive
            </button>
            <button
              type="button"
              onClick={() => bulkActionMut.mutate({ action: 'addStock', addStock: 10 })}
              className="rounded-xl bg-amber-600 hover:bg-amber-500 px-3 py-1.5 text-xs font-bold text-white transition"
            >
              +10 Stock to All
            </button>
            <button
              type="button"
              onClick={() => bulkActionMut.mutate({ action: 'addStock', addStock: 50 })}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition"
            >
              +50 Stock to All
            </button>
            <button
              type="button"
              onClick={() => bulkActionMut.mutate({ action: 'delete' })}
              className="rounded-xl bg-red-600 hover:bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition"
            >
              Deactivate Selected
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-gray-400 hover:text-white underline ml-2"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Products table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <DataTable columns={columns} data={paginatedProducts} isLoading={isLoading} />
      </div>

      {/* PRD-F7: Server/Client Pagination Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white px-5 py-3.5 rounded-2xl border border-gray-100 shadow-2xs">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>
            Showing <strong className="text-gray-900">{totalCount > 0 ? (page - 1) * limit + 1 : 0}</strong> -{' '}
            <strong className="text-gray-900">{Math.min(page * limit, totalCount)}</strong> of{' '}
            <strong className="text-gray-900">{totalCount}</strong> items
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-400">Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-bold text-gray-700"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-30 transition"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
            .map((pNum) => (
              <button
                key={pNum}
                type="button"
                onClick={() => setPage(pNum)}
                className={`h-8 w-8 rounded-xl text-xs font-extrabold transition ${
                  pNum === page
                    ? 'bg-green-600 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {pNum}
              </button>
            ))}
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-30 transition"
          >
            Next
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        title="Deactivate Product"
        message="Are you sure you want to deactivate this product? It will be hidden from storefront customers."
        confirmText="Deactivate"
        variant="danger"
      />
    </div>
  );
}
