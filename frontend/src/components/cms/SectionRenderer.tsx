'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Truck,
  BadgeCheck,
  Shield,
  Phone,
  MessageSquare,
  Sparkles,
  Clock,
  Heart,
  Award,
  Tag,
  Gift,
  AlertCircle,
} from 'lucide-react';
import { HomepageSection, Product } from '@/types';
import { useCategories, useFeaturedProducts, useProducts } from '@/hooks/useProducts';
import CategoryCard from '@/components/products/CategoryCard';
import ProductGrid from '@/components/products/ProductGrid';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const STORE_PHONE = '+91 72569 55630';
const RAW_PHONE = '917256955630';
const WA_MSG = 'Hello Krishna Enterprises, I would like to order fresh groceries in Madhuban, East Champaran!';

// Helper to resolve trust icons
function renderTrustIcon(iconName?: string) {
  const icon = (iconName || '').toLowerCase().trim();
  switch (icon) {
    case 'truck':
      return <Truck className="h-5 w-5" />;
    case 'badge-check':
    case 'badgecheck':
    case 'check':
      return <BadgeCheck className="h-5 w-5" />;
    case 'shield':
    case 'security':
      return <Shield className="h-5 w-5" />;
    case 'clock':
    case 'time':
      return <Clock className="h-5 w-5" />;
    case 'heart':
      return <Heart className="h-5 w-5" />;
    case 'award':
    case 'star':
      return <Award className="h-5 w-5" />;
    case 'tag':
    case 'discount':
      return <Tag className="h-5 w-5" />;
    case 'gift':
      return <Gift className="h-5 w-5" />;
    default:
      return <Shield className="h-5 w-5" />;
  }
}

