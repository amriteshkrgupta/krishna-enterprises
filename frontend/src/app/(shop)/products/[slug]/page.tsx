'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Minus, Plus, ShoppingCart, Tag, Check, ArrowLeft, ShieldCheck, Truck } from 'lucide-react';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { useAddToCart } from '@/hooks/useCart';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { formatPrice, cn } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProductGrid from '@/components/products/ProductGrid';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  const { data: product, isLoading, isError } = useProduct(params.slug);

  const token = useAuthStore((s) => s.token);
  const addItemLocal = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const addToCart = useAddToCart();

  const categorySlug =
    product && typeof product.category !== 'string'
      ? (product.category as { slug: string })?.slug
      : '';

  const { data: relatedData } = useProducts({
    category: categorySlug,
    limit: 4,
  });
  const relatedProducts = (relatedData?.products ?? []).filter(
    (p: any) => p._id !== product?._id,
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
        <p className="mt-2 text-gray-500">The product you are looking for does not exist or has been removed.</p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-bold text-white shadow-md hover:bg-green-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>
      </div>
    );
  }

  const categoryName =
    typeof product.category !== 'string' ? product.category?.name : 'Groceries';

  const rawImages = (product.images || []).filter(
    (img: string) => img && !img.includes('via.placeholder.com'),
  );
  const images = rawImages.length > 0
    ? rawImages
    : ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'];

  const hasDiscount = Boolean(product.discountPrice && product.discountPrice < product.price);
  const currentPrice = hasDiscount ? (product.discountPrice as number) : product.price;

  const handleAddToCart = () => {
    if (!product.isInStock && product.stock <= 0) {
      toast.error('Product is out of stock');
      return;
    }

    // 1. Instantly update client cart
    addItemLocal({ product, quantity: qty, price: currentPrice });
    openCart();
    toast.success(`Added ${qty} item(s) to cart! 🛒`);

    // 2. Sync to server in background if logged in
    if (token) {
      addToCart.mutate({ productId: product._id, quantity: qty });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs font-semibold text-gray-500">
        <Link href="/" className="hover:text-green-600">Home</Link>
        <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
        <Link href="/products" className="hover:text-green-600">Products</Link>
        <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-gray-900 line-clamp-1">{product.name}</span>
      </nav>

      {/* Main product view */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Images */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            <img
              src={images[activeImg] || images[0]}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
              }}
            />
            {hasDiscount && (
              <span className="absolute left-4 top-4 rounded-xl bg-orange-500 px-3 py-1 text-xs font-extrabold text-white shadow-md">
                SAVE {Math.round(((product.price - (product.discountPrice || 0)) / product.price) * 100)}%
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImg(idx)}
                  className={cn(
                    'h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all',
                    activeImg === idx ? 'border-green-600 ring-2 ring-green-600/20' : 'border-gray-200 hover:border-gray-300',
                  )}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex flex-col space-y-6">
          <div>
            <span className="inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-green-700 mb-2">
              {categoryName}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
              {product.name}
            </h1>
            <p className="mt-1 text-xs text-gray-400 font-medium">Unit: {product.unit || 'unit'}</p>
          </div>

          {/* Pricing */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-gray-900">{formatPrice(currentPrice)}</span>
              {hasDiscount && (
                <span className="text-base text-gray-400 line-through font-medium">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">Inclusive of all local taxes · Free delivery on orders above ₹500</p>
          </div>

          {/* Stock badge */}
          <div>
            {product.stock > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                <Check className="h-3.5 w-3.5" /> In Stock ({product.stock} available in Madhuban)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
                Out of Stock
              </span>
            )}
          </div>

          {/* Quantity selector & Add to cart */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <div className="flex items-center rounded-2xl border border-gray-300 bg-white p-1 self-start">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center font-extrabold text-sm text-gray-900">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                disabled={qty >= product.stock}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-green-600 hover:bg-green-700 py-3.5 px-6 font-extrabold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:bg-gray-300"
            >
              <ShoppingCart className="h-5 w-5" />
              {product.stock <= 0 ? 'Out of Stock' : `Add ${qty} to Cart (${formatPrice(currentPrice * qty)})`}
            </button>
          </div>

          {/* Description */}
          {product.description && (
            <div className="border-t border-gray-100 pt-6 space-y-2">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">About This Product</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Delivery & Trust highlights */}
          <div className="border-t border-gray-100 pt-6 grid grid-cols-2 gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-green-600 shrink-0" />
              <span>Fast Home Delivery across Madhuban &amp; East Champaran</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />
              <span>100% Genuine Quality Checked Staples</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 border-t border-gray-100 pt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Related Grocery Items</h2>
          <ProductGrid products={relatedProducts} />
        </div>
      )}
    </div>
  );
}
