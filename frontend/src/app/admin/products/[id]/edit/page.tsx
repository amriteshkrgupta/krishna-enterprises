'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiGet, apiPut } from '@/lib/api';
import { useCategories } from '@/hooks/useProducts';
import { ApiResponse, Product } from '@/types';
import ImageUpload from '@/components/admin/ImageUpload';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const schema = z.object({
  name:          z.string().min(2, 'Name required'),
  description:   z.string().optional(),
  category:      z.string().min(1, 'Category required'),
  price:         z.coerce.number().min(0),
  discountPrice: z.coerce.number().optional(),
  stock:         z.coerce.number().int().min(0),
  unit:          z.string().min(1),
  tags:          z.string().optional(),
  featured:      z.boolean().default(false),
  isActive:      z.boolean().default(true),
  images:        z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof schema>;

const inputCls = 'h-11 w-full rounded-xl border border-gray-300 px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100';

export default function EditProductPage() {
  const params   = useParams<{ id: string }>();
  const router   = useRouter();
  const qc       = useQueryClient();
  const { data: categories = [] } = useCategories();

  const { data: productData, isLoading } = useQuery({
    queryKey: ['admin', 'product', params.id],
    queryFn: () => apiGet<ApiResponse<Product>>(`/admin/products/${params.id}`),
    enabled: !!params.id,
  });

  const product = productData?.data;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true, featured: false, images: [] },
  });

  // Prefill form with existing product data
  useEffect(() => {
    if (product) {
      reset({
        name:          product.name,
        description:   product.description ?? '',
        category:      typeof product.category === 'string' ? product.category : (product.category as { _id: string })._id,
        price:         product.price,
        discountPrice: product.discountPrice,
        stock:         product.stock,
        unit:          product.unit,
        tags:          product.tags?.join(', ') ?? '',
        featured:      product.featured,
        isActive:      product.isActive,
        images:        product.images ?? [],
      });
    }
  }, [product, reset]);

  const updateMut = useMutation({
    mutationFn: (payload: FormValues) =>
      apiPut<ApiResponse<Product>>(`/admin/products/${params.id}`, {
        ...payload,
        tags: payload.tags ? payload.tags.split(',').map((t) => t.trim()) : [],
      }),
    onSuccess: () => {
      toast.success('Product updated!');
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      qc.invalidateQueries({ queryKey: ['product', product?.slug] });
      router.push('/admin/products');
    },
    onError: () => toast.error('Failed to update product'),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><LoadingSpinner size="xl" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-100">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-2xl font-extrabold text-gray-900">Edit Product</h1>
      </div>

      <form onSubmit={handleSubmit((v) => updateMut.mutate(v))} className="space-y-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-gray-900">Basic Info</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input {...register('name')} className={inputCls} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea {...register('description')} rows={3} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select {...register('category')} className={inputCls}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
              <input {...register('unit')} className={inputCls} />
              {errors.unit && <p className="mt-1 text-xs text-red-500">{errors.unit.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
              <input {...register('price')} type="number" step="0.01" className={inputCls} />
              {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Price</label>
              <input {...register('discountPrice')} type="number" step="0.01" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
              <input {...register('stock')} type="number" className={inputCls} />
              {errors.stock && <p className="mt-1 text-xs text-red-500">{errors.stock.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input {...register('tags')} placeholder="organic, fresh, popular" className={inputCls} />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input {...register('featured')} type="checkbox" className="h-4 w-4 rounded text-primary-600" />
              <span className="text-sm font-medium text-gray-700">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input {...register('isActive')} type="checkbox" className="h-4 w-4 rounded text-primary-600" />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-3">Product Images</h2>
          <Controller
            name="images"
            control={control}
            render={({ field }) => (
              <ImageUpload value={field.value} onChange={field.onChange} />
            )}
          />
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.push('/admin/products')} className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={updateMut.isPending} className="flex-1 rounded-xl bg-primary-600 py-2.5 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-60">
            {updateMut.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
