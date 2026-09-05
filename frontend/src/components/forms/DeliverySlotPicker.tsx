'use client';

import { Sunrise, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DeliverySlot = 'morning' | 'evening';

interface Slot {
  id: DeliverySlot;
  label: string;
  time: string;
  sublabel: string;
  icon: React.ReactNode;
}

const SLOTS: Slot[] = [
  {
    id: 'morning',
    label: 'Morning Slot',
    time: '9:00 AM - 1:00 PM',
    sublabel: 'Delivered before lunchtime',
    icon: <Sunrise className="h-6 w-6" />,
  },
  {
    id: 'evening',
    label: 'Evening Slot',
    time: '4:00 PM - 8:00 PM',
    sublabel: 'Delivered before dinner',
    icon: <Moon className="h-6 w-6" />,
  },
];

interface DeliverySlotPickerProps {
  value: DeliverySlot | '';
  onChange: (slot: DeliverySlot) => void;
}

export default function DeliverySlotPicker({ value, onChange }: DeliverySlotPickerProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {SLOTS.map((slot) => {
        const selected = value === slot.id;
        return (
          <button
            key={slot.id}
            type="button"
            onClick={() => onChange(slot.id)}
            className={cn(
              'flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all',
              selected
                ? 'border-green-600 bg-green-50/80 ring-2 ring-green-600/20 shadow-md scale-[1.01]'
                : 'border-gray-200 bg-white hover:border-green-300 hover:bg-gray-50',
            )}
          >
            <span
              className={cn(
                'rounded-2xl p-3 transition-colors',
                selected ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500',
              )}
            >
              {slot.icon}
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className={cn('font-extrabold text-sm', selected ? 'text-green-950' : 'text-gray-800')}>
                  {slot.label}
                </p>
                {selected && (
                  <span className="rounded-full bg-green-600 text-white text-[10px] font-extrabold px-2 py-0.5">
                    Selected ✓
                  </span>
                )}
              </div>
              <p className={cn('text-xs font-bold mt-1', selected ? 'text-green-700' : 'text-gray-600')}>
                {slot.time}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">{slot.sublabel}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
