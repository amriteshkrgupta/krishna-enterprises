'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Eye, ShoppingBag, Download, FileSpreadsheet } from 'lucide-react';
import { useAdminOrders } from '@/hooks/useOrders';
import DataTable, { Column } from '@/components/ui/DataTable';
import OrderStatusBadge from '@/components/ui/OrderStatusBadge';
import { formatDate, formatPrice } from '@/lib/utils';
import { Order } from '@/types';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { id: '', label: 'All Orders' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'packed', label: 'Packed' },
  { id: 'dispatched', label: 'Dispatched' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function AdminOrdersPage() {
  const [activeStatus, setActiveStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminOrders({
    status: activeStatus || undefined,
    search: search || undefined,
    page,
    limit: 50,
  });

  const orders = (data as any)?.orders ?? (data as any)?.data ?? [];
  const totalCount = (data as any)?.total ?? orders.length;

  const exportToCSV = () => {
    if (orders.length === 0) {
      toast.error('No orders to export');
      return;
    }

    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Phone',
      'Street',
      'City',
      'Delivery Slot',
      'Payment Method',
      'Payment Status',
      'UTR',
      'Order Status',
      'Items Count',
      'Subtotal',
      'Delivery Fee',
      'Total Amount Paid',
    ];

    const rows = orders.map((o: any) => {
      const u = o.user as any;
      return [
        `"${o.orderNumber}"`,
        `"${new Date(o.createdAt).toLocaleString('en-IN')}"`,
        `"${u?.name || 'Customer'}"`,
        `"${o.deliveryAddress?.phone || u?.phone || ''}"`,
        `"${o.deliveryAddress?.street || ''}"`,
        `"${o.deliveryAddress?.city || 'Madhuban'}"`,
        `"${o.deliverySlot || 'morning'}"`,
        `"${o.paymentMethod || 'UPI_QR'}"`,
        `"${o.paymentStatus || 'paid'}"`,
        `"${o.upiTransactionId || ''}"`,
        `"${o.orderStatus || 'pending'}"`,
        o.items?.length || 0,
        o.subtotal || 0,
        o.deliveryCharge || 0,
        o.totalAmount || 0,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Krishna_Enterprises_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Orders exported to CSV! 📊');
  };

  const columns: Column<Order>[] = [
    {
      key: 'orderNumber',
      header: 'Order #',
      render: (r) => (
        <Link href={`/admin/orders/${r._id}`} className="font-mono font-bold text-xs text-green-700 hover:underline">
          #{r.orderNumber}
        </Link>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date & Time',
      sortable: true,
      render: (r) => <span className="text-xs text-gray-500">{formatDate(r.createdAt)}</span>,
    },
    {
      key: 'user',
      header: 'Customer',
      render: (r) => {
        const u = r.user as { name?: string; email?: string; phone?: string } | undefined;
        const phone = r.deliveryAddress?.phone || u?.phone;
        return (
          <div>
            <p className="text-xs font-bold text-gray-900">{u?.name || 'Customer'}</p>
            <p className="text-[10px] text-gray-400 font-mono">{phone || u?.email || '-'}</p>
          </div>
        );
      },
    },
    {
      key: 'items',
      header: 'Items',
      render: (r) => (
        <span className="text-xs font-semibold text-gray-700">
          {r.items?.length || 0} item{(r.items?.length || 0) !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Payment',
      render: (r) => (
        <div className="flex flex-col gap-0.5">
          <span className="inline-block rounded-md bg-orange-100 text-orange-800 px-2 py-0.5 text-[10px] font-extrabold">
            UPI QR
          </span>
          {r.upiTransactionId ? (
            <span className="font-mono text-[9px] text-green-700 font-bold">
              UTR: {r.upiTransactionId}
            </span>
          ) : (
            <span className="text-[9px] font-bold text-green-600">PAID</span>
          )}
        </div>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Total',
      sortable: true,
      render: (r) => <span className="font-extrabold text-xs text-gray-900">{formatPrice(r.totalAmount)}</span>,
    },
    {
      key: 'orderStatus',
      header: 'Status',
      render: (r) => <OrderStatusBadge status={r.orderStatus} />,
    },
    {
      key: '_id',
      header: 'Action',
      render: (r) => (
        <Link
          href={`/admin/orders/${r._id}`}
          className="inline-flex items-center gap-1 rounded-lg bg-gray-100 hover:bg-green-50 hover:text-green-700 px-2.5 py-1 text-xs font-bold text-gray-700 transition-colors"
        >
          <Eye className="h-3.5 w-3.5" /> View
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Customer Orders</h1>
          <p className="text-xs text-gray-500">Live order fulfillment, tracking and payment statuses ({totalCount} orders)</p>
        </div>

        <button
          onClick={exportToCSV}
          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-green-700 transition-colors self-start sm:self-auto"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export Orders (CSV)
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-gray-200 pb-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveStatus(tab.id);
              setPage(1);
            }}
            className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors ${
              activeStatus === tab.id
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search by Order # (e.g. KE-178...)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs font-medium focus:border-green-600 focus:outline-none shadow-sm"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={orders}
          isLoading={isLoading}
          emptyMessage="No customer orders found."
        />
      </div>
    </div>
  );
}
