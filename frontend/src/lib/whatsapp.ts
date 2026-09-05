/**
 * lib/whatsapp.ts
 * WhatsApp Receipt Generator for Krishna Enterprises.
 * Generates clean, database-driven, 100% WhatsApp-compatible text
 * with real Unicode emojis and conditional field rendering.
 */

export const STATUS_MESSAGES: Record<string, { banner: string; emoji: string; label: string }> = {
  pending: {
    banner: '⏳ ORDER RECEIVED',
    emoji: '⏳',
    label: 'Order received — waiting for confirmation',
  },
  confirmed: {
    banner: '✅ ORDER CONFIRMED',
    emoji: '✅',
    label: 'Order confirmed',
  },
  packed: {
    banner: '📦 ORDER PACKED',
    emoji: '📦',
    label: 'Your order has been packed',
  },
  dispatched: {
    banner: '🚚 ORDER DISPATCHED',
    emoji: '🚚',
    label: 'Your order is on the way',
  },
  delivered: {
    banner: '🎉 ORDER DELIVERED',
    emoji: '🎉',
    label: 'Your order has been delivered',
  },
  cancelled: {
    banner: '❌ ORDER CANCELLED',
    emoji: '❌',
    label: 'Your order has been cancelled',
  },
};

function formatDeliverySlot(slot?: string): string {
  if (slot === 'evening') return 'Evening Slot (4:00 PM – 8:00 PM)';
  return 'Morning Slot (9:00 AM – 1:00 PM)';
}

function getExpectedDelivery(createdAtStr?: string, slot?: string): string {
  if (!createdAtStr) return 'Tomorrow, 9:00 AM – 1:00 PM';
  try {
    const created = new Date(createdAtStr);
    const hour = created.getHours();
    if (slot === 'evening') {
      const day = hour >= 16 ? 'Tomorrow' : 'Today';
      return `${day}, 4:00 PM – 8:00 PM`;
    } else {
      const day = hour >= 9 ? 'Tomorrow' : 'Today';
      return `${day}, 9:00 AM – 1:00 PM`;
    }
  } catch {
    return 'Tomorrow, 9:00 AM – 1:00 PM';
  }
}

export function getPublicOrderUrl(orderId: string): string {
  const customDomain = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_FRONTEND_URL;

  if (customDomain && !customDomain.includes('localhost')) {
    return `${customDomain.replace(/\/$/, '')}/orders/${orderId}`;
  }

  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (!origin.includes('localhost')) {
      return `${origin}/orders/${orderId}`;
    }
    if (customDomain) {
      return `${customDomain.replace(/\/$/, '')}/orders/${orderId}`;
    }
    return `${origin}/orders/${orderId}`;
  }

  return `https://krishnaenterprises.in/orders/${orderId}`;
}

export function generateWhatsAppReceipt(order: any): string {
  if (!order) return '';

  const statusKey = (order.orderStatus || 'pending').toLowerCase();
  const statusInfo = STATUS_MESSAGES[statusKey] || STATUS_MESSAGES.pending;

  const orderNumber = order.orderNumber || order._id || order.id || 'N/A';
  const transactionId = order.transaction_id || order.upiTransactionId || null;
  const isPaid = order.paymentStatus === 'paid' || Boolean(transactionId);
  const paymentStatusText = isPaid ? 'Paid (UPI)' : 'Pending Verification';

  const orderId = order._id || order.id || orderNumber;
  const trackUrl = getPublicOrderUrl(orderId);

  const items = Array.isArray(order.items) ? order.items : [];
  const itemsText = items.length > 0
    ? items
        .map((item: any) => {
          const qty = item.quantity || 1;
          const price = item.price || 0;
          const lineTotal = price * qty;
          const unitStr = item.unit ? ` (${item.unit})` : '';
          return `• *${item.name}*${unitStr}\n  ${qty} × ₹${price} = *₹${lineTotal}*`;
        })
        .join('\n')
    : '• *Grocery Items*';

  const subtotal = order.subtotal ?? items.reduce((acc: number, i: any) => acc + (i.price || 0) * (i.quantity || 1), 0);
  const deliveryCharge = order.deliveryCharge ?? 0;
  const deliveryText = deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`;
  const discount = order.discount || 0;
  const totalAmount = order.totalAmount ?? Math.max(0, subtotal + deliveryCharge - discount);

  const addr = order.deliveryAddress || {};
  const addressParts = [addr.street, addr.city, addr.state ? `${addr.state} - ${addr.pincode}` : addr.pincode]
    .filter(Boolean)
    .join(', ');
  const phone = addr.phone || order.userPhone || '';

  const expectedDelivery = getExpectedDelivery(order.createdAt, order.deliverySlot);
  const slotText = formatDeliverySlot(order.deliverySlot);

  const lines: string[] = [
    '🛒 *KRISHNA ENTERPRISES*',
    '',
    `${statusInfo.banner}`,
    '',
    `🔖 *Order Number:* #${orderNumber}`,
    `📦 *Order Status:* ${statusInfo.label}`,
    `💳 *Payment Status:* ${paymentStatusText}`,
  ];

  if (transactionId) {
    lines.push(`🧾 *Transaction ID:* ${transactionId}`);
  }

  lines.push(
    '━━━━━━━━━━━━━━━━━━',
    '',
    '🛍️ *ORDER SUMMARY*',
    '',
    itemsText,
    '',
    `💰 *Subtotal:* ₹${subtotal}`,
    `🚚 *Delivery Charge:* ${deliveryText}`
  );

  if (discount > 0) {
    lines.push(`🏷️ *Discount:* -₹${discount}`);
  }

  lines.push(
    `💵 *TOTAL PAID:* *₹${totalAmount}*`,
    '',
    '━━━━━━━━━━━━━━━━━━',
    '',
    '🚚 *DELIVERY DETAILS*',
    '',
    `📅 *Expected Delivery:* ${expectedDelivery}`,
    `⏰ *Slot:* ${slotText}`
  );

  if (addressParts) {
    lines.push(`📍 *Address:* ${addressParts}`);
  }

  if (phone) {
    lines.push(`📞 *Contact:* ${phone}`);
  }

  lines.push(
    '',
    '━━━━━━━━━━━━━━━━━━',
    '',
    '🔎 *TRACK YOUR ORDER*',
    trackUrl,
    '',
    '━━━━━━━━━━━━━━━━━━',
    '',
    '💚 *Thank you for choosing Krishna Enterprises!*',
    'Fresh groceries & daily essentials delivered to your doorstep.'
  );

  return lines.join('\n');
}

export function getWhatsAppShareUrl(order: any, phoneOverride?: string): string {
  const receiptText = generateWhatsAppReceipt(order);
  const targetPhone = phoneOverride ? phoneOverride.replace(/\D/g, '') : '';

  if (targetPhone) {
    const formattedPhone = targetPhone.startsWith('91') ? targetPhone : `91${targetPhone}`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(receiptText)}`;
  }

  return `https://wa.me/?text=${encodeURIComponent(receiptText)}`;
}