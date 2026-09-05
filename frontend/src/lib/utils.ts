import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format number as Indian Rupee: ₹1,234.00 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format ISO date string to human readable */
export function formatDate(date: string): string {
  try {
    return format(parseISO(date), 'dd MMM yyyy, hh:mm a');
  } catch {
    return date;
  }
}

/** Return Tailwind color classes for order status */
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending:    'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed:  'bg-blue-100 text-blue-800 border-blue-200',
    packed:     'bg-indigo-100 text-indigo-800 border-indigo-200',
    dispatched: 'bg-orange-100 text-orange-800 border-orange-200',
    delivered:  'bg-green-100 text-green-800 border-green-200',
    cancelled:  'bg-red-100 text-red-800 border-red-200',
    paid:       'bg-green-100 text-green-800 border-green-200',
    failed:     'bg-red-100 text-red-800 border-red-200',
    refunded:   'bg-purple-100 text-purple-800 border-purple-200',
  };
  return map[status] ?? 'bg-gray-100 text-gray-800 border-gray-200';
}

/** Truncate string to length with ellipsis */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trimEnd() + '…';
}

/**
 * Format complete product size / unit.
 * Never returns bare 'g' or 'L'. Returns clean sizes like '1 L', '50 g', '250 g', '1 kg', '1 pack'.
 */
export function formatProductUnit(
  unit?: string | null,
  name?: string | null,
  description?: string | null,
): string {
  const u = (unit || '').trim();
  const n = (name || '').trim();
  const d = (description || '').trim();

  // If unit already has numbers (e.g. "500g", "1 kg", "250 g", "1L", "500 ml", "Pack of 6")
  if (/\d/.test(u)) {
    return u.replace(/(\d+)\s*([a-zA-Z]+)/g, '$1 $2').trim();
  }

  // Try extracting from product name (e.g. "500g", "1kg", "1L", "250g", "Pack of 6")
  const nameMatch = n.match(/(\d+(?:\.\d+)?)\s*(kg|g|gm|l|litre|liter|ml|pack|pcs|piece|dozen)\b/i);
  if (nameMatch) {
    const qty = nameMatch[1];
    let unitName = nameMatch[2].toLowerCase();
    if (unitName === 'l' || unitName === 'litre' || unitName === 'liter') unitName = 'L';
    else if (unitName === 'gm') unitName = 'g';
    return `${qty} ${unitName}`;
  }

  // Try extracting from description (e.g. "250g gently rolled...", "1 Litre pouch...", "500 ml Amul...", "10 kg pack...")
  const descMatch = d.match(/(\d+(?:\.\d+)?)\s*(kg|g|gm|l|litre|liter|ml|pack|pcs|piece|dozen)\b/i);
  if (descMatch) {
    const qty = descMatch[1];
    let unitName = descMatch[2].toLowerCase();
    if (unitName === 'l' || unitName === 'litre' || unitName === 'liter') unitName = 'L';
    else if (unitName === 'gm') unitName = 'g';
    return `${qty} ${unitName}`;
  }

  // Default fallbacks for bare unit strings (never show bare 'g' or 'L')
  switch (u.toLowerCase()) {
    case 'g':
    case 'gm':
      if (/coffee/i.test(n)) return '50 g';
      if (/tea/i.test(n)) return '250 g';
      if (/haldi|turmeric|chilli|mirch|garam|masala/i.test(n)) return '100 g';
      if (/bhujia|namkeen/i.test(n)) return '200 g';
      return '500 g';
    case 'kg':
      if (/atta|wheat/i.test(n)) return '10 kg';
      if (/rice/i.test(n)) return '5 kg';
      return '1 kg';
    case 'l':
    case 'liter':
    case 'litre':
      if (/ghee/i.test(n)) return '500 ml';
      return '1 L';
    case 'ml':
      return '500 ml';
    case 'pack':
      if (/egg/i.test(n)) return 'Pack of 6';
      return '1 pack';
    case 'dozen':
      return '1 dozen';
    case 'piece':
      return '1 piece';
    default:
      return u || '1 unit';
  }
}
