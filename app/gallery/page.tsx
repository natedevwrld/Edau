import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import dbConnect from '@/lib/mongodb';
import SiteSettings from '@/lib/models/SiteSettings';
import { buildGalleryShareUrl } from '@/lib/utils';

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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://edaufarm.com';
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryImages.length > 0 ? (
            galleryImages.map((image, index) => (
              <div
                key={`${image.src}-${index}`}
                className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="aspect-square bg-gradient-to-br from-primary-700 via-amber-500 to-emerald-700">
                  <Image
                    src={image.src}
                    alt={image.alt || 'Farm gallery image'}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="text-lg font-bold">{image.title}</h3>
                    <p className="text-sm text-gray-200">{image.description}</p>
                    <a
                      href={buildGalleryShareUrl(baseUrl, image.src)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-sm font-medium text-white underline"
                    >
                      Copy or share link
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="md:col-span-2 lg:col-span-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-neutral-600">
              Gallery images will appear here once they are added from the admin settings.
            </div>
          )}
        </div>

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
