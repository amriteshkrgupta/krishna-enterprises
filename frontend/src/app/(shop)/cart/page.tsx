'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, Tag, ArrowRight, ShieldCheck, Truck, QrCode } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useRemoveFromCart, useUpdateCartItem } from '@/hooks/useCart';
import { formatPrice, formatProductUnit } from '@/lib/utils';
import { apiPost } from '@/lib/api';
import toast from 'react-hot-toast';

const FREE_DELIVERY_THRESHOLD = 500;
const DELIVERY_CHARGE = 50;

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const token = useAuthStore((s) => s.token);

  const removeItemLocal = useCartStore((s) => s.removeItem);
  const updateQtyLocal = useCartStore((s) => s.updateQuantity);

  const removeFromCartMut = useRemoveFromCart();
  const updateCartItemMut = useUpdateCartItem();

  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const handleRemove = (productId: string) => {
    removeItemLocal(productId);
    if (token) {
      removeFromCartMut.mutate(productId);
    }
  };

  const handleQty = (productId: string, qty: number) => {
    updateQtyLocal(productId, qty);
    if (token) {
      updateCartItemMut.mutate({ productId, quantity: qty });
    }
  };

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponLoading(true);
    try {
      const res = await apiPost<any>('/offers/validate', {
        code: coupon,
        amount: subtotal(),
      });
      const disc = res.discount || res.data?.discount || 0;
      if (res.success && disc > 0) {
        setDiscount(disc);
        setCouponApplied(coupon);
        toast.success(`Coupon applied! You save ${formatPrice(disc)}`);
      } else {
        toast.error(res.message || 'Invalid coupon code');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid or expired coupon code';
      toast.error(msg);
    } finally {
      setCouponLoading(false);
    }
  };

  const sub = subtotal();
  const delivery = sub >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  const total = Math.max(0, sub - discount + delivery);
  const totalCount = items.reduce((s, i) => s + i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center gap-4 text-center px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-100 text-gray-400">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Your Shopping Cart is Empty</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          Browse our fresh groceries and daily staples to start shopping with fast home delivery in Madhuban.
        </p>
        <Link
          href="/products"
          className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-green-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-green-700 transition-all hover:scale-105"
        >
          Browse All Products <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6">
        Shopping Cart ({totalCount} items)
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Items Table */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="divide-y divide-gray-100">
            {items.map(({ product, quantity, price }) => (
              <div key={product._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gray-50 border border-gray-100">
                    <img
                      src={product.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80'}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <Link
                      href={`/products/${product.slug}`}
                      className="text-sm font-bold text-gray-900 hover:text-green-700 transition-colors line-clamp-1"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">
                      {formatProductUnit(product.unit, product.name, product.description)} · {formatPrice(price)} each
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                  {/* Quantity */}
                  <div className="flex items-center rounded-xl border border-gray-200 bg-white p-1">
                    <button
                      onClick={() => handleQty(product._id, quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-gray-900">{quantity}</span>
                    <button
                      onClick={() => handleQty(product._id, quantity + 1)}
                      disabled={quantity >= product.stock}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <span className="font-extrabold text-sm text-gray-900 sm:w-24 text-right">
                    {formatPrice(price * quantity)}
                  </span>

                  <button
                    onClick={() => handleRemove(product._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
            <Link
              href="/products"
              className="text-xs font-bold text-green-700 hover:underline inline-flex items-center gap-1"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary & Coupon Panel */}
        <div className="space-y-6">
          {/* Coupon */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-orange-500" /> Apply Promo Code
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. KRISHNA10"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-mono font-bold uppercase text-gray-900 outline-none focus:border-green-600"
              />
              <button
                onClick={applyCoupon}
                disabled={couponLoading || !coupon.trim()}
                className="rounded-xl bg-gray-900 hover:bg-black px-4 py-2.5 text-xs font-bold text-white shadow-sm disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
              >
                {couponLoading ? '...' : 'Apply'}
              </button>
            </div>
            {couponApplied && (
              <p className="text-xs font-bold text-green-600">✓ Promo &quot;{couponApplied}&quot; active!</p>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Order Summary</h2>

            <div className="space-y-2.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal ({totalCount} items)</span>
                <span className="font-bold text-gray-900">{formatPrice(sub)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span>
                  {delivery === 0 ? (
                    <span className="font-bold text-green-600">FREE</span>
                  ) : (
                    <span className="font-bold text-gray-900">{formatPrice(delivery)}</span>
                  )}
                </span>
              </div>
              {sub < FREE_DELIVERY_THRESHOLD ? (
                <div className="rounded-xl bg-orange-50 p-2 text-center text-xs font-bold text-orange-700 border border-orange-200/60">
                  ₹{FREE_DELIVERY_THRESHOLD - Math.round(sub)} more for FREE delivery
                </div>
              ) : (
                <div className="rounded-xl bg-green-50 p-2 text-center text-xs font-bold text-green-700 border border-green-200/60">
                  🎉 You unlocked FREE Delivery!
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between font-bold text-green-600">
                  <span>Coupon Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-extrabold text-gray-900">
                <span>Total Amount</span>
                <span className="text-green-700 text-lg">{formatPrice(total)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-3.5 text-sm font-extrabold text-white shadow-xl hover:bg-green-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </Link>

            {/* Delivery note */}
            <div className="rounded-xl bg-gray-50 p-3 text-[11px] text-gray-500 space-y-1">
              <p className="flex items-center gap-1.5 text-gray-700 font-bold">
                <Truck className="h-3.5 w-3.5 text-green-600" /> Free Delivery over ₹500
              </p>
              <p className="flex items-center gap-1.5">
                <QrCode className="h-3.5 w-3.5 text-green-600" /> Instant UPI QR Payment accepted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
