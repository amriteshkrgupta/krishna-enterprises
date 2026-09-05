'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Clock, Banknote, User, Package,
  AlertCircle, CheckCircle, Smartphone, Image as ImageIcon,
  Copy, Check, ExternalLink, QrCode, Printer, MessageSquare,
} from 'lucide-react';
import { useOrder, useUpdateOrderStatus } from '@/hooks/useOrders';
import OrderStatusBadge from '@/components/ui/OrderStatusBadge';
import OrderTimeline from '@/components/ui/OrderTimeline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import InvoiceModal from '@/components/orders/InvoiceModal';
import { formatDate, formatPrice } from '@/lib/utils';
import { getWhatsAppShareUrl } from '@/lib/whatsapp';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['pending', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled'];

const SLOT_LABELS: Record<string, string> = {
  morning: 'Morning (9:00 AM - 1:00 PM)',
  afternoon: 'Afternoon (2:00 PM - 5:00 PM)',
  evening: 'Evening (4:00 PM - 8:00 PM)',
};

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, isError } = useOrder(params.id);
  const updateStatus = useUpdateOrderStatus();

  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [statusNote, setStatusNote] = useState('');
  const [copiedUtr, setCopiedUtr] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
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
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900">Order not found</h2>
        <Link href="/admin/orders" className="mt-4 inline-block text-xs font-bold text-green-600">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  const currentStatus = order.orderStatus;
  const currentSelected = selectedStatus || currentStatus;

  const handleStatusUpdate = () => {
    if (!selectedStatus || selectedStatus === currentStatus) {
      toast.error('Please select a different status to update');
      return;
    }
    const orderId = order._id || order.id;
    updateStatus.mutate(
      { id: orderId, status: selectedStatus, note: statusNote || undefined },
      {
        onSuccess: () => {
          toast.success(`Status updated to ${selectedStatus.toUpperCase()}`);
          setStatusNote('');
        },
      },
    );
  };

  const copyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(true);
    toast.success('UTR Copied!');
    setTimeout(() => setCopiedUtr(false), 2000);
  };

  const customerPhone = order.deliveryAddress?.phone || order.user?.phone;
  const waCustomerUrl = getWhatsAppShareUrl(order, customerPhone);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900 mb-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to All Orders
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-extrabold text-gray-900 font-mono">#{order.orderNumber}</h1>
            <OrderStatusBadge status={order.orderStatus} />
          </div>
          <p className="text-xs text-gray-400">Placed on {formatDate(order.createdAt)}</p>
        </div>

        {/* Quick Admin Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setInvoiceOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 shadow-xs hover:bg-gray-50 transition-colors"
          >
            <Printer className="h-3.5 w-3.5 text-gray-600" /> Print Bill
          </button>
          <a
            href={waCustomerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#20bd5a] transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" /> Send Receipt on WhatsApp
          </a>
        </div>
      </div>

      {/* Grid: Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Items & Tracking */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
              <Package className="h-4 w-4 text-green-600" /> Ordered Items ({order.items?.length || 0})
            </h3>
            <div className="divide-y divide-gray-100">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                      {item.image && !item.image.includes('placeholder.com') ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-base">🛒</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{item.name}</p>
                      <p className="text-gray-400">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                    </div>
                  </div>
                  <span className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span>{order.deliveryCharge === 0 ? <span className="text-green-600 font-bold">FREE</span> : formatPrice(order.deliveryCharge || 0)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 text-sm font-extrabold text-gray-900">
                <span>Total Amount Paid</span>
                <span className="text-green-700">{formatPrice(order.totalAmount || 0)}</span>
              </div>
            </div>
          </div>

          {/* Status Update Control */}
          <div className="rounded-2xl border border-green-200 bg-green-50/40 p-5 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-gray-900">Update Order Status</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={currentSelected}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="flex-1 rounded-xl border border-gray-300 bg-white p-2.5 text-xs font-bold text-gray-800 outline-none focus:border-green-600 capitalize"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st} className="capitalize">
                    {st.toUpperCase()}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Optional status note (e.g. Packed with bill)"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="flex-1 rounded-xl border border-gray-300 bg-white p-2.5 text-xs outline-none focus:border-green-600"
              />

              <button
                onClick={handleStatusUpdate}
                disabled={updateStatus.isPending}
                className="rounded-xl bg-green-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-xs hover:bg-green-700 transition-colors disabled:bg-gray-400 shrink-0"
              >
                {updateStatus.isPending ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Customer & Payment Details */}
        <div className="space-y-6">
          {/* Customer & Address */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-3 text-xs">
            <h3 className="font-extrabold text-gray-900 flex items-center gap-1.5">
              <User className="h-4 w-4 text-green-600" /> Customer &amp; Delivery
            </h3>
            <div>
              <p className="font-bold text-gray-800">{order.user?.name || 'Customer'}</p>
              <p className="text-gray-500">{order.user?.email}</p>
              <p className="text-green-800 font-bold mt-1">📞 {order.deliveryAddress?.phone}</p>
            </div>
            <div className="border-t border-gray-100 pt-2 space-y-0.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Address</span>
              <p className="text-gray-700">{order.deliveryAddress?.street}</p>
              <p className="text-gray-700">{order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}</p>
            </div>
            <div className="border-t border-gray-100 pt-2 space-y-0.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Delivery Slot</span>
              <p className="font-bold text-green-700">{SLOT_LABELS[order.deliverySlot] || order.deliverySlot}</p>
            </div>
          </div>

          {/* Payment Details & Screenshot */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-gray-900 flex items-center gap-1.5">
                <QrCode className="h-4 w-4 text-green-600" /> Payment Proof
              </h3>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-extrabold text-green-800">
                UPI QR
              </span>
            </div>

            {/* 12-Digit UTR Box */}
            <div className="rounded-xl bg-gray-50 p-3 border border-gray-200 space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase block">12-Digit UTR / Ref No</span>
              {order.upiTransactionId || order.transaction_id ? (
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-extrabold text-green-800">
                    {order.upiTransactionId || order.transaction_id}
                  </span>
                  <button
                    onClick={() => copyUtr(order.upiTransactionId || order.transaction_id)}
                    className="p-1 text-gray-400 hover:text-green-700"
                  >
                    {copiedUtr ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              ) : (
                <span className="text-gray-400 italic">No UTR entered by customer</span>
              )}
            </div>

            {/* Payment Screenshot Viewer */}
            <div className="rounded-xl bg-gray-50 p-3 border border-gray-200 space-y-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase block">Payment Screenshot</span>
              {order.paymentScreenshot ? (
                <div className="space-y-2">
                  <div
                    onClick={() => setShowScreenshotModal(true)}
                    className="relative cursor-pointer group rounded-lg overflow-hidden border border-gray-200 bg-black/5 max-h-36 flex items-center justify-center"
                  >
                    <img
                      src={order.paymentScreenshot}
                      alt="Payment Receipt"
                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    />
                    <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                      <ExternalLink className="h-4 w-4 mr-1" /> View Fullscreen
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-gray-400 italic">No screenshot uploaded</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      <InvoiceModal isOpen={invoiceOpen} onClose={() => setInvoiceOpen(false)} order={order} />

      {/* Screenshot Zoom Modal */}
      {showScreenshotModal && order.paymentScreenshot && (
        <div
          onClick={() => setShowScreenshotModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs cursor-pointer"
        >
          <div className="relative max-w-xl max-h-[90vh] bg-white rounded-2xl p-2 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-2 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-800">Payment Screenshot (Order #{order.orderNumber})</span>
              <button
                onClick={() => setShowScreenshotModal(false)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold px-2 py-1"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-2 overflow-auto max-h-[80vh] flex items-center justify-center">
              <img
                src={order.paymentScreenshot}
                alt="Full Payment Screenshot"
                className="rounded-lg max-h-full max-w-full object-contain shadow-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}