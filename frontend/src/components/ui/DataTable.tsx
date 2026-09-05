'use client';

import { ReactNode, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import LoadingSpinner from './LoadingSpinner';

export interface Column<T = any> {
  key: string;
  header: ReactNode | string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  keyField?: string;
}

export default function DataTable<T = any>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No data found.',
  keyField = '_id',
}: DataTableProps<T>) {
  const [sortKey, setSortKey]     = useState<string | null>(null);
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = (a as any)[sortKey] as string | number;
        const bv = (b as any)[sortKey] as string | number;
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      })
    : data;

  if (isLoading) {
    return (
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left font-semibold text-gray-600"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded bg-gray-200" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-100 bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left font-semibold text-gray-600',
                  col.sortable && 'cursor-pointer select-none hover:text-gray-900',
                  col.className,
                )}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <span className="text-gray-400">
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 opacity-30" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-16 text-center text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map((row, i) => (
              <tr
                key={String((row as any)[keyField] ?? i)}
                className="border-b border-gray-50 transition-colors hover:bg-gray-50/60"
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3 text-gray-700', col.className)}>
                    {col.render ? col.render(row) : String((row as any)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
