import Link from 'next/link';
import { Leaf, MapPin, Phone, Mail, MessageSquare, Clock } from 'lucide-react';

const STORE_PHONE = '+91 72569 55630';
const RAW_PHONE = '917256955630';
const WA_MSG = 'Hello Krishna Enterprises, I would like to order fresh groceries in Madhuban, East Champaran!';

export default function Footer() {
  const waLink = `https://wa.me/${RAW_PHONE}?text=${encodeURIComponent(WA_MSG)}`;

  return (
    <footer className="border-t border-gray-100 bg-gray-900 text-gray-300">
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Col 1: Brand & Contact */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600">
                <Leaf className="h-5 w-5 text-white" />
              </span>
              <div>
                <span className="text-base font-extrabold text-white">Krishna Enterprises</span>
                <span className="block text-xs text-green-400">Grocery &amp; Daily Essentials</span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-gray-400">
              Fresh groceries &amp; daily essentials delivered to your doorstep across Madhuban, Bihar.
            </p>
            <div className="space-y-2 text-xs text-gray-400">
              <a
                href="tel:07256955630"
                className="flex items-center gap-2 hover:text-white transition-colors font-bold text-green-400"
              >
                <Phone className="h-4 w-4 text-green-400 shrink-0" />
                {STORE_PHONE}
              </a>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 px-3 py-1 text-xs font-bold transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                WhatsApp Order
              </a>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-green-400 shrink-0" />
                support@krishnaenterprises.in
              </p>
            </div>
          </div>

          {/* Col 2: Shop */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Shop</h4>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li><Link href="/products" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="/products?category=grains-cereals" className="hover:text-white transition-colors">Atta &amp; Rice (Grains)</Link></li>
              <li><Link href="/products?category=pulses-lentils" className="hover:text-white transition-colors">Dal &amp; Pulses</Link></li>
              <li><Link href="/products?category=cooking-oil-ghee" className="hover:text-white transition-colors">Cooking Oil &amp; Ghee</Link></li>
              <li><Link href="/products?featured=true" className="hover:text-white transition-colors">Featured &amp; Offers</Link></li>
            </ul>
          </div>

          {/* Col 3: My Account */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">My Account</h4>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li><Link href="/orders" className="hover:text-white transition-colors">My Orders</Link></li>
              <li><Link href="/profile" className="hover:text-white transition-colors">My Account &amp; Addresses</Link></li>
              <li><Link href="/cart" className="hover:text-white transition-colors">Shopping Cart</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Customer Login</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Create Account</Link></li>
            </ul>
          </div>

          {/* Col 4: Delivery Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Delivery</h4>
            <div className="rounded-2xl bg-gray-800/80 p-4 text-xs text-gray-300 border border-gray-700/60 space-y-2">
              <div className="flex items-center gap-1.5 text-green-400 font-bold">
                <Clock className="h-4 w-4" />
                <span>Daily Delivery Timings:</span>
              </div>
              <p className="text-gray-400">🌅 Morning: 9:00 AM – 1:00 PM</p>
              <p className="text-gray-400">🌇 Evening: 4:00 PM – 8:00 PM</p>
              <div className="border-t border-gray-700/70 pt-2 mt-2 flex items-start gap-1.5 text-gray-400">
                <MapPin className="h-3.5 w-3.5 text-green-400 shrink-0 mt-0.5" />
                <span>Madhuban, East Champaran, Bihar</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800 py-6 text-center text-xs text-gray-500">
        <p>© 2026 Krishna Enterprises, Madhuban, Bihar. All rights reserved.</p>
      </div>
    </footer>
  );
}