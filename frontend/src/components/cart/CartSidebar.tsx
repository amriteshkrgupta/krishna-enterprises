'use client';

import { useEffect, memo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useRemoveFromCart, useUpdateCartItem } from '@/hooks/useCart';
import { formatPrice, formatProductUnit } from '@/lib/utils';

function CartSidebarComponent() {
  // ⚡ REACT RULES OF HOOKS: All hooks MUST be called unconditionally at top of component!
  const pathname = usePathname();
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const token = useAuthStore((s) => s.token);

  const removeFromCartMut = useRemoveFromCart();
  const updateCartItemMut = useUpdateCartItem();

  const removeItemLocal = useCartStore((s) => s.removeItem);
  const updateQtyLocal = useCartStore((s) => s.updateQuantity);

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, pathname]);

  const handleRemove = useCallback(
    (productId: string) => {
      removeItemLocal(productId);
      if (token) {
        removeFromCartMut.mutate(productId);
      }
    },
    [removeItemLocal, token, removeFromCartMut]
  );

  const handleQty = useCallback(
    (productId: string, qty: number) => {
      updateQtyLocal(productId, qty);
      if (token) {
        updateCartItemMut.mutate({ productId, quantity: qty });
      }
    },
    [updateQtyLocal, token, updateCartItemMut]
  );

  // PRD-F1: Hide cart UI on admin routes AFTER all hooks have executed unconditionally
  if (pathname?.startsWith('/admin')) return null;

  const totalCount = items.reduce((s, i) => s + i.quantity, 0);
  const subtotalVal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-green-600" />
            Your Cart
            {totalCount > 0 && (
              <span className="ml-1 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                {totalCount}
              </span>
            )}
          </h2>
          <button
            onClick={closeCart}
            className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items List */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-gray-300">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <p className="font-bold text-gray-800 text-sm">Your cart is empty</p>
            <p className="text-xs text-gray-400 max-w-[200px]">Add some groceries to get started with fast home delivery</p>
            <button
              onClick={closeCart}
              className="mt-2 rounded-xl bg-green-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-green-700 transition-colors"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="flex-1 divide-y divide-gray-100 overflow-y-auto px-5">
            {items.map(({ product, quantity, price }) => {
              const pId = product._id || (product as any).id;
              return (
                <div key={pId} className="flex gap-3 py-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-50 border border-gray-100">
                    <img
                      src={product.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80'}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
                        {formatProductUnit(product.unit, product.name, product.description)} · Qty {quantity}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="font-extrabold text-xs text-gray-900">
                        {formatPrice(price * quantity)}
                      </span>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white p-0.5">
                        <button
                          onClick={() => handleQty(pId, quantity - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-100"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-gray-900">
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleQty(pId, quantity + 1)}
                          disabled={quantity >= (product.stock || 99)}
                          className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemove(pId)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Checkout */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50/70 p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Subtotal ({totalCount} items)</span>
              <span className="font-extrabold text-sm text-gray-900">{formatPrice(subtotalVal)}</span>
            </div>
            {subtotalVal >= 500 ? (
              <p className="text-[11px] font-bold text-green-700">✓ Free Delivery Unlocked!</p>
            ) : (
              <p className="text-[11px] font-bold text-orange-600">
                ₹{500 - Math.round(subtotalVal)} more for FREE delivery
              </p>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <Link
                href="/checkout"
                onClick={closeCart}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-3.5 text-xs font-bold text-white shadow-lg hover:bg-green-700 transition-all hover:scale-[1.01]"
              >
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/cart"
                onClick={closeCart}
                className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                View Full Cart
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

const CartSidebar = memo(CartSidebarComponent);
export default CartSidebar;
