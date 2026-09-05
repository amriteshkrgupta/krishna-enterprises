'use client';

import { cn, getStatusColor } from '@/lib/utils';

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
}

const labelMap: Record<string, string> = {
  pending:    'Pending',
  confirmed:  'Confirmed',
  packed:     'Packed',
  dispatched: 'Dispatched',
  delivered:  'Delivered',
  cancelled:  'Cancelled',
  paid:       'Paid',
  failed:     'Failed',
  refunded:   'Refunded',
};

export default function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize',
        getStatusColor(status),
        className,
      )}
    >
      {labelMap[status] ?? status}
    </span>
  );
}
