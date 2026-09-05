'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin, Clock, ShoppingBag, ArrowLeft, ArrowRight,
  CheckCircle, QrCode, Copy, Check, Sparkles, Smartphone,
  ClipboardPaste, Upload, Trash2, Plus, Home, MessageSquare,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { usePlaceOrder } from '@/hooks/useOrders';
import AddressForm, { AddressFormValues } from '@/components/forms/AddressForm';
import { apiPost } from '@/lib/api';
import { formatPrice, formatProductUnit } from '@/lib/utils';
import { getWhatsAppShareUrl } from '@/lib/whatsapp';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 1, label: '1. Address' },
  { id: 2, label: '2. Delivery' },
  { id: 3, label: '3. Payment' },
  { id: 4, label: '4. Review' },
];

const FREE_DELIVERY_THRESHOLD = 500;
const DELIVERY_CHARGE = 50;
const STORE_UPI_ID = '7256955630@upi';
const STORE_NAME = 'Krishna Enterprises';
const STORE_LOCATION = 'Madhuban, East Champaran, Bihar';

type DeliverySlot = 'morning' | 'evening';

const SLOTS: { id: DeliverySlot; label: string; time: string; sub: string; icon: string }[] = [
  {
    id: 'morning',
    label: 'Morning Slot',
    time: '9 AM – 1 PM',
    sub: 'Delivered before lunchtime',
    icon: '🌅',
  },
  {
    id: 'evening',
    label: 'Evening Slot',
    time: '4 PM – 8 PM',
    sub: 'Delivered before dinner',
    icon: '🌇',
  },
];

// Clean and normalize UPI UTR strings
function cleanUpiUtr(raw: string): string {
  return raw
    .replace(/^(utr|ref|txn|ref no|transaction id|txn id)[:\s\-\.]+/i, '')
    .replace(/[\s\-\_\/]+/g, '')
    .trim();
}

// Check standard 12-digit numeric or valid UPI ref ID format
function isValidUpiFormat(utr: string): boolean {
  const clean = cleanUpiUtr(utr);
  return /^\d{12}$/.test(clean) || /^[A-Za-z0-9]{12,24}$/.test(clean);
}

function getExpectedDelivery(slot: DeliverySlot): string {
  return slot === 'morning' ? 'Tomorrow · 9 AM – 1 PM' : 'Tomorrow · 4 PM – 8 PM';
}

