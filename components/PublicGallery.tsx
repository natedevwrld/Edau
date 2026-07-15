'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { buildGalleryShareUrl } from '@/lib/utils';
import { FiX, FiShare2, FiImage, FiExternalLink } from 'react-icons/fi';

interface GalleryImage {
  src: string;
  alt?: string;
  title?: string;
  description?: string;
  productId?: string;
}

export default function PublicGallery({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState<GalleryImage | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://edaufarm.com';

  if (images.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center text-neutral-600">
        <FiImage className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
        <p>Gallery images will appear here once they are added from the admin panel.</p>
      </div>
    );
  }

  return (
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 [column-fill:_balance]">
        {images.map((image, i) => {
          const tile = (
            <>
              <div className="relative w-full" style={{ minHeight: 180 }}>
                <Image
                  src={image.src}
                  alt={image.alt || image.title || 'Edau Farm gallery image'}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              {(image.title || image.description) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end text-left">
                  {image.title && <h3 className="text-white font-semibold">{image.title}</h3>}
                  {image.description && <p className="text-sm text-gray-200 line-clamp-2">{image.description}</p>}
                </div>
              )}
              {image.productId && (
                <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <FiExternalLink className="w-3 h-3" /> Product
                </span>
              )}
            </>
          );

          // Product photos link straight to the product page.
          if (image.productId) {
            return (
              <Link
                key={`${image.src}-${i}`}
                href={`/products/${image.productId}`}
                className="group mb-5 block w-full break-inside-avoid overflow-hidden rounded-2xl bg-neutral-100 shadow-sm hover:shadow-xl transition-shadow relative"
              >
                {tile}
              </Link>
            );
          }

          return (
            <button
              key={`${image.src}-${i}`}
              onClick={() => setActive(image)}
              className="group mb-5 block w-full break-inside-avoid overflow-hidden rounded-2xl bg-neutral-100 shadow-sm hover:shadow-xl transition-shadow relative"
            >
              {tile}
            </button>
          );
        })}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setActive(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            aria-label="Close"
            onClick={() => setActive(null)}
          >
            <FiX className="w-8 h-8" />
          </button>
          <div
            className="max-w-4xl w-full bg-white rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.src} alt={active.alt || active.title || 'Gallery image'} className="w-full max-h-[70vh] object-contain bg-neutral-900" />
            <div className="p-5">
              {active.title && <h3 className="text-xl font-bold text-neutral-900">{active.title}</h3>}
              {active.description && <p className="text-neutral-600 mt-1">{active.description}</p>}
              {active.productId ? (
                <Link
                  href={`/products/${active.productId}`}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:underline"
                >
                  <FiExternalLink className="w-4 h-4" /> View product
                </Link>
              ) : (
                <a
                  href={buildGalleryShareUrl(baseUrl, active.src)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:underline"
                >
                  <FiShare2 className="w-4 h-4" /> Share or copy link
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
