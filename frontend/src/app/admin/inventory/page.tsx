'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Save, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { apiGet, apiPut } from '@/lib/api';
import { Product } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatPrice, cn } from '@/lib/utils';

export default function AdminInventoryPage() {
  const qc = useQueryClient();
  const [onlyLow, setOnlyLow] = useState(false);
  const [stocks, setStocks] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'inventory'],
    queryFn: async () => {
      const res = await apiGet<any>('/products', { limit: 100 });
      return (res.products || res.data?.products || []) as Product[];
    },
  });

  const products = data || [];
  const filtered = onlyLow ? products.filter((p) => p.stock < 10) : products;

  const updateStock = async (productId: string) => {
    const newStock = stocks[productId];
    if (newStock === undefined) return;
    setSaving(productId);
    try {
      await apiPut<any>(`/products/admin/${productId}/stock`, { stock: newStock });
      toast.success('Stock updated successfully!');
      qc.invalidateQueries({ queryKey: ['admin', 'inventory'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      setStocks((s) => {
        const n = { ...s };
        delete n[productId];
        return n;
      });
    } catch {
      toast.error('Failed to update stock');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Inventory Management</h1>
          <p className="text-xs text-gray-500">Live stock control and fast inventory updates</p>
        </div>

        <label className="flex items-center gap-2 cursor-pointer rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs font-bold text-orange-900">
          <input
            type="checkbox"
            checked={onlyLow}
            onChange={(e) => setOnlyLow(e.target.checked)}
            className="rounded border-orange-300 text-orange-500 focus:ring-orange-400"
          />
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <span>Show Low Stock Only (&lt;10 items)</span>
        </label>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="xl" />
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-100 bg-gray-50/75 text-gray-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Update Quantity</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 font-medium">
                    No matching inventory items.
                  </td>
                </tr>
              ) : (
                filtered.map((product) => {
                  const currentInput = stocks[product._id] ?? product.stock;
                  const isLow = product.stock < 10;
                  const isOOS = product.stock === 0;

                  return (
                    <tr
                      key={product._id}
                      className={cn(
                        'hover:bg-gray-50/50 transition-colors',
                        isOOS ? 'bg-red-50/30' : isLow ? 'bg-orange-50/30' : '',
                      )}
                    >
                      <td className="py-3 px-4 font-bold text-gray-900">{product.name}</td>
                      <td className="py-3 px-4 text-gray-500">{product.unit || 'unit'}</td>
                      <td className="py-3 px-4 font-semibold text-gray-800">{formatPrice(product.price)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'font-extrabold text-sm',
                            isOOS ? 'text-red-600' : isLow ? 'text-orange-500' : 'text-green-700',
                          )}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 max-w-[170px]">
                          <input
                            type="number"
                            min="0"
                            value={currentInput}
                            onChange={(e) =>
                              setStocks((s) => ({
                                ...s,
                                [product._id]: Math.max(0, parseInt(e.target.value) || 0),
                              }))
                            }
                            className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-xs font-bold text-gray-900 focus:border-green-600 focus:outline-none"
                          />
                          <button
                            onClick={() => updateStock(product._id)}
                            disabled={saving === product._id || stocks[product._id] === undefined}
                            className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                          >
                            {saving === product._id ? '...' : <Save className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {isOOS ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 font-extrabold text-red-700 text-[10px]">
                            OUT OF STOCK
                          </span>
                        ) : isLow ? (
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 font-bold text-orange-700 text-[10px]">
                            LOW STOCK
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 font-bold text-green-700 text-[10px]">
                            IN STOCK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
