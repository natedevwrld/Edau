
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { convertAndFormatPrice } from './currencyFormat';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


// Default: KES as base, KES as display
export function formatPrice(price: number, fromCurrency: string = 'KES', toCurrency: string = 'KES'): string {
  return convertAndFormatPrice(price, fromCurrency, toCurrency);
}

export function formatKSh(price: number): string {
  return `KSh ${price.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function calculateDiscount(price: number, compareAtPrice?: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

import { randomUUID } from 'crypto';

export function generateId(): string {
  return randomUUID();
}

export function generateOrderNumber(): string {
  return `MB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

export function normalizeProductPayload(product: any) {
  const productId = product?.id || product?._id?.toString() || '';
  return {
    _id: product?._id?.toString() || productId,
    id: productId,
    name: product?.name || product?.title || 'Product',
    title: product?.title || product?.name || 'Product',
    slug: product?.slug || '',
    description: product?.description || 'No description available',
    price: product?.price || 0,
    compareAtPrice: product?.compare_at_price || product?.compareAtPrice || 0,
    compare_at_price: product?.compare_at_price || product?.compareAtPrice || 0,
    images: Array.isArray(product?.images) ? product.images : [],
    category: product?.category || product?.category_id || 'Uncategorized',
    category_id: product?.category_id || product?.category || null,
    unit_type: product?.unit_type || 'piece',
    is_organic: Boolean(product?.is_organic),
    rating: {
      average: product?.rating_avg || 0,
      count: product?.rating_count || 0,
    },
    rating_avg: product?.rating_avg || 0,
    rating_count: product?.rating_count || 0,
    stock: product?.stock ?? product?.quantity ?? 0,
    quantity: product?.quantity ?? product?.stock ?? 0,
    is_in_stock: product?.is_in_stock ?? (product?.quantity ?? product?.stock ?? 0) > 0,
    is_featured: Boolean(product?.is_featured),
    is_seasonal: Boolean(product?.is_seasonal),
    origin_farm: product?.origin_farm || null,
    harvest_date: product?.harvest_date || null,
    specifications: Array.isArray(product?.specifications) ? product.specifications : [],
    tags: Array.isArray(product?.tags) ? product.tags : [],
    created_at: product?.created_at || product?.createdAt || null,
  };
}

export function buildGalleryShareUrl(baseUrl: string, imagePath: string | number) {
  const safePath = typeof imagePath === 'number' ? `?image=${imagePath}` : imagePath;
  return `${baseUrl}${safePath.startsWith('/') ? safePath : `/${safePath}`}`;
}
