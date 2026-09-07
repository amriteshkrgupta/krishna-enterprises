'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Eye, ArrowLeft, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import { useHomepageConfig, usePublishHomepage } from '@/hooks/useCms';
import SectionRenderer from '@/components/cms/SectionRenderer';
import { HomepageSection } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const DEFAULT_SECTIONS: HomepageSection[] = [
  {
    id: 'sec_hero',
    type: 'hero',
    position: 1,
    enabled: true,
    title: 'Fresh Groceries Delivered To\nYour Doorstep',
    subtitle:
      'Order atta, rice, dal, oil, spices and daily essentials online. Instant UPI QR scan & pay. Doorstep delivery across Madhuban & East Champaran, Bihar.',
    badge: "🌿 Madhuban, East Champaran's Trusted Grocery Store",
    content: {
      ctaPrimaryText: 'Shop All Products',
      ctaPrimaryLink: '/products',
      ctaSecondaryText: 'View Featured Deals',
      ctaSecondaryLink: '/products?featured=true',
    },
  },
  {
    id: 'sec_categories',
    type: 'category_grid',
    position: 2,
    enabled: true,
    title: 'Explore Categories',
    subtitle: 'Explore fresh daily staples and groceries',
    content: {
      seeAllText: 'See all',
      seeAllLink: '/products',
      limit: 8,
    },
  },
  {
    id: 'sec_featured',
    type: 'product_section',
    position: 3,
    enabled: true,
    title: 'Featured Deals',
    subtitle: 'Special discounted products and staples',
    badge: 'Special Offers',
    dataSource: {
      type: 'featured',
      limit: 12,
    },
    content: {
      viewAllText: 'View all deals',
      viewAllLink: '/products?featured=true',
      cardStyle: 'featured_box',
    },
  },
  {
    id: 'sec_popular',
    type: 'product_section',
    position: 4,
    enabled: true,
    title: 'Popular Staples',
    subtitle: 'Top-selling daily groceries at best market prices',
    dataSource: {
      type: 'all',
      limit: 12,
    },
    content: {
      viewAllText: 'Browse All',
      viewAllLink: '/products',
      cardStyle: 'standard',
    },
  },
  {
    id: 'sec_trust',
    type: 'trust_strip',
    position: 5,
    enabled: true,
    title: 'Why Choose Krishna Enterprises?',
    subtitle: 'Your local grocery partner in Madhuban, East Champaran',
    content: {
      items: [
        {
          id: 'trust_1',
          icon: 'truck',
          title: 'Fast Local Delivery',
          description: 'Choose your slot: Morning (9 AM - 1 PM) or Evening (4 PM - 8 PM) across Madhuban.',
        },
        {
          id: 'trust_2',
          icon: 'badge-check',
          title: '100% Fresh & Authentic',
          description: 'All groceries sourced from certified brands and packed with hygiene & quality assurance.',
        },
        {
          id: 'trust_3',
          icon: 'shield',
          title: 'Best Market Prices',
          description: 'Competitive rates with special discounts on staples. FREE delivery on orders above ₹500.',
        },
      ],
    },
  },
  {
    id: 'sec_location',
    type: 'store_location',
    position: 6,
    enabled: true,
    title: 'Krishna Enterprises',
    subtitle: 'Machhaha Chowk, Chakia - Madhuban - Sheohar Rd, Rupni, Jogaulia Tola Kharsal, Bihar 845420',
    content: {
      phone: '07256955630',
      callText: 'Call 07256955630',
      whatsappText: 'WhatsApp Chat',
    },
  },
];

function HomepageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isPreview = searchParams.get('preview') === 'true';

  const { data: config, isLoading } = useHomepageConfig(isPreview);
  const { mutate: publish, isPending: isPublishing } = usePublishHomepage();

  const handlePublish = () => {
    publish('Published from preview bar', {
      onSuccess: () => {
        toast.success('Draft published to live homepage successfully!');
        router.push('/');
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to publish draft');
      },
    });
  };

  // Gracefully fallback to default sections if config is loading or not configured
  const sections = config?.sections && config.sections.length > 0 ? config.sections : DEFAULT_SECTIONS;

  return (
    <div className="relative">
      {/* ── Preview Mode Banner ──────────────────────────────────────────────── */}
      {isPreview && (
        <aside aria-label="CMS Preview Mode" className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-amber-600 to-amber-500 px-4 py-2.5 text-white shadow-md text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-black">
              <Eye className="h-3 w-3" /> Preview Mode
            </span>
            <span>Viewing Staged Draft (Live customers see the published version)</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/homepage"
              className="flex items-center gap-1 rounded-xl bg-white/20 px-3 py-1 hover:bg-white/30 text-white transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Builder
            </Link>
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex items-center gap-1 rounded-xl bg-white px-3.5 py-1 text-amber-900 font-extrabold hover:bg-amber-50 shadow-xs transition-all disabled:opacity-50"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              {isPublishing ? 'Publishing...' : 'Publish Live Now'}
            </button>
          </div>
        </aside>
      )}

      {/* ── Dynamic Section Renderer ────────────────────────────────────────── */}
      <SectionRenderer sections={sections} />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <HomepageContent />
    </Suspense>
  );
}