// ── 1. Hero Section ──────────────────────────────────────────────────────────
function HeroSection({ section }: { section: HomepageSection }) {
  const badge = section.badge ?? "🌿 Madhuban, East Champaran's Trusted Grocery Store";
  const title = section.title || "Fresh Groceries Delivered To\nYour Doorstep";
  const subtitle =
    section.subtitle ||
    'Order atta, rice, dal, oil, spices and daily essentials online. Instant UPI QR scan & pay. Doorstep delivery across Madhuban & East Champaran, Bihar.';
  const primaryText = section.content?.ctaPrimaryText ?? 'Shop All Products';
  const primaryLink = section.content?.ctaPrimaryLink ?? '/products';
  const secondaryText = section.content?.ctaSecondaryText ?? 'View Featured Deals';
  const secondaryLink = section.content?.ctaSecondaryLink ?? '/products?featured=true';

  const titleParts = title.split('\n');

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-green-800 via-green-700 to-green-600 px-4 py-12 sm:py-16 text-white sm:px-6 shadow-xs">
      <div
        aria-hidden
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative mx-auto max-w-4xl text-center space-y-4">
        {badge && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1 text-xs font-bold backdrop-blur-md border border-white/20 text-green-100 shadow-2xs">
            {badge}
          </span>
        )}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
          {titleParts[0]}
          {titleParts.length > 1 && (
            <>
              <br className="hidden sm:inline" />
              <span className="text-orange-300"> {titleParts.slice(1).join(' ')}</span>
            </>
          )}
        </h1>
        {subtitle && (
          <p className="mx-auto max-w-xl text-xs sm:text-sm text-green-100 leading-relaxed font-medium">
            {subtitle}
          </p>
        )}

        <div className="pt-2 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {primaryText && primaryLink && (
            <Link
              href={primaryLink}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3 text-xs sm:text-sm font-black text-green-800 shadow-md hover:bg-gray-50 transition-all hover:scale-105"
            >
              {primaryText} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          {secondaryText && secondaryLink && (
            <Link
              href={secondaryLink}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border-2 border-white/40 px-7 py-3 text-xs sm:text-sm font-bold text-white hover:bg-white/10 transition-all"
            >
              {secondaryText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

// ── 2. Category Grid Section ────────────────────────────────────────────────
function CategoryGridSection({ section }: { section: HomepageSection }) {
  const { data: categories = [], isLoading } = useCategories();
  const title = section.title || 'Explore Categories';
  const subtitle = section.subtitle || 'Explore fresh daily staples and groceries';
  const seeAllText = section.content?.seeAllText ?? 'See all';
  const seeAllLink = section.content?.seeAllLink ?? '/products';
  const limit = section.content?.limit ?? 8;

  const displayedCategories = categories.slice(0, limit);

  return (
    <section id="categories" className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
            <span>{title}</span>
          </h2>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {seeAllLink && (
          <Link
            href={seeAllLink}
            className="text-xs font-extrabold text-green-700 hover:underline flex items-center gap-1"
          >
            {seeAllText} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : displayedCategories.length === 0 ? (
        <div className="text-center py-8 text-xs text-gray-400">No categories available</div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8">
          {displayedCategories.map((cat) => (
            <CategoryCard key={cat._id} category={cat} />
          ))}
        </div>
      )}
    </section>
  );
}

// ── 3. Product Section ──────────────────────────────────────────────────────
function ProductSection({ section }: { section: HomepageSection }) {
  const ds = section.dataSource || { type: 'all', limit: 12 };
  const limit = ds.limit ?? section.content?.limit ?? 12;

  const isFeatured = ds.type === 'featured';
  const isCategory = ds.type === 'category' && !!ds.categorySlug;

  const { data: featuredProducts = [], isLoading: featLoading } = useFeaturedProducts();
  const { data: catProductsData, isLoading: catLoading } = useProducts(
    isCategory ? { category: ds.categorySlug, limit } : { limit: 0 }
  );
  const { data: allProductsData, isLoading: allLoading } = useProducts(
    !isFeatured && !isCategory ? { limit } : { limit: 0 }
  );

  let products: Product[] = [];
  let isLoading = false;

  if (isFeatured) {
    products = featuredProducts.slice(0, limit);
    isLoading = featLoading;
  } else if (isCategory) {
    products = (catProductsData?.products || []).slice(0, limit);
    isLoading = catLoading;
  } else {
    products = (allProductsData?.products || []).slice(0, limit);
    isLoading = allLoading;
  }

  const isFeaturedBox = section.content?.cardStyle === 'featured_box' || isFeatured;

  if (isFeaturedBox) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              {section.badge && (
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200 inline-flex items-center gap-1 mb-1">
                  <Sparkles className="h-3 w-3" /> {section.badge}
                </span>
              )}
              <h2 className="text-lg sm:text-xl font-black text-gray-900">{section.title}</h2>
              {section.subtitle && <p className="text-xs text-gray-500 mt-0.5">{section.subtitle}</p>}
            </div>
            {section.content?.viewAllLink && (
              <Link
                href={section.content.viewAllLink}
                className="text-xs font-extrabold text-green-700 hover:underline flex items-center gap-1"
              >
                {section.content.viewAllText || 'View all'} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          <ProductGrid products={products} isLoading={isLoading} />
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          {section.badge && (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200 inline-flex items-center gap-1 mb-1">
              <Sparkles className="h-3 w-3" /> {section.badge}
            </span>
          )}
          <h2 className="text-lg sm:text-xl font-black text-gray-900">{section.title}</h2>
          {section.subtitle && <p className="text-xs text-gray-500 mt-0.5">{section.subtitle}</p>}
        </div>
        {section.content?.viewAllLink && (
          <Link
            href={section.content.viewAllLink}
            className="text-xs font-extrabold text-green-700 hover:underline flex items-center gap-1"
          >
            {section.content.viewAllText || 'Browse All'} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      <ProductGrid products={products} isLoading={isLoading} />
    </section>
  );
}

// ── 4. Trust Strip Section ──────────────────────────────────────────────────
function TrustStripSection({ section }: { section: HomepageSection }) {
  const title = section.title || 'Why Choose Krishna Enterprises?';
  const subtitle = section.subtitle || 'Your local grocery partner in Madhuban, East Champaran';

  const defaultItems = [
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
  ];

  const items = section.content?.items && section.content.items.length > 0 ? section.content.items : defaultItems;

  const colorClasses = [
    'bg-green-100 text-green-700 hover:border-green-200',
    'bg-orange-100 text-orange-600 hover:border-orange-200',
    'bg-blue-100 text-blue-600 hover:border-blue-200',
    'bg-purple-100 text-purple-600 hover:border-purple-200',
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 w-full">
      <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-black text-gray-900 sm:text-2xl">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {items.map((item, idx) => {
            const colorClass = colorClasses[idx % colorClasses.length];
            const iconBg = colorClass.split(' ')[0];
            const iconColor = colorClass.split(' ')[1];
            const hoverBorder = colorClass.split(' ')[2];

            return (
              <div
                key={item.id || idx}
                className={`rounded-2xl border border-gray-100 bg-gray-50/50 p-5 space-y-2 ${hoverBorder} transition-all`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
                  {renderTrustIcon(item.icon)}
                </div>
                <h3 className="text-sm font-extrabold text-gray-900">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── 5. Store Location Section ───────────────────────────────────────────────
function StoreLocationSection({ section }: { section: HomepageSection }) {
  const title = section.title || 'Krishna Enterprises';
  const subtitle =
    section.subtitle ||
    'Machhaha Chowk, Chakia - Madhuban - Sheohar Rd, Rupni, Jogaulia Tola Kharsal, Bihar 845420';
  const phone = section.content?.phone || STORE_PHONE;
  const rawPhone = (section.content?.phone || RAW_PHONE).replace(/\D/g, '');
  const callText = section.content?.callText || `Call ${phone}`;
  const whatsappText = section.content?.whatsappText || 'WhatsApp Chat';
  const waUrl = `https://wa.me/${rawPhone || RAW_PHONE}?text=${encodeURIComponent(WA_MSG)}`;

  return (
    <section className="bg-gradient-to-r from-green-900 to-green-800 py-10 px-4 text-white sm:px-6 shadow-md">
      <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-0.5 text-[11px] font-bold text-green-300">
            📍 Shop Location
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white">{title}</h3>
          <p className="text-xs text-green-200 max-w-xl">{subtitle}</p>
          <p className="text-xs text-green-300 font-bold">📞 Contact: {phone}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 shrink-0">
          <a
            href={`tel:${rawPhone || '07256955630'}`}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black text-green-900 shadow-md hover:bg-gray-100 transition-all"
          >
            <Phone className="h-4 w-4" /> {callText}
          </a>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] px-5 py-3 text-xs font-black text-white shadow-md transition-all"
          >
            <MessageSquare className="h-4 w-4" /> {whatsappText}
          </a>
        </div>
      </div>
    </section>
  );
}

// ── 6. Promotional Banner Section ───────────────────────────────────────────
function PromotionalBannerSection({ section }: { section: HomepageSection }) {
  const title = section.title || 'Special Promotion';
  const subtitle = section.subtitle;
  const badge = section.badge;
  const link = section.content?.targetLink || '/products';
  const linkText = section.content?.linkText || 'Shop Now';
  const bg = section.content?.backgroundColor || 'from-amber-600 to-orange-600';

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${bg} p-6 sm:p-8 text-white shadow-md`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-2 text-center sm:text-left">
            {badge && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold backdrop-blur-md">
                <Sparkles className="h-3 w-3" /> {badge}
              </span>
            )}
            <h3 className="text-xl sm:text-2xl font-black">{title}</h3>
            {subtitle && <p className="text-xs sm:text-sm text-white/90 max-w-xl">{subtitle}</p>}
          </div>
          {link && (
            <Link
              href={link}
              className="shrink-0 flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-xs sm:text-sm font-black text-gray-900 shadow-md hover:bg-gray-50 transition-all hover:scale-105"
            >
              {linkText} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

// ── 7. Announcement Bar Section ─────────────────────────────────────────────
function AnnouncementBarSection({ section }: { section: HomepageSection }) {
  const message = section.content?.message || section.title || 'Special discounts available on bulk orders!';
  const link = section.content?.targetLink;
  const linkText = section.content?.linkText || 'Learn More';

  return (
    <div className="w-full bg-amber-500 px-4 py-2 text-white text-center text-xs font-bold shadow-xs">
      <div className="mx-auto max-w-7xl flex items-center justify-center gap-2">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>{message}</span>
        {link && (
          <Link href={link} className="underline hover:text-amber-100 ml-1">
            {linkText} →
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Master Section Renderer ─────────────────────────────────────────────────
export default function SectionRenderer({ sections }: { sections: HomepageSection[] }) {
  if (!sections || sections.length === 0) return null;

  return (
    <div className="flex flex-col space-y-8 sm:space-y-12">
      {sections.map((section) => {
        if (!section.enabled) return null;

        switch (section.type) {
          case 'hero':
            return <HeroSection key={section.id} section={section} />;
          case 'category_grid':
            return <CategoryGridSection key={section.id} section={section} />;
          case 'product_section':
            return <ProductSection key={section.id} section={section} />;
          case 'trust_strip':
            return <TrustStripSection key={section.id} section={section} />;
          case 'store_location':
            return <StoreLocationSection key={section.id} section={section} />;
          case 'promotional_banner':
            return <PromotionalBannerSection key={section.id} section={section} />;
          case 'announcement_bar':
            return <AnnouncementBarSection key={section.id} section={section} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
