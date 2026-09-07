import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import ConditionalLayout from '@/components/layout/ConditionalLayout';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Krishna Enterprises | Fresh Groceries in Madhuban, East Champaran',
  description:
    'Order fresh groceries, atta, rice, dal, oil and daily essentials online from Krishna Enterprises, Machhaha Chowk, Madhuban, East Champaran, Bihar 845420. Fast home delivery, best prices, COD & UPI.',
  keywords: 'grocery, online grocery, Madhuban, East Champaran, Bihar, Machhaha Chowk, fresh groceries, daily essentials',
  manifest: '/manifest.json',
  referrer: 'no-referrer-when-downgrade',
  openGraph: {
    title: 'Krishna Enterprises | Fresh Groceries Delivered Fast',
    description: 'Fresh groceries, daily essentials, and household items delivered right to your door in Madhuban, Bihar.',
    type: 'website',
    locale: 'en_IN',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <Providers>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}
