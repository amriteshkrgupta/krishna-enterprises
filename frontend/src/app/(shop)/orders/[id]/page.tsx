'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Clock, QrCode, AlertCircle,
  BadgeCheck, Printer, MessageSquare, Package, CheckCircle2, Phone, ExternalLink
} from 'lucide-react';
import { useOrder } from '@/hooks/useOrders';
import OrderTimeline from '@/components/ui/OrderTimeline';
import OrderStatusBadge from '@/components/ui/OrderStatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import InvoiceModal from '@/components/orders/InvoiceModal';
import { formatDate, formatPrice } from '@/lib/utils';
import { getWhatsAppShareUrl } from '@/lib/whatsapp';

const STORE_UPI_ID = '7256955630@upi';
const STORE_NAME = 'Krishna Enterprises';

function getDeliverySchedule(createdAtStr: string, slot: string) {
  if (!createdAtStr) return 'Tomorrow, 9:00 AM – 1:00 PM';
  const created = new Date(createdAtStr);
  const hour = created.getHours();

  if (slot === 'evening') {
    const day = hour >= 16 ? 'Tomorrow' : 'Today';
    return `${day}, 4:00 PM – 8:00 PM`;
  } else {
    const day = hour >= 9 ? 'Tomorrow' : 'Today';
    return `${day}, 9:00 AM – 1:00 PM`;
  }
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, isError } = useOrder(params.id);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const order = (data as any)?.order ?? (data as any)?.data ?? data;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (isError || !order || (!order._id && !order.id)) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Order not found</h2>
        <p className="mt-2 text-sm text-gray-500">We could not locate this order details.</p>
        <Link
          href="/orders"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-green-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to My Orders
        </Link>
      </div>
    );
  }

  const transactionId = order.transaction_id || order.upiTransactionId || null;
  const isPaid = order.paymentStatus === 'paid' || Boolean(transactionId);
  const waShareUrl = getWhatsAppShareUrl(order, order.deliveryAddress?.phone);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <Link href="/orders" className="inline-flex items-center gap-1.5 text-xs font-bold text-green-600 hover:underline mb-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Orders
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-extrabold text-gray-900 font-mono tracking-tight">Order #{order.orderNumber}</h1>
            <OrderStatusBadge status={order.orderStatus} />
          </div>
          <p className="text-xs text-gray-400 mt-1">Placed on {formatDate(order.createdAt)}</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setInvoiceOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-800 shadow-xs hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <Printer className="h-4 w-4 text-gray-600" />
            Invoice / Bill
          </button>
          <a
            href={waShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#20bd5a] transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            Share WhatsApp Receipt
          </a>
        </div>
      </div>

      {/* Order Status Tracking Card */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-600" /> Live Delivery Tracking
          </h2>
          <span className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-100">
            {getDeliverySchedule(order.createdAt, order.deliverySlot)}
          </span>
        </div>
        <OrderTimeline statusHistory={order.statusHistory || []} currentStatus={order.orderStatus} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Items Ordered */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
              <Package className="h-4 w-4 text-green-600" /> Items Ordered ({order.items?.length || 0})
            </h2>
            <span className="text-xs text-gray-400">Total Items: {order.items?.reduce((acc: number, i: any) => acc + (i.quantity || 1), 0)}</span>
          </div>

          <div className="divide-y divide-gray-100">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-green-50/50 border border-gray-100 flex items-center justify-center">
                    {item.image && !item.image.includes('placeholder.com') ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-lg">🛒</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Qty: <span className="font-bold text-gray-800">{item.quantity}</span> × {formatPrice(item.price)} {item.unit && `(${item.unit})`}
                    </p>
                  </div>
                </div>
                <span className="font-extrabold text-xs text-gray-900">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Pricing Breakdown Card */}
          <div className="border-t border-gray-100 pt-4 space-y-2 text-xs text-gray-600 bg-gray-50/60 p-4 rounded-2xl">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-900">{formatPrice(order.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charge</span>
              <span>
                {order.deliveryCharge === 0 ? (
                  <span className="font-extrabold text-green-600">FREE</span>
                ) : (
                  <span className="font-semibold text-gray-900">{formatPrice(order.deliveryCharge || 0)}</span>
                )}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between font-bold text-green-600">
                <span>Discount Applied ({order.couponCode})</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-3 text-sm font-extrabold text-gray-900">
              <span className="text-gray-900">Total Amount Paid</span>
              <span className="text-green-700 text-lg font-black">{formatPrice(order.totalAmount || 0)}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Delivery & Payment Cards */}
        <div className="space-y-6">
          {/* Delivery Address Card */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-3 text-xs">
            <h2 className="font-extrabold text-gray-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-gray-100 pb-2.5">
              <MapPin className="h-4 w-4 text-green-600" /> Delivery Address
            </h2>
            <p className="font-bold text-gray-900 text-sm">{order.deliveryAddress?.street}</p>
            <p className="text-gray-600">{order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}</p>
            <div className="flex items-center gap-1.5 pt-1 font-bold text-gray-900">
              <Phone className="h-3.5 w-3.5 text-green-600" />
              <span>Contact: {order.deliveryAddress?.phone}</span>
            </div>
          </div>

          {/* Delivery Schedule Card */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-2 text-xs">
            <h2 className="font-extrabold text-gray-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-gray-100 pb-2.5">
              <Clock className="h-4 w-4 text-green-600" /> Expected Delivery
            </h2>
            <p className="font-extrabold text-green-800 text-sm pt-1">
              {getDeliverySchedule(order.createdAt, order.deliverySlot)}
            </p>
            <p className="text-gray-500 text-[11px]">Express doorstep delivery across Madhuban</p>
          </div>

          {/* Payment Information Card */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-3 text-xs">
            <h2 className="font-extrabold text-gray-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-gray-100 pb-2.5">
              <QrCode className="h-4 w-4 text-green-600" /> Payment Details
            </h2>

            <div className="rounded-2xl bg-green-50/80 border border-green-200 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-green-200/60 pb-2">
                <span className="font-extrabold text-green-950 flex items-center gap-1.5">
                  💳 UPI Payment
                </span>
                <span className="rounded-full bg-green-600 text-white text-[10px] font-extrabold px-2.5 py-0.5">
                  {isPaid ? 'PAID' : 'PENDING'}
                </span>
              </div>

              <div className="space-y-1.5 pt-1 text-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Method:</span>
                  <span className="font-bold text-gray-900">UPI QR</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Status:</span>
                  <span className="font-bold text-green-800">{isPaid ? 'Paid' : 'Pending Verification'}</span>
                </div>
                {transactionId && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Transaction ID:</span>
                    <span className="font-mono font-extrabold text-gray-900">{transactionId}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Paid To:</span>
                  <span className="font-bold text-gray-900">{STORE_NAME}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Store UPI ID:</span>
                  <span className="font-mono font-bold text-green-800">{STORE_UPI_ID}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      <InvoiceModal isOpen={invoiceOpen} onClose={() => setInvoiceOpen(false)} order={order} />
    </div>
  );
}