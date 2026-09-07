'use client';

import { memo, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Minus } from 'lucide-react';
import { Product } from '@/types';
import { cn, formatPrice, formatProductUnit } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useAddToCart } from '@/hooks/useCart';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

function ProductCardComponent({ product }: ProductCardProps) {
  const token = useAuthStore((s) => s.token);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const addToCartMut = useAddToCart();

  const pId = product._id;

  // ⚡ INP OPTIMIZATION: Targeted primitive number selector!
  // Prevents re-rendering when other items in cart change.
  const inCartQty = useCartStore(
    useCallback(
      (state) => {
        const item = state.items.find(
          (i) => i.product._id === pId || (i.product as any).id === pId
        );
        return item?.quantity || 0;
      },
      [pId]
    )
  );

  const categoryName =
    typeof product.category === 'string'
      ? ''
      : (product.category as { name: string })?.name;

  const discountPct =
    product.discountPrice && product.price > 0
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : product.discount;

  const displayPrice = product.discountPrice ?? product.price;
  const isOutOfStock = !product.isInStock || product.stock === 0;

  const handleAddToCart = useCallback(() => {
    if (isOutOfStock) return;

    addItem({ product, quantity: 1, price: displayPrice });
    toast.success(`Added ${product.name}! 🛒`);

    if (token) {
      addToCartMut.mutate({ productId: product._id, quantity: 1 });
    }
  }, [isOutOfStock, addItem, product, displayPrice, token, addToCartMut]);

  const handleDecrease = useCallback(() => {
    if (inCartQty === 1) removeItem(pId);
    else updateQuantity(pId, inCartQty - 1);
  }, [inCartQty, removeItem, updateQuantity, pId]);

  const handleIncrease = useCallback(() => {
    if (inCartQty >= (product.stock || 99)) {
      toast.error(`Only ${product.stock} units available`);
      return;
    }
    updateQuantity(pId, inCartQty + 1);
  }, [inCartQty, product.stock, updateQuantity, pId]);

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-3 shadow-2xs transition-all hover:-translate-y-1 hover:border-green-200 hover:shadow-md">
      {/* Discount badge */}
      {discountPct && discountPct > 0 ? (
        <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
          -{discountPct}%
        </span>
      ) : null}

      <div>
        {/* Product Image Container */}
        <Link href={`/products/${product.slug}`} className="relative block overflow-hidden rounded-xl bg-gray-50/60 mb-2.5">
          <div className="relative h-36 sm:h-40 w-full flex items-center justify-center">
            {product.images?.[0] && !product.images[0].includes('placeholder.com') ? (
              <img
                src={product.images[0]}
                alt={product.name}
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                className={cn(
                  'h-full w-full object-cover transition-transform duration-300 group-hover:scale-105',
                  isOutOfStock && 'opacity-60 grayscale',
                )}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80';
                }}
              />
            ) : (
              <span className="text-4xl">🛒</span>
            )}
          </div>
        </Link>

        {/* Details */}
        <div className="space-y-1">
          {categoryName && (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-green-700 block">
              {categoryName}
            </span>
          )}

          <Link href={`/products/${product.slug}`}>
            <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 leading-snug line-clamp-2 hover:text-green-700 transition-colors">
              {product.name}
            </h3>
          </Link>

          <p className="text-[11px] text-gray-400 font-medium">
            {formatProductUnit(product.unit, product.name, product.description)}
          </p>

          {/* Price */}
          <div className="flex items-baseline gap-1.5 pt-0.5">
            <span className="text-sm sm:text-base font-black text-gray-900">
              {formatPrice(displayPrice)}
            </span>
            {product.discountPrice && product.price !== product.discountPrice && (
              <span className="text-[11px] text-gray-400 line-through font-medium">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Area: Direct Quantity Controls on Product Card */}
      <div className="mt-3 pt-2 border-t border-gray-100">
        {isOutOfStock ? (
          <span className="block w-full text-center rounded-xl bg-gray-100 py-2 text-[11px] font-bold text-gray-400">
            Out of Stock
          </span>
        ) : inCartQty > 0 ? (
          <div className="flex items-center justify-between rounded-xl bg-green-50 border border-green-200 p-1 shadow-2xs">
            <button
              type="button"
              onClick={handleDecrease}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-green-700 shadow-xs hover:bg-green-100 transition"
              title="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5 stroke-[3]" />
            </button>
            <span className="font-extrabold text-xs text-green-950 px-2">{inCartQty}</span>
            <button
              type="button"
              onClick={handleIncrease}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-600 text-white shadow-xs hover:bg-green-700 transition"
              title="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-green-600 hover:bg-green-700 py-2 text-xs font-black text-white shadow-xs transition-transform active:scale-95"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>ADD</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ⚡ INP OPTIMIZATION: Memoize ProductCard by ID so prop reference checks are fast
const ProductCard = memo(ProductCardComponent, (prev, next) => {
  return (
    prev.product._id === next.product._id &&
    prev.product.price === next.product.price &&
    prev.product.discountPrice === next.product.discountPrice &&
    prev.product.stock === next.product.stock
  );
});

export default ProductCard;