export default function CheckoutPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const clearCart = useCartStore((s) => s.clearCart);
  const placeOrder = usePlaceOrder();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [address, setAddress] = useState<AddressFormValues | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [slot, setSlot] = useState<DeliverySlot>('morning');
  const [upiUtr, setUpiUtr] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [placedOrder, setPlacedOrder] = useState<any>(null);

  const sub = subtotal();
  const delivery = sub >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  const total = sub + delivery;

  const cleanedUtr = cleanUpiUtr(upiUtr);
  const isUtr12Digits = /^\d{12}$/.test(cleanedUtr);

  // Dynamic UPI Payment URL and QR Code
  const upiPayUrl = `upi://pay?pa=${STORE_UPI_ID}&pn=${encodeURIComponent(STORE_NAME)}&am=${total}&cu=INR&tn=${encodeURIComponent('Krishna Enterprises Grocery Order')}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiPayUrl)}&bgcolor=ffffff&color=052e16`;

  const copyUpiId = () => {
    navigator.clipboard.writeText(STORE_UPI_ID);
    setCopiedUpi(true);
    toast.success('UPI ID copied to clipboard!');
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const pasteUtrFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const clean = cleanUpiUtr(text.trim());
        setUpiUtr(clean);
        if (isValidUpiFormat(clean)) {
          toast.success(`Valid 12-digit UTR pasted: ${clean} ✓`);
        } else {
          toast.success(`Pasted UTR: ${clean}`);
        }
      } else {
        toast.error('Clipboard is empty. Please copy your UTR number first.');
      }
    } catch {
      toast.error('Please paste manually or allow clipboard permissions.');
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, JPEG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result as string);
      toast.success('Payment screenshot attached! 📸');
    };
    reader.readAsDataURL(file);
  };

  const removeScreenshot = () => {
    setScreenshotPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectSavedAddress = (savedAddr: any) => {
    const values: AddressFormValues = {
      label: savedAddr.label || 'Home',
      street: savedAddr.street,
      city: savedAddr.city || 'Madhuban',
      state: savedAddr.state || 'Bihar',
      pincode: savedAddr.pincode || '845420',
      phone: savedAddr.phone || user?.phone || '7256955630',
    };
    setAddress(values);
    setStep(2);
  };

  const handleAddressSubmit = async (values: AddressFormValues) => {
    setAddress(values);

    if (token) {
      try {
        const res = await apiPost<{ success: boolean; data: any }>('/auth/addresses', values);
        if (res.success && res.data) {
          setUser(res.data);
        }
      } catch {
        // continue smoothly
      }
    }

    setShowNewAddressForm(false);
    setStep(2);
  };

  const handlePaymentNext = () => {
    const clean = cleanUpiUtr(upiUtr);
    if (!clean) {
      toast.error('Please enter or paste your 12-digit UPI Transaction ID / UTR *');
      return;
    }
    if (clean.length < 12) {
      toast.error(`UPI UTR must be 12 digits (currently ${clean.length} digits). e.g. 423981726351`);
      return;
    }
    if (!isValidUpiFormat(clean)) {
      toast.error('Invalid format. Please enter a valid 12-digit UPI Transaction ID / UTR.');
      return;
    }
    setStep(4);
  };

  const handlePlaceOrder = async () => {
    if (!token) {
      toast.error('Please sign in to confirm your order');
      router.push('/login?redirect=/checkout');
      return;
    }

    if (!address || !slot) {
      toast.error('Please complete address and delivery slot');
      return;
    }

    const finalTransactionId = cleanUpiUtr(upiUtr) || null;

    placeOrder.mutate(
      {
        items: items.map((i) => ({
          product: typeof i.product === 'object' ? i.product._id : i.product,
          quantity: i.quantity,
          price: i.price,
        })),
        deliveryAddress: address,
        deliverySlot: slot,
        paymentMethod: 'UPI',
        transaction_id: finalTransactionId,
        upiTransactionId: finalTransactionId,
        paymentScreenshot: screenshotPreview || undefined,
      } as any,
      {
        onSuccess: (res: any) => {
          clearCart();
          const orderDoc = res?.order || res?.data || res;
          setPlacedOrder(orderDoc);
          toast.success('Order placed successfully! 🎉');
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || 'Could not place order. Please try again.';
          toast.error(msg);
        },
      },
    );
  };

  // --- POST-ORDER SUCCESS SCREEN --------------------------------------------
  if (placedOrder) {
    const txnId = placedOrder.transaction_id || placedOrder.upiTransactionId || cleanedUtr;
    const waUrl = getWhatsAppShareUrl(placedOrder, address?.phone);

    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-xl text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle className="h-10 w-10" />
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-gray-900">✓ Order Placed Successfully</h1>
            <p className="font-mono text-base font-extrabold text-green-700">Order #{placedOrder.orderNumber}</p>
          </div>

          {/* Quick Summary Card */}
          <div className="rounded-2xl bg-gray-50 p-5 text-left text-xs space-y-2.5 border border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Expected Delivery:</span>
              <span className="font-extrabold text-green-800 text-sm">{getExpectedDelivery(slot)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Total Paid:</span>
              <span className="font-extrabold text-gray-900 text-sm">{formatPrice(placedOrder.totalAmount || total)}</span>
            </div>
            {txnId && (
              <div className="flex justify-between items-center border-t border-gray-200/60 pt-2">
                <span className="text-gray-500 font-medium">Transaction ID:</span>
                <span className="font-mono font-extrabold text-gray-900">{txnId}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Delivery Address:</span>
              <span className="font-bold text-gray-800 text-right">{address?.street}, Madhuban</span>
            </div>
          </div>

          {/* Large Action Buttons */}
          <div className="flex flex-col gap-2.5 pt-2">
            <Link
              href={`/orders/${placedOrder._id}`}
              className="w-full rounded-2xl bg-green-600 hover:bg-green-700 py-3.5 text-sm font-extrabold text-white shadow-md transition-all text-center"
            >
              Track Order →
            </Link>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/orders"
                className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 py-3 text-xs font-extrabold text-gray-700 shadow-xs transition-all text-center"
              >
                View All Orders
              </Link>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] py-3 text-xs font-extrabold text-white shadow-xs transition-all"
              >
                <MessageSquare className="h-4 w-4" /> Share on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
        <ShoppingBag className="h-16 w-16 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-800">Your cart is empty</h2>
        <p className="text-sm text-gray-500">Add groceries to your cart before checking out.</p>
        <Link
          href="/products"
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-green-700 transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  const savedAddresses = user?.addresses || [];
  const defaultSaved = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      {/* Clean Minimal 4-Step Progress */}
      <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-3">
        {STEPS.map((s) => {
          const isCurrent = step === s.id;
          const isPassed = s.id < step;
          return (
            <button
              key={s.id}
              onClick={() => {
                if (isPassed) setStep(s.id);
              }}
              className={`text-xs font-extrabold transition-colors ${
                isCurrent
                  ? 'text-green-700 border-b-2 border-green-600 pb-1'
                  : isPassed
                  ? 'text-gray-700 cursor-pointer'
                  : 'text-gray-400 cursor-default'
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* STEP 1: ADDRESS                                                     */}
      {/* =================================================================== */}
      {step === 1 && (
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" /> Delivery Address
            </h2>
            <span className="text-xs text-green-800 font-bold bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
              Madhuban Delivery
            </span>
          </div>

          {/* 1. Saved Address at Top */}
          {defaultSaved && !showNewAddressForm && (
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-green-600 bg-green-50/40 p-5 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-green-950 flex items-center gap-1.5">
                    <Home className="h-4 w-4 text-green-600" />
                    {defaultSaved.label || 'Home'} · Default
                  </span>
                  <span className="rounded-full bg-green-600 text-white text-[10px] font-extrabold px-2 py-0.5">
                    Default
                  </span>
                </div>
                <p className="font-bold text-gray-900 text-sm">{defaultSaved.street}</p>
                <p className="text-gray-600 text-xs">{defaultSaved.city}, {defaultSaved.state} – {defaultSaved.pincode}</p>
                <p className="text-green-800 font-bold text-xs mt-1">📞 {defaultSaved.phone || user?.phone}</p>

                <button
                  type="button"
                  onClick={() => handleSelectSavedAddress(defaultSaved)}
                  className="mt-3 w-full rounded-2xl bg-green-600 hover:bg-green-700 py-3.5 text-sm font-extrabold text-white shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  ✓ Deliver Here
                </button>
              </div>

              {/* Other saved addresses if customer has multiple */}
              {savedAddresses.length > 1 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Other Saved Addresses:
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {savedAddresses
                      .filter((a) => a._id !== defaultSaved._id)
                      .map((addr) => (
                        <div
                          key={addr._id}
                          onClick={() => handleSelectSavedAddress(addr)}
                          className="flex items-center justify-between rounded-xl border border-gray-200 p-3 hover:border-green-600 hover:bg-green-50/50 cursor-pointer transition"
                        >
                          <div>
                            <span className="font-bold text-xs text-gray-900">{addr.label}: {addr.street}</span>
                            <span className="text-[11px] text-gray-500 block">{addr.city}, {addr.pincode}</span>
                          </div>
                          <span className="text-xs font-extrabold text-green-700">Deliver Here →</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* + Add New Address Button */}
              <button
                type="button"
                onClick={() => setShowNewAddressForm(true)}
                className="w-full flex items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-gray-300 hover:border-green-600 hover:bg-green-50/40 p-3.5 text-xs font-extrabold text-gray-700 transition"
              >
                <Plus className="h-4 w-4 text-green-600" />
                + Add New Address
              </button>
            </div>
          )}

          {/* 2. New Address Form (Hidden until clicked or if no saved address) */}
          {(!defaultSaved || showNewAddressForm) && (
            <div className="space-y-4">
              {showNewAddressForm && (
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-xs font-extrabold text-gray-900">Add New Address</span>
                  <button
                    type="button"
                    onClick={() => setShowNewAddressForm(false)}
                    className="text-xs font-bold text-gray-500 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <AddressForm
                defaultValues={address ?? undefined}
                onSubmit={handleAddressSubmit}
                onCancel={showNewAddressForm ? () => setShowNewAddressForm(false) : undefined}
              />
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* STEP 2: DELIVERY SLOTS                                              */}
      {/* =================================================================== */}
      {step === 2 && (
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" /> Delivery Slot
            </h2>
            <span className="text-xs text-green-800 font-bold bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
              Madhuban Delivery
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SLOTS.map((s) => {
              const selected = slot === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSlot(s.id)}
                  className={`flex flex-col justify-between rounded-2xl border-2 p-5 text-left transition-all ${
                    selected
                      ? 'border-green-600 bg-green-50/80 ring-2 ring-green-600/20 shadow-md scale-[1.01]'
                      : 'border-gray-200 bg-white hover:border-green-300 hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{s.icon}</span>
                      {selected && (
                        <span className="rounded-full bg-green-600 text-white text-[10px] font-extrabold px-2 py-0.5">
                          Selected ✓
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-base text-gray-900 mt-2">{s.label}</h3>
                    <p className="text-sm font-extrabold text-green-700 mt-0.5">{s.time}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-100">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Address
            </button>
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-7 py-3 text-xs font-extrabold text-white shadow-md hover:bg-green-700 transition"
            >
              Continue to Payment <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* STEP 3: PAYMENT                                                     */}
      {/* =================================================================== */}
      {step === 3 && (
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
          <div className="text-center space-y-1 border-b border-gray-100 pb-4">
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-extrabold text-green-800">
              <Sparkles className="h-3.5 w-3.5 text-green-600" /> UPI Payment
            </span>
            <h2 className="text-2xl font-extrabold text-gray-900">Amount to Pay: {formatPrice(total)}</h2>
            <p className="text-xs text-gray-500">Scan &amp; pay with Google Pay, PhonePe, Paytm, or BHIM</p>
          </div>

          <div className="rounded-2xl border border-green-200 bg-green-50/40 p-5 space-y-5">
            {/* Payee Details */}
            <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-green-200 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-green-600 text-white flex items-center justify-center font-extrabold text-xs">
                  KE
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-gray-900">{STORE_NAME}</h4>
                  <span className="text-[11px] text-gray-500">{STORE_LOCATION}</span>
                </div>
              </div>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-extrabold text-green-800 flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" /> Verified Store
              </span>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center">
              <div className="rounded-2xl border-4 border-white bg-white p-3 shadow-lg">
                <img
                  src={qrCodeUrl}
                  alt="Payment QR Code"
                  className="h-48 w-48 rounded-xl object-contain"
                />
              </div>

              {/* UPI ID Copy */}
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-white px-3.5 py-1.5 border border-gray-200 text-xs shadow-xs">
                <span className="font-mono font-extrabold text-gray-900">{STORE_UPI_ID}</span>
                <button
                  type="button"
                  onClick={copyUpiId}
                  className="text-green-700 font-extrabold hover:underline"
                >
                  {copiedUpi ? 'Copied! ✓' : 'Copy'}
                </button>
              </div>
            </div>

            {/* 12-Digit UTR with Live Checking */}
            <div
              className={`space-y-1.5 rounded-2xl border-2 bg-white p-4 shadow-xs transition-all ${
                isUtr12Digits
                  ? 'border-green-600 ring-2 ring-green-600/20'
                  : cleanedUtr.length > 0
                  ? 'border-orange-400'
                  : 'border-green-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <CheckCircle className={`h-4 w-4 ${isUtr12Digits ? 'text-green-600' : 'text-gray-400'}`} />
                  <span>
                    12-Digit UPI Transaction ID / UTR <span className="text-red-500 font-extrabold">*</span>
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      isUtr12Digits
                        ? 'bg-green-100 text-green-800'
                        : cleanedUtr.length > 0
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {cleanedUtr.length}/12 {isUtr12Digits ? '✓' : ''}
                  </span>

                  <button
                    type="button"
                    onClick={pasteUtrFromClipboard}
                    className="flex items-center gap-1 rounded-lg bg-green-600 hover:bg-green-700 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs transition"
                  >
                    <ClipboardPaste className="h-3.5 w-3.5" /> Paste
                  </button>
                </div>
              </div>

              <input
                type="text"
                required
                maxLength={24}
                placeholder="Enter 12-digit UTR (e.g. 423981726351)"
                value={upiUtr}
                onChange={(e) => setUpiUtr(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-2.5 text-xs font-mono font-bold text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition"
              />

              <div className="flex items-center justify-between text-[10px]">
                <p className="text-gray-400">Enter the 12-digit reference number from your payment receipt.</p>
                {isUtr12Digits && (
                  <span className="text-green-600 font-extrabold shrink-0 ml-1">
                    Valid 12-Digit UTR ✓
                  </span>
                )}
              </div>
            </div>

            {/* Optional Screenshot Upload */}
            <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleScreenshotUpload}
                className="hidden"
                id="screenshot-upload"
              />

              {!screenshotPreview ? (
                <label
                  htmlFor="screenshot-upload"
                  className="flex items-center justify-center gap-2 p-2 hover:bg-green-50/50 cursor-pointer rounded-lg text-xs font-bold text-gray-600 border border-dashed border-gray-300"
                >
                  <Upload className="h-4 w-4 text-gray-400" />
                  <span>Attach Payment Screenshot (Optional)</span>
                </label>
              ) : (
                <div className="flex items-center justify-between bg-green-50 p-2 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <img src={screenshotPreview} alt="Screenshot" className="h-10 w-10 rounded object-cover border border-green-300" />
                    <span className="text-xs font-bold text-green-900">Screenshot Attached ✓</span>
                  </div>
                  <button type="button" onClick={removeScreenshot} className="p-1 text-gray-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-100">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Delivery
            </button>
            <button
              onClick={handlePaymentNext}
              className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-7 py-3 text-xs font-extrabold text-white shadow-md hover:bg-green-700 transition"
            >
              Review Order <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* STEP 4: REVIEW & CONFIRM                                            */}
      {/* =================================================================== */}
      {step === 4 && (
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">Review &amp; Confirm</h2>
            <p className="text-xs text-gray-500">Please review your order details before placing.</p>
          </div>

          {/* Delivery Details Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-green-700 block">
                📍 Delivery Address
              </span>
              <p className="font-bold text-gray-900">{address?.street}</p>
              <p className="text-gray-600">{address?.city}, {address?.state} – {address?.pincode}</p>
              <p className="text-green-800 font-bold mt-1">📞 {address?.phone}</p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-green-700 block">
                🕒 Delivery Slot
              </span>
              <p className="font-bold text-gray-900">{getExpectedDelivery(slot)}</p>
              <p className="text-gray-500 text-[11px]">Doorstep delivery in Madhuban</p>
              <p className="text-green-800 font-mono text-[11px] pt-1">UTR: <b>{cleanedUtr}</b></p>
            </div>
          </div>

          {/* Items List */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Items ({items.reduce((s, i) => s + i.quantity, 0)})
            </h3>
            <div className="divide-y divide-gray-200/70 max-h-48 overflow-y-auto">
              {items.map((it) => (
                <div key={it.product._id} className="flex items-center justify-between py-2.5 text-xs">
                  <div>
                    <p className="font-bold text-gray-900">{it.product.name}</p>
                    <p className="text-gray-500 font-medium text-[11px]">
                      {formatProductUnit(it.product.unit, it.product.name, it.product.description)} · Qty {it.quantity}
                    </p>
                  </div>
                  <span className="font-extrabold text-gray-900">
                    {formatPrice(it.price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Clean Price Breakdown with Free Delivery Progress */}
          <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-bold text-gray-900">{formatPrice(sub)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Charge:</span>
              <span>
                {delivery === 0 ? (
                  <span className="text-green-600 font-bold">FREE</span>
                ) : (
                  <span className="font-bold text-gray-900">{formatPrice(delivery)}</span>
                )}
              </span>
            </div>
            {sub < FREE_DELIVERY_THRESHOLD && (
              <div className="rounded-xl bg-orange-50 p-2 text-center text-xs font-bold text-orange-700 border border-orange-200/60">
                ₹{FREE_DELIVERY_THRESHOLD - Math.round(sub)} more for FREE delivery
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-extrabold text-gray-900">
              <span>Total:</span>
              <span className="text-green-700">{formatPrice(total)}</span>
            </div>
          </div>

          {/* Final Action Buttons */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Payment
            </button>
            <button
              onClick={handlePlaceOrder}
              disabled={placeOrder.isPending}
              className="rounded-2xl bg-green-600 hover:bg-green-700 px-8 py-4 text-sm font-extrabold text-white shadow-xl transition-all hover:scale-105 active:scale-95 disabled:bg-gray-400"
            >
              {placeOrder.isPending ? 'Placing Order...' : `Place Order — ${formatPrice(total)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
