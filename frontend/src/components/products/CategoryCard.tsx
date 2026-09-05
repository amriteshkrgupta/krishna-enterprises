'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
  productCount?: number;
}

function CategoryCardComponent({ category, productCount }: CategoryCardProps) {
  return (
    <Link
      href={`/products?category=${category.slug}`}
      className="group flex flex-col items-center justify-between rounded-2xl border border-gray-100 bg-white p-3 shadow-2xs transition-all hover:border-green-300 hover:bg-green-50/20 hover:shadow-md hover:-translate-y-0.5 text-center"
    >
      <div className="relative h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-2xl bg-green-50/60 p-1.5 flex items-center justify-center border border-gray-100 group-hover:scale-105 transition-transform">
        {category.image && !category.image.includes('placeholder.com') ? (
          <img
            src={category.image}
            alt={category.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover rounded-xl"
          />
        ) : (
          <span className="text-3xl">🛒</span>
        )}
      </div>

      <div className="mt-2 space-y-0.5">
        <h3 className="text-xs font-extrabold text-gray-900 group-hover:text-green-700 transition-colors line-clamp-1">
          {category.name}
        </h3>
        {productCount !== undefined && (
          <p className="text-[10px] text-gray-400 font-medium">{productCount} items</p>
        )}
      </div>
    </Link>
  );
}

const CategoryCard = memo(CategoryCardComponent);
export default CategoryCard;
