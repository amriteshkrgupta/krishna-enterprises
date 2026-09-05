'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ShoppingBag, TrendingUp, DollarSign, Package, AlertTriangle, ArrowRight,
  Users, UserPlus, Sparkles,
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { Column } from '@/components/ui/DataTable';
import OrderStatusBadge from '@/components/ui/OrderStatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate, formatPrice } from '@/lib/utils';

function useDashboardStats() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const res = await apiGet<any>('/admin/dashboard');
      return res.stats || res.data || {};
    },
    refetchInterval: 30_000,
  });
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  const totalOrders = stats?.orders?.total ?? 0;
  const todayOrders = stats?.orders?.today ?? 0;
  const totalCustomers = stats?.customers?.total ?? 0;
  const todayCustomers = stats?.customers?.today ?? 0;
  const totalRevenue = stats?.revenue?.total ?? 0;
  const todayRevenue = stats?.revenue?.today ?? 0;
  const lowStockList = stats?.lowStockProducts ?? [];
  const recentOrders = stats?.recentOrders ?? [];

  const recentOrderCols: Column<Record<string, unknown>>[] = [
    {
      key: 'orderNumber',
      header: 'Order #',
      render: (row) => (
        <Link href={`/admin/orders/${row._id}`} className="font-mono font-bold text-green-700 hover:underline text-xs">
          #{row.orderNumber as string}
        </Link>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (row) => <span className="text-xs text-gray-500">{formatDate(row.createdAt as string)}</span>,
    },
    {
      key: 'orderStatus',
      header: 'Status',
      render: (row) => <OrderStatusBadge status={row.orderStatus as string} />,
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      render: (row) => <span className="font-bold text-sm text-gray-900">{formatPrice(row.totalAmount as number)}</span>,
    },
  ];

  const lowStockCols: Column<Record<string, unknown>>[] = [
    {
      key: 'name',
      header: 'Product',
      render: (row) => <span className="text-sm font-bold text-gray-800">{row.name as string}</span>,
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (row) => (
        <span className={`font-extrabold text-sm ${(row.stock as number) < 5 ? 'text-red-600' : 'text-orange-500'}`}>
          {row.stock as number}
        </span>
      ),
    },
    {
      key: 'unit',
      header: 'Unit',
      render: (row) => <span className="text-xs text-gray-400">{row.unit as string}</span>,
    },
    {
      key: '_id',
      header: '',
      render: (row) => (
        <Link href={`/admin/products/${row._id}/edit`} className="text-xs font-bold text-green-600 hover:underline">
          Edit
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Store Analytics & Overview</h1>
          <p className="text-xs text-gray-500 mt-0.5">Live store performance and customer activity in Sitamarhi</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/customers"
            className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Users className="h-4 w-4 text-blue-600" /> View Customers
          </Link>
          <Link
            href="/admin/products/new"
            className="rounded-xl bg-green-600 hover:bg-green-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors flex items-center gap-1.5"
          >
            + Add Product
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/customers" className="transition-transform hover:scale-[1.02]">
          <StatsCard
            title="Registered Customers"
            value={totalCustomers}
            icon={<Users className="h-5 w-5" />}
            color="blue"
          />
        </Link>
        <Link href="/admin/orders" className="transition-transform hover:scale-[1.02]">
          <StatsCard
            title="Total Orders"
            value={totalOrders}
            icon={<ShoppingBag className="h-5 w-5" />}
            color="orange"
          />
        </Link>
        <StatsCard
          title="Today's Orders"
          value={todayOrders}
          icon={<Package className="h-5 w-5" />}
          color="green"
        />
        <StatsCard
          title="Total Store Sales"
          value={formatPrice(totalRevenue)}
          icon={<DollarSign className="h-5 w-5" />}
          color="green"
        />
      </div>

      {/* Quick customer registration highlight */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/80 to-indigo-50/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <UserPlus className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-gray-900">
              {totalCustomers} Registered Customers ({todayCustomers} joined today)
            </p>
            <p className="text-xs text-gray-500">View customer contact details, phone numbers, and order histories.</p>
          </div>
        </div>
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-1 self-start sm:self-auto rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors"
        >
          Customer Directory <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Tables section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800">Recent Customer Orders</h2>
            <Link href="/admin/orders" className="text-xs font-bold text-green-600 hover:underline flex items-center gap-0.5">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <DataTable
            columns={recentOrderCols}
            data={recentOrders as Record<string, unknown>[]}
            emptyMessage="No customer orders received yet."
          />
        </div>

        {/* Low stock alerts */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <h2 className="text-sm font-bold text-gray-800">Low Stock Warnings</h2>
            </div>
            <Link href="/admin/inventory" className="text-xs font-bold text-green-600 hover:underline flex items-center gap-0.5">
              Manage inventory <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <DataTable
            columns={lowStockCols}
            data={lowStockList as Record<string, unknown>[]}
            emptyMessage="All items are well stocked! No low-stock items."
          />
        </div>
      </div>
    </div>
  );
}
