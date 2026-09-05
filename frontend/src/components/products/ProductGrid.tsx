'use client';

import { memo } from 'react';
import { Product } from '@/types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products?: Product[];
  isLoading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-2xs animate-pulse space-y-3">
      <div className="h-36 sm:h-40 rounded-xl bg-gray-200" />
      <div className="space-y-2">
        <div className="h-3 w-16 rounded bg-gray-200" />
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-10 rounded bg-gray-200" />
        <div className="h-5 w-20 rounded bg-gray-200" />
        <div className="h-8 w-full rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}

function ProductGridComponent({ products = [], isLoading = false }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">🛒</div>
        <p className="text-lg font-bold text-gray-700">No products found</p>
        <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}

const ProductGrid = memo(ProductGridComponent);
export default ProductGrid;
