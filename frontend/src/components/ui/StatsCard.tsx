'use client';

import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: string | number;
  changeType?: 'up' | 'down' | 'neutral';
  color?: 'green' | 'orange' | 'blue' | 'red' | 'purple';
  subtitle?: string;
}

const colorMap = {
  green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600',  border: 'border-green-100' },
  orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600', border: 'border-orange-100' },
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',    border: 'border-blue-100' },
  red:    { bg: 'bg-red-50',    icon: 'bg-red-100 text-red-600',      border: 'border-red-100' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', border: 'border-purple-100' },
};

export default function StatsCard({
  title,
  value,
  icon,
  change,
  changeType = 'neutral',
  color = 'green',
  subtitle,
}: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={cn(
        'rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md',
        colors.bg,
        colors.border,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
          {change !== undefined && (
            <div
              className={cn(
                'mt-2 flex items-center gap-1 text-xs font-medium',
                changeType === 'up'   ? 'text-green-600' :
                changeType === 'down' ? 'text-red-600'   : 'text-gray-500',
              )}
            >
              {changeType === 'up'   && <TrendingUp  className="h-3 w-3" />}
              {changeType === 'down' && <TrendingDown className="h-3 w-3" />}
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className={cn('rounded-xl p-3', colors.icon)}>{icon}</div>
      </div>
    </div>
  );
}
