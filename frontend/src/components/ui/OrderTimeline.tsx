'use client';

import { cn, formatDate } from '@/lib/utils';
import { CheckCircle2, Circle, Clock, PackageCheck, Truck, Home, XCircle } from 'lucide-react';

const ORDER_STEPS = [
  { key: 'pending',    label: 'Order Placed', icon: Clock },
  { key: 'confirmed',  label: 'Confirmed',    icon: CheckCircle2 },
  { key: 'packed',     label: 'Packed',       icon: PackageCheck },
  { key: 'dispatched', label: 'Dispatched',   icon: Truck },
  { key: 'delivered',  label: 'Delivered',    icon: Home },
];

interface HistoryEntry {
  status: string;
  timestamp: string;
  note?: string;
}

interface OrderTimelineProps {
  statusHistory: HistoryEntry[];
  currentStatus: string;
}

export default function OrderTimeline({ statusHistory = [], currentStatus }: OrderTimelineProps) {
  const isCancelled = currentStatus === 'cancelled';

  const historyMap = Object.fromEntries(
    statusHistory.map((h) => [h.status, h])
  );

  const steps = isCancelled
    ? [
        ...ORDER_STEPS.slice(0, 1),
        { key: 'cancelled', label: 'Cancelled', icon: XCircle },
      ]
    : ORDER_STEPS;

  const currentIdx = steps.findIndex((s) => s.key === currentStatus);

  return (
    <div className="w-full py-2">
      {/* Horizontal timeline for medium/large screens */}
      <div className="hidden md:flex items-center justify-between relative">
        {/* Background track line */}
        <div className="absolute top-5 left-8 right-8 h-1 bg-gray-100 -z-0" />
        {/* Active progress bar */}
        <div
          className={cn(
            'absolute top-5 left-8 h-1 transition-all duration-500 -z-0',
            isCancelled ? 'bg-red-500' : 'bg-green-600'
          )}
          style={{
            width: isCancelled
              ? '100%'
              : `${(Math.max(0, currentIdx) / (steps.length - 1)) * 100}%`,
          }}
        />

        {steps.map((step, idx) => {
          const entry = historyMap[step.key];
          const isDone = idx <= currentIdx || step.key === currentStatus;
          const isCurrent = step.key === currentStatus;
          const IconComponent = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center text-center z-10 px-2 flex-1">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-white transition-all shadow-xs',
                  isCurrent && step.key !== 'cancelled'
                    ? 'border-green-600 bg-green-50 text-green-700 ring-4 ring-green-100 scale-110'
                    : isDone && !isCancelled
                    ? 'border-green-600 bg-green-600 text-white'
                    : step.key === 'cancelled'
                    ? 'border-red-500 bg-red-500 text-white'
                    : 'border-gray-200 text-gray-300'
                )}
              >
                <IconComponent className="h-5 w-5" />
              </div>
              <p
                className={cn(
                  'mt-2.5 text-xs font-bold leading-tight',
                  isCurrent
                    ? 'text-green-700 font-extrabold'
                    : isDone
                    ? 'text-gray-900'
                    : 'text-gray-400'
                )}
              >
                {step.label}
              </p>
              {entry?.timestamp && (
                <p className="mt-1 text-[10px] text-gray-400 font-medium">
                  {formatDate(entry.timestamp)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Vertical list for mobile */}
      <ol className="md:hidden relative space-y-0 pl-2">
        {steps.map((step, idx) => {
          const entry = historyMap[step.key];
          const isDone = idx <= currentIdx || step.key === currentStatus;
          const isCurrent = step.key === currentStatus;
          const IconComponent = step.icon;

          return (
            <li key={step.key} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                    isCurrent && step.key !== 'cancelled'
                      ? 'border-green-600 bg-green-50 text-green-700 ring-2 ring-green-100'
                      : isDone && !isCancelled
                      ? 'border-green-600 bg-green-600 text-white'
                      : step.key === 'cancelled'
                      ? 'border-red-500 bg-red-500 text-white'
                      : 'border-gray-200 bg-white text-gray-300'
                  )}
                >
                  <IconComponent className="h-4 w-4" />
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-0.5 flex-1 my-1',
                      isDone && idx < currentIdx ? 'bg-green-600' : 'bg-gray-200'
                    )}
                    style={{ minHeight: 28 }}
                  />
                )}
              </div>

              <div className="pb-6 flex-1">
                <p
                  className={cn(
                    'font-bold text-xs',
                    isCurrent
                      ? 'text-green-700 font-extrabold'
                      : isDone
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  )}
                >
                  {step.label}
                </p>
                {entry?.timestamp && (
                  <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(entry.timestamp)}</p>
                )}
                {entry?.note && (
                  <p className="text-xs text-gray-500 mt-0.5 italic">{entry.note}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
