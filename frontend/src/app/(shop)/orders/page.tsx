'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Package, ChevronRight, ShoppingBag, Clock, MessageSquare, MapPin,
  RefreshCw, AlertCircle
} from 'lucide-react';
import { useMyOrders } from '@/hooks/useOrders';
import OrderStatusBadge from '@/components/ui/OrderStatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate, formatPrice } from '@/lib/utils';
import { getWhatsAppShareUrl } from '@/lib/whatsapp';

type FilterTab = 'all' | 'active' | 'delivered' | 'cancelled';

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All Orders' },
  { id: 'active', label: 'Active' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

const ACTIVE_STATUSES = ['pending', 'confirmed', 'packed', 'dispatched'];

function getDeliverySchedule(createdAtStr: string, slot: string) {
  if (!createdAtStr) return 'Delivery: Tomorrow, 9:00 AM – 1:00 PM';
  const created = new Date(createdAtStr);
  const hour = created.getHours();

  if (slot === 'evening') {
    const day = hour >= 16 ? 'Tomorrow' : 'Today';
    return `Delivery: ${day}, 4:00 PM – 8:00 PM`;
  } else {
    const day = hour >= 9 ? 'Tomorrow' : 'Today';
    return `Delivery: ${day}, 9:00 AM – 1:00 PM`;
  }
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [page, setPage] = useState(1);

  // PRD Section 3.A & 3.C: Real-time query status & manual refetch
  const { data, isLoading, isError, isFetching, refetch } = useMyOrders(page);
  const allOrders = (data as any)?.orders ?? (data as any)?.data ?? [];

  const filteredOrders = allOrders.filter((order: any) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return ACTIVE_STATUSES.includes(order.orderStatus);
    if (activeTab === 'delivered') return order.orderStatus === 'delivered';
    if (activeTab === 'cancelled') return order.orderStatus === 'cancelled';
    return true;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-gray-900">My Orders</h1>
            {/* PRD Section 3.C: Manual Refresh Orders Button & Sync Status */}
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Force sync latest orders from server"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 active:scale-95 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-green-700 ${isFetching ? 'animate-spin' : ''}`} />
              <span>{isFetching ? 'Syncing...' : 'Refresh Orders'}</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Track your past and ongoing grocery deliveries in real-time
          </p>
        </div>

        {/* Customer-Friendly Filter Tabs */}
        <div className="flex items-center gap-1.5 rounded-2xl bg-gray-100 p-1.5 self-start sm:self-auto shadow-inner">
          {FILTER_TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={`rounded-xl px-4 py-2 text-xs font-extrabold transition-all duration-200 ${
                  isSelected
                    ? 'bg-white text-green-700 shadow-sm scale-[1.02]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* PRD Section 3.C: Actionable Error & Retry State Handling */}
      {isError ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-red-100 bg-red-50/50 p-8 text-center shadow-xs space-y-3">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <h3 className="text-base font-extrabold text-red-900">Unable to load latest orders</h3>
          <p className="text-xs text-red-600 max-w-sm">
            We encountered a temporary connection issue while fetching your orders. Please tap below to retry.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-red-700 transition"
          >
            <RefreshCw className="h-4 w-4" /> Tap to Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white py-16 text-center shadow-sm">
          <Package className="h-16 w-16 text-gray-200 mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No {activeTab !== 'all' ? activeTab : ''} orders found</h3>
          <p className="mt-1 text-xs text-gray-500 max-w-xs">
            {activeTab === 'all'
              ? 'You have not placed any orders yet.'
              : activeTab === 'active'
              ? 'You have no active orders in transit.'
              : `No orders found in "${activeTab}" status.`}
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-green-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-green-700 transition-colors"
          >
            <ShoppingBag className="h-4 w-4" /> Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order: any) => {
            const orderId = order._id || order.id;
            const waUrl = getWhatsAppShareUrl(order, order.deliveryAddress?.phone);

            return (
              <div
                key={orderId}
                className="flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-xs hover:shadow-md transition-all sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-2.5 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-extrabold text-gray-900 text-base font-mono">Order #{order.orderNumber}</span>
                    <OrderStatusBadge status={order.orderStatus} />
                  </div>

                  <p className="text-xs text-gray-400">Placed on {formatDate(order.createdAt)}</p>

                  <div className="flex items-center gap-2 text-xs font-bold text-green-800 bg-green-50/70 rounded-xl px-3 py-1.5 w-fit border border-green-100">
                    <Clock className="h-3.5 w-3.5 text-green-600" />
                    <span>{getDeliverySchedule(order.createdAt, order.deliverySlot)}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-600 font-semibold">{order.items?.length || 0} item(s)</span>
                  </div>

                  {order.deliveryAddress?.street && (
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      <span>{order.deliveryAddress.street}, {order.deliveryAddress.city}</span>
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:items-end gap-3 border-t border-gray-100 pt-3 sm:border-0 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-gray-400 block font-medium uppercase tracking-wider">Total Amount Paid</span>
                    <span className="text-lg font-black text-green-700">{formatPrice(order.totalAmount)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/30 px-3.5 py-2 text-xs font-extrabold hover:bg-[#25D366]/20 transition-colors"
                      title="Share WhatsApp Receipt"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Receipt
                    </a>
                    <Link
                      href={`/orders/${orderId}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-green-700 transition-colors"
                    >
                      Track Order <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}