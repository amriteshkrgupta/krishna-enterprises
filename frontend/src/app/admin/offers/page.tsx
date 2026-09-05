'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, X, CheckCircle, XCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import DataTable, { Column } from '@/components/ui/DataTable';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatDate, formatPrice } from '@/lib/utils';

interface Offer {
  _id: string;
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  expiresAt?: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

const schema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').toUpperCase(),
  discountType: z.enum(['percent', 'flat']),
  discountValue: z.coerce.number().min(1, 'Discount value required'),
  minOrderAmount: z.coerce.number().min(0).default(0),
  maxDiscount: z.coerce.number().optional(),
  expiresAt: z.string().optional(),
  usageLimit: z.coerce.number().min(1).default(100),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

const inputCls =
  'h-10 w-full rounded-xl border border-gray-300 px-3 text-xs outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition';

export default function AdminOffersPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'offers'],
    queryFn: async () => {
      const res = await apiGet<any>('/offers/admin');
      return (res.offers || res.data || []) as Offer[];
    },
  });

  const offers = data || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { discountType: 'percent', discountValue: 10, minOrderAmount: 300, isActive: true },
  });

  const createMut = useMutation({
    mutationFn: (values: FormValues) => apiPost<any>('/offers/admin', values),
    onSuccess: () => {
      toast.success('Coupon created successfully!');
      qc.invalidateQueries({ queryKey: ['admin', 'offers'] });
      setModalOpen(false);
      reset();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to create coupon';
      toast.error(msg);
    },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiPut<any>(`/offers/admin/${id}`, { isActive }),
    onSuccess: () => {
      toast.success('Coupon updated');
      qc.invalidateQueries({ queryKey: ['admin', 'offers'] });
    },
    onError: () => toast.error('Failed to update coupon'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiDelete<any>(`/offers/admin/${id}`),
    onSuccess: () => {
      toast.success('Coupon deleted');
      qc.invalidateQueries({ queryKey: ['admin', 'offers'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete coupon'),
  });

  const columns: Column<Offer>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (r) => <span className="font-mono font-extrabold text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-lg border border-green-200">{r.code}</span>,
    },
    {
      key: 'discountValue',
      header: 'Discount',
      render: (r) => (
        <span className="font-bold text-xs text-gray-900">
          {r.discountType === 'percent' ? `${r.discountValue}% OFF` : `Flat ${formatPrice(r.discountValue)} OFF`}
        </span>
      ),
    },
    {
      key: 'minOrderAmount',
      header: 'Min Order',
      render: (r) => <span className="text-xs text-gray-600">{formatPrice(r.minOrderAmount)}</span>,
    },
    {
      key: 'usedCount',
      header: 'Usage',
      render: (r) => <span className="text-xs text-gray-500">{r.usedCount} / {r.usageLimit || '∞'}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (r) => (
        <button
          onClick={() => toggleMut.mutate({ id: r._id, isActive: !r.isActive })}
          className="flex items-center gap-1 text-xs font-semibold"
        >
          {r.isActive ? (
            <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-4 w-4" /> Active</span>
          ) : (
            <span className="flex items-center gap-1 text-gray-400"><XCircle className="h-4 w-4" /> Inactive</span>
          )}
        </button>
      ),
    },
    {
      key: '_id',
      header: 'Action',
      render: (r) => (
        <button onClick={() => setDeleteId(r._id)} className="p-1 text-gray-400 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Coupon & Offer Management</h1>
          <p className="text-xs text-gray-500">Create discount promo codes for customer checkouts</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-green-600 hover:bg-green-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" /> Create Coupon
        </button>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <DataTable columns={columns} data={offers} isLoading={isLoading} />
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900">Create Promo Coupon</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit((v) => createMut.mutate(v))} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Coupon Code *</label>
                <input type="text" placeholder="e.g. KRISHNA10" {...register('code')} className={inputCls} />
                {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Discount Type</label>
                  <select {...register('discountType')} className={inputCls}>
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Discount Value *</label>
                  <input type="number" placeholder="10" {...register('discountValue')} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Min Order Amount (₹)</label>
                  <input type="number" placeholder="300" {...register('minOrderAmount')} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Max Cap Discount (₹)</label>
                  <input type="number" placeholder="Optional" {...register('maxDiscount')} className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Usage Limit</label>
                <input type="number" placeholder="100" {...register('usageLimit')} className={inputCls} />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || createMut.isPending}
                  className="rounded-xl bg-green-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-green-700 disabled:bg-gray-300"
                >
                  {createMut.isPending ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        title="Delete Coupon"
        message="Are you sure you want to delete this coupon code?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
