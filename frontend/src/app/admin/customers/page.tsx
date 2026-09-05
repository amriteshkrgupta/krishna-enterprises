'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Search, Phone, Mail, ShoppingBag, Calendar,
  ArrowUpDown, ExternalLink, ShieldCheck, UserCheck, MessageSquare,
  History, X, Eye, MapPin, Clock, CreditCard
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import DataTable, { Column } from '@/components/ui/DataTable';
import { formatDate, formatPrice } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface CustomerRecord {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  addresses?: Array<{
    street: string;
    city: string;
    state: string;
    pincode: string;
  }>;
}

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'customers', search, page],
    queryFn: async () => {
      const res = await apiGet<any>('/admin/dashboard/customers', { search: search || undefined, page, limit: 20 });
      return {
        customers: (res.customers || []) as CustomerRecord[],
        total: res.total || 0,
        pages: res.pages || 1,
      };
    },
    refetchInterval: 30_000,
  });

  // Query single customer details & order history
  const { data: customerHistoryData, isLoading: historyLoading } = useQuery({
    queryKey: ['admin', 'customerHistory', selectedCustomerId],
    queryFn: async () => {
      if (!selectedCustomerId) return null;
      const res = await apiGet<any>(`/admin/dashboard/customers/${selectedCustomerId}`);
      return res;
    },
    enabled: Boolean(selectedCustomerId),
  });

  const customers = data?.customers || [];
  const totalCount = data?.total || 0;

  const columns: Column<CustomerRecord>[] = [
    {
      key: 'name',
      header: 'Customer',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-extrabold text-blue-700 text-xs shadow-xs">
            {r.name ? r.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <p className="font-bold text-xs text-gray-900 leading-tight">{r.name}</p>
            <p className="text-[10px] text-gray-400 font-mono">{r.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone / Contact',
      render: (r) => {
        const cleanPhone = r.phone?.replace(/[^0-9]/g, '') || '';
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-gray-800">{r.phone || '—'}</span>
            {r.phone && (
              <div className="flex items-center gap-1">
                <a
                  href={`tel:${r.phone}`}
                  title="Call Customer"
                  className="rounded-md bg-green-50 p-1 text-green-700 hover:bg-green-100 transition-colors"
                >
                  <Phone className="h-3 w-3" />
                </a>
                <a
                  href={`https://wa.me/91${cleanPhone.slice(-10)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Chat on WhatsApp"
                  className="rounded-md bg-emerald-50 p-1 text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  <MessageSquare className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Registered Date',
      render: (r) => <span className="text-xs text-gray-500">{formatDate(r.createdAt)}</span>,
    },
    {
      key: 'orderCount',
      header: 'Total Orders',
      render: (r) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
            r.orderCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
          }`}
        >
          <ShoppingBag className="h-3 w-3" />
          {r.orderCount} order{r.orderCount !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      key: 'totalSpent',
      header: 'Total Spend',
      render: (r) => (
        <span className="font-extrabold text-xs text-gray-900">
          {formatPrice(r.totalSpent || 0)}
        </span>
      ),
    },
    {
      key: '_id',
      header: 'Actions / History',
      render: (r) => (
        <button
          type="button"
          onClick={() => setSelectedCustomerId(r._id)}
          className="inline-flex items-center gap-1 rounded-xl bg-blue-50 hover:bg-blue-100 px-3 py-1.5 text-xs font-extrabold text-blue-700 transition shadow-2xs"
        >
          <History className="h-3.5 w-3.5" /> View History
        </button>
      ),
    },
  ];

  const currentCustomer = customerHistoryData?.customer;
  const customerOrders = customerHistoryData?.orders || [];
  const customerSummary = customerHistoryData?.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-gray-900">Registered Customers</h1>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-extrabold text-blue-800">
              {totalCount} Total
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            View customer contact list, phone numbers, and complete order history
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by customer name, phone number, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-xs font-medium focus:border-blue-600 focus:outline-none shadow-xs"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={customers}
          isLoading={isLoading}
          emptyMessage={
            search ? 'No registered customers found matching your search.' : 'No registered customers found yet.'
          }
        />
      </div>

      {/* =================================================================== */}
      {/* CUSTOMER ORDER HISTORY MODAL / DRAWER                               */}
      {/* =================================================================== */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={() => setSelectedCustomerId(null)} />

          <div className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl z-10 animate-in slide-in-from-right duration-250">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <History className="h-5 w-5 text-blue-600" /> Customer Order History
                </h2>
                <p className="text-xs text-gray-400">View complete past orders &amp; customer details</p>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {historyLoading ? (
                <div className="flex justify-center py-20">
                  <LoadingSpinner size="lg" />
                </div>
              ) : !currentCustomer ? (
                <div className="text-center py-16 text-gray-400 text-xs font-bold">
                  Customer record not found.
                </div>
              ) : (
                <>
                  {/* Customer Card */}
                  <div className="rounded-3xl border border-blue-100 bg-blue-50/40 p-5 space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 font-extrabold text-white text-base shadow-sm">
                          {currentCustomer.name ? currentCustomer.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-gray-900">{currentCustomer.name}</h3>
                          <p className="text-xs text-gray-500 font-mono">{currentCustomer.email}</p>
                          <span className="text-[10px] text-blue-800 font-bold">Joined {formatDate(currentCustomer.createdAt)}</span>
                        </div>
                      </div>

                      {currentCustomer.phone && (
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${currentCustomer.phone}`}
                            className="flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-2xs border border-gray-200 hover:bg-gray-50"
                          >
                            <Phone className="h-3.5 w-3.5 text-green-600" /> Call
                          </a>
                          <a
                            href={`https://wa.me/91${currentCustomer.phone.replace(/[^0-9]/g, '').slice(-10)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded-xl bg-[#25D366] text-white px-3 py-1.5 text-xs font-bold shadow-2xs hover:bg-[#20bd5a]"
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Stats summary */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-blue-100 text-xs">
                      <div className="rounded-xl bg-white p-3 border border-blue-100 shadow-2xs">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Orders</span>
                        <span className="text-base font-black text-gray-900">{customerSummary?.orderCount || 0} Orders</span>
                      </div>
                      <div className="rounded-xl bg-white p-3 border border-blue-100 shadow-2xs">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Spent</span>
                        <span className="text-base font-black text-green-700">{formatPrice(customerSummary?.totalSpent || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Orders List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                        <ShoppingBag className="h-4 w-4 text-green-600" /> Past Orders ({customerOrders.length})
                      </h4>
                    </div>

                    {customerOrders.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-xs text-gray-400">
                        No orders placed by this customer yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {customerOrders.map((ord: any) => {
                          const orderId = ord._id || ord.id;
                          const statusColor =
                            ord.orderStatus === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : ord.orderStatus === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-orange-100 text-orange-800';

                          return (
                            <div
                              key={orderId}
                              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs space-y-3 hover:border-blue-200 transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-mono text-xs font-black text-blue-700">#{ord.orderNumber}</span>
                                  <span className="text-[10px] text-gray-400 block mt-0.5">{formatDate(ord.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold capitalize ${statusColor}`}>
                                    {ord.orderStatus}
                                  </span>
                                  <Link
                                    href={`/admin/orders/${orderId}`}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white transition"
                                    title="View Full Order Details"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Link>
                                </div>
                              </div>

                              {/* Items summary */}
                              <div className="rounded-xl bg-gray-50 p-2.5 text-xs text-gray-700 space-y-1 border border-gray-100">
                                {ord.items?.map((it: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center text-[11px]">
                                    <span className="font-bold text-gray-900 truncate max-w-[220px]">
                                      {it.name} <span className="text-gray-400 font-normal">x{it.quantity}</span>
                                    </span>
                                    <span className="font-extrabold text-gray-800">{formatPrice(it.price * it.quantity)}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Order metadata & UTR */}
                              <div className="flex items-center justify-between text-[11px] pt-1">
                                <div className="space-y-0.5 text-gray-500">
                                  <p className="flex items-center gap-1 font-medium">
                                    <Clock className="h-3 w-3 text-gray-400" /> {ord.deliverySlot === 'morning' ? 'Morning Slot (9 AM - 1 PM)' : 'Evening Slot (4 PM - 8 PM)'}
                                  </p>
                                  {(ord.transaction_id || ord.upiTransactionId) && (
                                    <p className="font-mono text-green-800 font-bold">
                                      UTR: {ord.transaction_id || ord.upiTransactionId}
                                    </p>
                                  )}
                                </div>

                                <div className="text-right">
                                  <span className="text-[10px] text-gray-400 block">Total Paid</span>
                                  <span className="text-sm font-black text-green-700">{formatPrice(ord.totalAmount)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
