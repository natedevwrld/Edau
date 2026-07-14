import { Suspense } from 'react';
// Force dynamic rendering for every request (no cache)
export const dynamic = "force-dynamic";
import type { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';
import LoadingSpinner from '@/components/LoadingSpinner';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { normalizeProductPayload } from '@/lib/utils';

// Enable ISR with 10-second revalidation for faster price updates
export const revalidate = 10; // Revalidate every 10 seconds

// Generate static params for popular/featured products at build time
export async function generateStaticParams() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://edau-six.vercel.app'}/api/products?featured=true&limit=20`,
      { 
        next: { 
          revalidate: 600 // Cache popular products list for 10 minutes
        } 
      }
    );
    
    if (!res.ok) return [];
    
    const data = await res.json();
    const products = data.products || [];
    
    return products.map((product: any) => ({
      id: product._id,
    }));
  } catch (error) {
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://edau-six.vercel.app'}/api/products/${params.id}`,
      { 
        next: { 
          revalidate: 10 // Cache for 10 seconds
        } 
      }
    );
    
    if (!res.ok) {
      return {
        title: 'Product Not Found',
      };
    }

    const { product } = await res.json();
    
    return {
      title: `${product.title} - Edau Farm`,
      description: product.description?.substring(0, 160),
      openGraph: {
        title: product.title,
        description: product.description,
        images: product.images?.[0] ? [product.images[0]] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Product - Edau Farm',
    };
  }
}


async function getProduct(id: string) {
  try {
    await dbConnect();
    const isObjectId = /^[a-f\d]{24}$/i.test(id);
    const filter = isObjectId ? { $or: [{ id }, { _id: id }] } : { id };
    const product = await Product.findOne(filter).lean();
    if (!product) return null;
    return normalizeProductPayload(product);
  } catch (error) {
    return null;
  }
}


export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
        <p className="text-lg text-gray-600">Sorry, we couldn't find this product. It may have been removed or is unavailable.</p>
      </div>
    );
  }
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProductDetailClient initialProduct={product} />
    </Suspense>
  );
}
