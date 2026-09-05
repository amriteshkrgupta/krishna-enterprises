'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiPost } from '@/lib/api';
import { useCategories } from '@/hooks/useProducts';
import { ApiResponse, Product } from '@/types';
import ImageUpload from '@/components/admin/ImageUpload';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  price: z.coerce.number().min(0, 'Price must be >= 0'),
  discountPrice: z.coerce.number().optional(),
  stock: z.coerce.number().int().min(0),
  unit: z.string().min(1, 'Unit is required'),
  tags: z.string().optional(),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  images: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof schema>;

const inputCls =
  'h-11 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition';

export default function NewProductPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: categories = [] } = useCategories();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true, featured: false, images: [] },
  });

  const createMut = useMutation({
    mutationFn: (payload: FormValues) =>
      apiPost<any>('/products/admin', {
        ...payload,
        tags: payload.tags ? payload.tags.split(',').map((t) => t.trim()) : [],
      }),
    onSuccess: () => {
      toast.success('Product created successfully!');
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      router.push('/admin/products');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to create product';
      toast.error(msg);
    },
  });

  const onSubmit = (values: FormValues) => {
    createMut.mutate(values);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/products"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Add New Product</h1>
          <p className="text-xs text-gray-500">Create a new grocery item for your store</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Basic Information</h2>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Product Name *</label>
            <input type="text" placeholder="e.g. Aashirvaad Shudh Chakki Atta" {...register('name')} className={inputCls} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
              <select {...register('category')} className={inputCls}>
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Unit / Packaging *</label>
              <select {...register('unit')} className={inputCls}>
                <option value="kg">kg (Kilogram)</option>
                <option value="g">g (Gram)</option>
                <option value="L">L (Litre)</option>
                <option value="ml">ml (Millilitre)</option>
                <option value="piece">piece (Single Item)</option>
                <option value="pack">pack (Packet / Box)</option>
                <option value="dozen">dozen (12 pcs)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Product description, benefits, ingredients..."
              {...register('description')}
              className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition"
            />
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Pricing & Inventory</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Regular Price (₹) *</label>
              <input type="number" step="any" placeholder="299" {...register('price')} className={inputCls} />
              {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Discount Price (₹)</label>
              <input type="number" step="any" placeholder="275 (Optional)" {...register('discountPrice')} className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Stock Quantity *</label>
              <input type="number" placeholder="50" {...register('stock')} className={inputCls} />
              {errors.stock && <p className="mt-1 text-xs text-red-500">{errors.stock.message}</p>}
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Product Images</h2>
          <Controller
            name="images"
            control={control}
            render={({ field }) => (
              <ImageUpload value={field.value} onChange={field.onChange} />
            )}
          />
        </div>

        {/* Tags & Options */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Tags & Visibility</h2>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tags (comma-separated)</label>
            <input type="text" placeholder="atta, wheat, aashirvaad, flour" {...register('tags')} className={inputCls} />
          </div>

          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('featured')} className="rounded border-gray-300 text-green-600 focus:ring-green-600 h-4 w-4" />
              <span className="text-sm font-semibold text-gray-800">Feature on Homepage</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('isActive')} className="rounded border-gray-300 text-green-600 focus:ring-green-600 h-4 w-4" />
              <span className="text-sm font-semibold text-gray-800">Active (Visible to customers)</span>
            </label>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/products"
            className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || createMut.isPending}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-green-700 transition-colors disabled:bg-gray-300"
          >
            <Plus className="h-4 w-4" />
            {isSubmitting || createMut.isPending ? 'Saving...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
