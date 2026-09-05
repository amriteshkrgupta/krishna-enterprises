'use client';

import { MessageSquare, Phone } from 'lucide-react';

const PHONE_NUMBER = '917256955630';
const DEFAULT_MESSAGE = 'Hello Krishna Enterprises, I want to order fresh groceries in Madhuban, East Champaran!';

export default function WhatsAppButton() {
  const whatsappUrl = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 group">
      {/* Tooltip badge */}
      <span className="hidden sm:inline-block rounded-xl bg-gray-900 px-3 py-1.5 text-xs font-bold text-white shadow-lg transition-all group-hover:scale-105">
        Chat with us on WhatsApp 💬
      </span>

      {/* Floating Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp with Krishna Enterprises"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:bg-[#20ba59] active:scale-95 ring-4 ring-white/80"
      >
        <svg
          className="h-8 w-8 fill-current"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.18 8.18 0 012.41 5.82c0 4.54-3.7 8.24-8.24 8.24-1.42 0-2.82-.37-4.05-1.07l-.29-.17-3.12.82.83-3.04-.19-.3a8.21 8.21 0 01-1.26-4.48c0-4.54 3.7-8.24 8.24-8.24zm4.51 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.25-1.5-1.4-1.75-.14-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.29z" />
        </svg>
      </a>
    </div>
  );
}
