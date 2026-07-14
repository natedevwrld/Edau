import { Metadata } from 'next';
import Link from 'next/link';
import dbConnect from '@/lib/mongodb';
import SiteSettings from '@/lib/models/SiteSettings';
import PublicGallery from '@/components/PublicGallery';

export const metadata: Metadata = {
  title: 'Gallery - Edau Farm',
  description: 'Explore photos of our farm, products, and sustainable practices at Edau Farm in West Pokot, Kenya.',
};

interface GalleryImage {
  src: string;
  alt?: string;
  title?: string;
  description?: string;
}

async function getGalleryImages(): Promise<GalleryImage[]> {
  try {
    await dbConnect();
    const record = await SiteSettings.findOne({ key: 'gallery_images' }).lean<any>();
    const value = typeof record?.value === 'string' ? record.value : '';

    if (!value) {
      return [];
    }

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((item: any) => item?.src) : [];
    } catch {
      return [];
    }
  } catch {
    return [];
  }
}

export default async function GalleryPage() {
  const galleryImages = await getGalleryImages();
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Farm Gallery</h1>
          <p className="text-lg text-primary-100 max-w-2xl mx-auto">
            Take a visual journey through Edau Farm. See our sustainable practices, quality products, and the beautiful landscape of West Pokot.
          </p>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PublicGallery images={galleryImages} />

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Want to see the farm in person?</p>
          <Link
            href="/farm-visits"
            className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Book a Farm Visit
          </Link>
        </div>
      </div>
    </div>
  );
}
