'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { Category } from '@/types';
import DataTable, { Column } from '@/components/ui/DataTable';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

const inputCls =
  'h-10 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition';

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => {
      const res = await apiGet<any>('/categories');
      return (res.categories || res.data || []) as Category[];
    },
  });

  const categories = data || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const openCreate = () => {
    setEditTarget(null);
    reset({ name: '', description: '', sortOrder: 0, isActive: true });
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    reset({
      name: cat.name,
      description: cat.description,
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
    });
    setModalOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: (values: FormValues) => {
      if (editTarget) {
        return apiPut<any>(`/categories/admin/${editTarget._id}`, values);
      }
      return apiPost<any>('/categories/admin', values);
    },
    onSuccess: () => {
      toast.success(editTarget ? 'Category updated!' : 'Category created!');
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      setModalOpen(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to save category';
      toast.error(msg);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiDelete<any>(`/categories/admin/${id}`),
    onSuccess: () => {
      toast.success('Category removed');
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      setDeleteId(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Cannot delete category with active products';
      toast.error(msg);
    },
  });

  const columns: Column<Category>[] = [
    {
      key: 'name',
      header: 'Category Name',
      render: (r) => (
        <div>
          <p className="font-bold text-xs text-gray-900">{r.name}</p>
          <p className="text-xs text-gray-400 font-mono">/{r.slug}</p>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (r) => <span className="text-xs text-gray-500">{r.description || '—'}</span>,
    },
    {
      key: 'sortOrder',
      header: 'Sort Order',
      render: (r) => <span className="text-xs font-bold text-gray-700">{r.sortOrder}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (r) => (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
          }`}
        >
          {r.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: '_id',
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEdit(r)}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-green-600"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteId(r._id)}
            className="rounded-lg p-1 text-gray-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Categories</h1>
          <p className="text-xs text-gray-500">Organize and group grocery items</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-xl bg-green-600 hover:bg-green-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <DataTable columns={columns} data={categories} isLoading={isLoading} />
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900">
                {editTarget ? 'Edit Category' : 'New Category'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit((v) => saveMut.mutate(v))} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Name *</label>
                <input type="text" placeholder="e.g. Dairy & Eggs" {...register('name')} className={inputCls} />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Short description..."
                  {...register('description')}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Sort Order</label>
                <input type="number" {...register('sortOrder')} className={inputCls} />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register('isActive')} className="rounded border-gray-300 text-green-600 focus:ring-green-600 h-4 w-4" />
                  <span className="text-xs font-bold text-gray-800">Active category</span>
                </label>
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
                  disabled={isSubmitting || saveMut.isPending}
                  className="rounded-xl bg-green-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-green-700 disabled:bg-gray-300"
                >
                  {saveMut.isPending ? 'Saving...' : 'Save Category'}
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
        title="Delete Category"
        message="Are you sure you want to delete this category?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
