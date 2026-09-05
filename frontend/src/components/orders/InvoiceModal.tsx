'use client';

import React, { useRef, useEffect } from 'react';
import { Printer, X, Leaf, ArrowLeft, Download, ShieldCheck } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

const STORE_NAME = 'Krishna Enterprises';
const STORE_ADDRESS = 'Machhaha Chowk, Rupni, Madhuban, East Champaran, Bihar 845420';
const STORE_PHONE = '+91 72569 55630';
const STORE_EMAIL = 'support@krishnaenterprises.in';
const STORE_UPI = '7256955630@upi';

const SLOT_TITLES: Record<string, string> = {
  morning: 'Morning Slot (9:00 AM - 1:00 PM)',
  evening: 'Evening Slot (4:00 PM - 8:00 PM)',
};

export default function InvoiceModal({ isOpen, onClose, order }: InvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const transactionId = order.transaction_id || order.upiTransactionId || null;
  const isPaid = order.paymentStatus === 'paid' || Boolean(transactionId);

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      toast.error('Could not open print dialog. Use Download File.');
    }
  };

  const handleDownloadFile = () => {
    try {
      const itemsHtml = order.items
        ?.map(
          (it: any, i: number) => `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${i + 1}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #111827;">${it.name}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #4b5563;">${it.unit || '-'}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: bold;">${it.quantity}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${it.price.toFixed(2)}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #111827;">₹${(it.price * it.quantity).toFixed(2)}</td>
          </tr>`
        )
        .join('');

      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice #${order.orderNumber} - Krishna Enterprises</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1f2937; margin: 0; padding: 24px; background: #fff; line-height: 1.4; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #16a34a; padding-bottom: 16px; margin-bottom: 20px; }
    .store-name { font-size: 22px; font-weight: 900; color: #15803d; margin: 0; }
    .badge { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .grid { display: flex; gap: 20px; background: #f9fafb; padding: 14px; border-radius: 12px; border: 1px solid #f3f4f6; margin-bottom: 20px; }
    .col { flex: 1; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
    th { background: #f3f4f6; padding: 10px 12px; text-align: left; font-weight: 800; font-size: 11px; text-transform: uppercase; color: #374151; border-bottom: 2px solid #e5e7eb; }
    .totals { display: flex; justify-content: space-between; padding-top: 14px; border-top: 2px solid #e5e7eb; }
    .totals-box { min-width: 220px; font-size: 13px; }
    .total-row { display: flex; justify-content: space-between; padding: 4px 0; }
    .grand-total { border-top: 2px solid #111827; padding-top: 6px; font-size: 16px; font-weight: 900; color: #15803d; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="store-name">${STORE_NAME}</h1>
      <p style="margin: 4px 0; color: #4b5563; font-size: 12px;">${STORE_ADDRESS}</p>
      <p style="margin: 2px 0; color: #4b5563; font-size: 12px;">Phone: <b>${STORE_PHONE}</b> | Store UPI: <b>${STORE_UPI}</b></p>
    </div>
    <div style="text-align: right;">
      <span class="badge">Original Tax Invoice</span>
      <p style="font-size: 14px; font-weight: 900; margin: 8px 0 2px 0;">Order #${order.orderNumber}</p>
      <p style="font-size: 12px; color: #6b7280; margin: 0;">Date: ${formatDate(order.createdAt)}</p>
    </div>
  </div>

  <div class="grid">
    <div class="col">
      <b style="color: #6b7280; font-size: 10px; text-transform: uppercase; display: block; margin-bottom: 4px;">Delivered / Billed To:</b>
      <p style="margin: 0; font-weight: bold; font-size: 13px;">${order.deliveryAddress?.street}</p>
      <p style="margin: 2px 0; color: #4b5563;">${order.deliveryAddress?.city}, ${order.deliveryAddress?.state} - ${order.deliveryAddress?.pincode}</p>
      <p style="margin: 4px 0 0 0; color: #166534; font-weight: bold;">Contact: ${order.deliveryAddress?.phone}</p>
    </div>
    <div class="col">
      <b style="color: #6b7280; font-size: 10px; text-transform: uppercase; display: block; margin-bottom: 4px;">Payment & Delivery Information:</b>
      <p style="margin: 0;"><b>Payment Method:</b> UPI</p>
      <p style="margin: 2px 0;"><b>Payment Status:</b> <span style="color: #166534; font-weight: bold;">${isPaid ? 'Paid' : 'Pending'}</span></p>
      <p style="margin: 2px 0;"><b>Transaction ID:</b> <span style="font-family: monospace; font-weight: bold;">${transactionId || 'Not available'}</span></p>
      <p style="margin: 2px 0;"><b>UPI ID:</b> ${STORE_UPI}</p>
      <p style="margin: 2px 0;"><b>Delivery Slot:</b> ${SLOT_TITLES[order.deliverySlot] || order.deliverySlot}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 30px;">#</th>
        <th>Item Description</th>
        <th style="text-align: center; width: 60px;">Unit</th>
        <th style="text-align: center; width: 50px;">Qty</th>
        <th style="text-align: right; width: 80px;">Price</th>
        <th style="text-align: right; width: 90px;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="totals">
    <div style="font-size: 11px; color: #6b7280; max-width: 300px;">
      <p style="margin: 0 0 4px 0; font-weight: bold; color: #111827;">Terms & Conditions:</p>
      <p style="margin: 0;">• Fresh daily essentials verified before dispatch.</p>
      <p style="margin: 2px 0 0 0;">• For queries, contact +91 72569 55630.</p>
      <p style="margin: 8px 0 0 0; color: #15803d; font-weight: bold;">Thank you for shopping with Krishna Enterprises!</p>
    </div>
    <div class="totals-box">
      <div class="total-row"><span>Subtotal:</span><b>₹${(order.subtotal || 0).toFixed(2)}</b></div>
      <div class="total-row"><span>Delivery Charge:</span><b>${order.deliveryCharge === 0 ? 'FREE' : '₹' + (order.deliveryCharge || 0).toFixed(2)}</b></div>
      <div class="total-row grand-total"><span>Total Amount Paid:</span><span>₹${(order.totalAmount || 0).toFixed(2)}</span></div>
    </div>
  </div>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${order.orderNumber}_Krishna_Enterprises.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Invoice file downloaded! 📄');
    } catch {
      toast.error('Failed to download invoice file');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            height: auto;
            margin: 0;
            padding: 12mm;
            background: white !important;
            color: black !important;
            font-size: 11pt !important;
            page-break-inside: avoid;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}</style>

      <div
        className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Sticky Action Bar */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4 print:hidden">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-extrabold text-gray-700 hover:bg-gray-100 transition-colors shadow-xs"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600" />
            Back to Order
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadFile}
              className="inline-flex items-center gap-1.5 rounded-xl border border-green-600 bg-green-50 px-3.5 py-2 text-xs font-extrabold text-green-700 hover:bg-green-100 transition-colors"
            >
              <Download className="h-4 w-4" /> Download File
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-xs font-extrabold text-white shadow-md hover:bg-green-700 transition-colors"
            >
              <Printer className="h-4 w-4" /> Save as PDF (1 Page)
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Bill Area */}
        <div
          id="printable-invoice"
          ref={printRef}
          className="p-8 space-y-6 text-gray-800 text-xs bg-white max-h-[75vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-200 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white">
                  <Leaf className="h-5 w-5" />
                </div>
                <h1 className="text-xl font-extrabold text-gray-900">{STORE_NAME}</h1>
              </div>
              <p className="text-gray-500 font-medium">{STORE_ADDRESS}</p>
              <p className="text-gray-500">
                Phone: <span className="font-bold text-gray-800">{STORE_PHONE}</span> | Email: {STORE_EMAIL}
              </p>
              <p className="text-green-700 font-semibold">Store UPI: {STORE_UPI}</p>
            </div>

            <div className="sm:text-right space-y-1">
              <span className="inline-block rounded-md bg-green-100 px-2.5 py-1 text-[11px] font-extrabold text-green-900 uppercase tracking-wider">
                Original Tax Invoice
              </span>
              <p className="font-mono text-sm font-extrabold text-gray-900 pt-1">
                Order #{order.orderNumber}
              </p>
              <p className="text-gray-500">Date: {formatDate(order.createdAt)}</p>
              <p className="text-green-700 font-bold">Status: {order.orderStatus?.toUpperCase()}</p>
            </div>
          </div>

          {/* Customer & Delivery Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl bg-gray-50 p-4 border border-gray-100">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-1">
                Delivered / Billed To:
              </span>
              <p className="font-bold text-gray-900 text-sm">{order.deliveryAddress?.street}</p>
              <p className="text-gray-600">{order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}</p>
              <p className="font-bold text-gray-900 mt-1">Contact: {order.deliveryAddress?.phone}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-1">
                Payment &amp; Delivery Information:
              </span>
              <p><span className="text-gray-500">Payment Method:</span> <span className="font-bold text-gray-900">UPI</span></p>
              <p><span className="text-gray-500">Payment Status:</span> <span className="font-bold text-green-800">{isPaid ? 'Paid' : 'Pending'}</span></p>
              <p><span className="text-gray-500">Transaction ID:</span> <span className="font-mono font-bold text-gray-900">{transactionId || 'Not available'}</span></p>
              <p><span className="text-gray-500">UPI ID:</span> <span className="font-mono font-bold text-green-800">{STORE_UPI}</span></p>
              <p><span className="text-gray-500">Delivery Slot:</span> <span className="font-bold text-gray-800">{SLOT_TITLES[order.deliverySlot] || order.deliverySlot}</span></p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/80 border-b border-gray-200 text-[11px] font-extrabold text-gray-700 uppercase">
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">Item Description</th>
                  <th className="py-2.5 px-4 text-center">Unit</th>
                  <th className="py-2.5 px-4 text-center">Qty</th>
                  <th className="py-2.5 px-4 text-right">Price</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {order.items?.map((it: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-4 text-gray-400">{i + 1}</td>
                    <td className="py-2.5 px-4 font-bold text-gray-900">{it.name}</td>
                    <td className="py-2.5 px-4 text-center text-gray-500">{it.unit || '-'}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-gray-800">{it.quantity}</td>
                    <td className="py-2.5 px-4 text-right text-gray-600">{formatPrice(it.price)}</td>
                    <td className="py-2.5 px-4 text-right font-extrabold text-gray-900">
                      {formatPrice(it.price * it.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financials & Sign-off */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 border-t border-gray-200 pt-4">
            <div className="space-y-1 text-gray-500 text-[11px] max-w-xs">
              <p className="font-bold text-gray-800">Terms &amp; Conditions:</p>
              <p>• All fresh items verified before dispatch.</p>
              <p>• For queries or delivery issues, contact +91 72569 55630.</p>
              <p className="pt-2 text-green-700 font-bold">Thank you for choosing Krishna Enterprises!</p>
            </div>

            <div className="space-y-2 min-w-[220px]">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-bold text-gray-900">{formatPrice(order.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charge:</span>
                <span className="font-bold text-gray-900">
                  {order.deliveryCharge === 0 ? 'FREE' : formatPrice(order.deliveryCharge || 0)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-700 font-bold">
                  <span>Discount:</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-sm font-extrabold text-gray-900">
                <span>Total Amount Paid:</span>
                <span className="text-green-700 text-base">{formatPrice(order.totalAmount || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4 print:hidden">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-extrabold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Close / Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadFile}
              className="inline-flex items-center gap-1.5 rounded-xl border border-green-600 bg-green-50 px-3.5 py-2 text-xs font-extrabold text-green-700 hover:bg-green-100 transition-colors"
            >
              <Download className="h-4 w-4" /> Download File
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-green-700 transition-colors"
            >
              <Printer className="h-4 w-4" /> Save as PDF (1 Page)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}