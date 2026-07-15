import NewsletterSection from '@/components/NewsletterSection';
import ProductCard from '@/components/ProductCard';
import ErrorBoundary from '@/components/ErrorBoundary';
import FarmStoryVideo from '@/components/FarmStoryVideo';
import HeroBanner from '@/components/HeroBanner';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import dbConnect from '@/lib/mongodb';
import Category from '@/lib/models/Category';
import Product from '@/lib/models/Product';
import SiteSettings from '@/lib/models/SiteSettings';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Edau Farm - Premium Honey, Fruits, Livestock & Poultry from West Pokot',
  description: "West Pokot's premier sustainable farm since 2015. Premium Acacia honey, fresh seasonal fruits, Dorper sheep, and free-range poultry. Order online with M-Pesa delivery across Kenya.",
};

const stats = [
  { value: '9+', label: 'Years' },
  { value: '100%', label: 'Organic' },
  { value: '50+', label: 'Acres' },
];

const features = [
  {
    title: 'Pure Acacia Honey',
    description: 'Processed and hygienically packaged honey in branded containers, available in a range of sizes for every home and business.',
    href: '/products?category=honey',
  },
  {
    title: 'Seasonal Fruits',
    description: 'Sun-ripened mangoes, pawpaws, and passion fruits grown without chemicals.',
    href: '/products?category=fruits',
  },
  {
    title: 'Quality Livestock',
    description: 'Premium Dorper sheep raised on natural West Pokot pastures.',
    href: '/products?category=livestock',
  },
  {
    title: 'Free-Range Poultry',
    description: 'Healthy birds and eggs from open-pasture farming.',
    href: '/products?category=poultry',
  },
];

async function getCategories() {
  try {
    await dbConnect();
    const categories = await Category.find({ is_active: true })
      .sort({ display_order: 1 })
      .limit(6)
      .lean();

    return categories || [];
  } catch {
    return [];
  }
}

async function getFeaturedProducts() {
  try {
    await dbConnect();
    const products = await Product.find({ is_featured: true, is_in_stock: true })
      .sort({ created_at: -1 })
      .limit(8)
      .lean();

    return (products || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      compare_at_price: p.compare_at_price,
      images: p.images || [],
      category_id: p.category_id,
      unit_type: p.unit_type,
      is_organic: p.is_organic,
      rating_avg: p.rating_avg,
      rating_count: p.rating_count,
      quantity: p.quantity,
      is_in_stock: p.is_in_stock,
      is_featured: p.is_featured,
      created_at: p.created_at,
    }));
  } catch {
    return [];
  }
}

async function getSiteSettings() {
  try {
    await dbConnect();
    const settings = await SiteSettings.find({}).lean();

    return settings.reduce<Record<string, unknown>>((acc, item: any) => {
    const value = item.value?.trim();
    if (!value) {
      acc[item.key] = '';
      return acc;
    }

    try {
      if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
        acc[item.key] = JSON.parse(value);
      } else {
        acc[item.key] = value;
      }
    } catch {
      acc[item.key] = value;
    }

      return acc;
    }, {});
  } catch {
    return {};
  }
}

export default async function Home() {
  const [categories, products, siteSettings] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
    getSiteSettings(),
  ]);

  // Fallback farm categories so the landing page always showcases the
  // provided Edau imagery when the Category collection is empty.
  const displayCategories =
    categories && categories.length > 0
      ? categories
      : [
          { id: 'honey', slug: 'honey', name: 'Pure Honey', description: 'Processed and beautifully packaged honey in branded containers of every size, from pantry jars to bulk.' },
          { id: 'fruits', slug: 'fruits', name: 'Seasonal Fruits', description: 'Fresh, sun-ripened farm fruits.' },
          { id: 'livestock', slug: 'livestock', name: 'Dorper Sheep', description: 'Quality livestock from West Pokot.' },
          { id: 'poultry', slug: 'poultry', name: 'Free-Range Poultry', description: 'Improved Kienyeji poultry.' },
        ];

  const heroImageUrl = typeof siteSettings.hero_image_url === 'string' ? siteSettings.hero_image_url : '';
  const heroImageAlt = typeof siteSettings.hero_image_alt === 'string' ? siteSettings.hero_image_alt : 'Edau Farm hero image';
  const honeyImage = EDAU_IMAGES.honey;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Split Layout */}
      <section className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 radial-gradient" />
        <div className="absolute inset-0 grid-bg opacity-50" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 lg:pt-20 pb-16 lg:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Editorial Typography */}
            <div className="flex flex-col justify-center">
              <div className="mb-6">
                <span className="inline-flex items-center gap-2 bg-primary-50 text-primary-900 text-sm font-medium px-4 py-1.5 rounded-full">
                  <span className="w-2 h-2 bg-primary-500 rounded-full" />
                  West Pokot, Kenya
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-950 leading-[1.1] tracking-tight mb-6">
                Farm-fresh quality.
                <br />
                <span className="text-primary-700">Delivered to you.</span>
              </h1>

              <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed max-w-lg mb-8">
                Premium Acacia honey, seasonal fruits, quality livestock, and free-range poultry from our sustainable farm to your home.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center gap-2 bg-neutral-950 hover:bg-neutral-800 text-white px-8 py-4 rounded-full font-medium transition-all hover:shadow-lg"
                >
                  Shop Now
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center gap-2 border-2 border-neutral-200 hover:border-neutral-300 text-neutral-700 px-8 py-4 rounded-full font-medium transition-colors"
                >
                  Our Story
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-neutral-200">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <div className="text-3xl sm:text-4xl font-bold text-neutral-950">{stat.value}</div>
                    <div className="text-sm text-neutral-500 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Hero showcase */}
            <div className="w-full lg:block">
              <HeroBanner className="h-[500px] lg:h-[600px]" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 lg:py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="group bg-white rounded-2xl p-6 border border-neutral-100 hover:border-neutral-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                  <span className="text-2xl">
                    {i === 0 ? '🍯' : i === 1 ? '🥭' : i === 2 ? '🐑' : '🐔'}
                  </span>
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2 group-hover:text-primary-700 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {feature.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Edau Honey - Premium Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary-700 via-amber-500 to-emerald-700">
              {honeyImage || heroImageUrl ? (
                <Image
                  src={honeyImage || heroImageUrl}
                  alt={heroImageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  loading="lazy"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
            <div>
              <span className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                Premium Quality
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-950 tracking-tight mb-4">
                Edau Acacia Honey
              </h2>
              <p className="text-lg text-neutral-600 leading-relaxed mb-8">
                Our honey is processed with care and beautifully packaged in branded jars and containers of various sizes — from a 250g jar to a 20-litre jerry can — so you get farm-fresh quality, sealed for freshness and ready for your shelf.
              </p>

              {/* Pricing Table */}
              <div className="bg-white rounded-2xl shadow-lg border border-amber-100 overflow-hidden mb-8">
                <div className="grid grid-cols-2 gap-px bg-amber-100">
                  <div className="bg-white p-4">
                    <div className="text-sm text-neutral-500">Size</div>
                    <div className="font-semibold text-neutral-900">250g</div>
                  </div>
                  <div className="bg-white p-4 text-right">
                    <div className="text-sm text-neutral-500">Price</div>
                    <div className="font-semibold text-amber-700">Ksh 300</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-px bg-amber-100">
                  <div className="bg-white p-4">
                    <div className="font-semibold text-neutral-900">500g</div>
                  </div>
                  <div className="bg-white p-4 text-right">
                    <div className="font-semibold text-amber-700">Ksh 500</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-px bg-amber-100">
                  <div className="bg-white p-4">
                    <div className="font-semibold text-neutral-900">1 KG</div>
                  </div>
                  <div className="bg-white p-4 text-right">
                    <div className="font-semibold text-amber-700">Ksh 900</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-px bg-amber-100">
                  <div className="bg-white p-4">
                    <div className="font-semibold text-neutral-900">3 Litres</div>
                  </div>
                  <div className="bg-white p-4 text-right">
                    <div className="font-semibold text-amber-700">Ksh 4,000</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-px bg-amber-100">
                  <div className="bg-white p-4">
                    <div className="font-semibold text-neutral-900">5 Litres</div>
                  </div>
                  <div className="bg-white p-4 text-right">
                    <div className="font-semibold text-amber-700">Ksh 6,500</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-px bg-amber-100">
                  <div className="bg-white p-4">
                    <div className="font-semibold text-neutral-900">10 Litres</div>
                  </div>
                  <div className="bg-white p-4 text-right">
                    <div className="font-semibold text-amber-700">Ksh 9,000</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-px bg-amber-100">
                  <div className="bg-amber-50 p-4">
                    <div className="font-bold text-neutral-900">20 Litres</div>
                    <div className="text-xs text-amber-600">Best Value</div>
                  </div>
                  <div className="bg-amber-50 p-4 text-right">
                    <div className="font-bold text-amber-700">Ksh 15,000</div>
                  </div>
                </div>
              </div>

              <Link
                href="/products?category=honey"
                className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-full font-medium transition-colors"
              >
                Order Honey
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-950 tracking-tight">
                Featured Products
              </h2>
              <p className="text-neutral-500 mt-2">Handpicked quality from our farm</p>
            </div>
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {products.length > 4 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
              {products.slice(4, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="mt-12 text-center sm:hidden">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-neutral-950 hover:bg-neutral-800 text-white px-6 py-3 rounded-full font-medium transition-colors"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 lg:py-24 bg-neutral-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 dot-bg opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <span className="text-primary-400 text-sm font-medium uppercase tracking-wider">
                Our Story
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-4 mb-6 leading-tight tracking-tight">
                Where tradition<br />meets sustainability
              </h2>
              <p className="text-neutral-400 text-lg leading-relaxed mb-8">
                Nestled in the heart of West Pokot, Edau Farm has been a beacon of sustainable agriculture since 2015. Our commitment to organic practices and traditional farming methods ensures every product is pure, natural, and full of flavor.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center gap-2 bg-white text-neutral-950 px-6 py-3 rounded-full font-medium hover:bg-neutral-100 transition-colors"
                >
                  Learn More
                </Link>
                <Link
                  href="/farm-visits"
                  className="inline-flex items-center justify-center gap-2 border border-neutral-700 text-white px-6 py-3 rounded-full font-medium hover:bg-neutral-800 transition-colors"
                >
                  Visit the Farm
                </Link>
              </div>
            </div>
            <FarmStoryVideo />
          </div>
        </div>
      </section>

      {/* Categories - Editorial Cards */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-950 tracking-tight">
              Shop by Category
            </h2>
            <p className="text-neutral-500 mt-2">Explore our farm&apos;s best offerings</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {displayCategories.map((category, i) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className={`group relative overflow-hidden rounded-2xl ${i === 0 ? 'col-span-2 lg:col-span-2 row-span-2' : ''}`}
              >
                <div className={`relative ${i === 0 ? 'h-[400px] lg:h-full' : 'h-[200px] lg:h-[280px]'}`}>
                  <Image
                    src={getCategoryImage(category.slug)}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-white font-bold text-2xl lg:text-3xl mb-1">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-white/80 text-sm line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Location / Map */}
      <section className="py-16 lg:py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-950 tracking-tight">
              Find Us
            </h2>
            <p className="text-neutral-500 mt-2">Visit Edau Farm in West Pokot, Kenya</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-stretch">
            <div className="lg:col-span-1 flex flex-col justify-center gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📍</span>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">Edau Farm</h3>
                  <p className="text-sm text-neutral-500">
                    West Pokot, Kenya
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    1.3320408, 35.2286904
                  </p>
                </div>
              </div>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Come see our sustainable farming in person — tour the apiaries, orchards, and pastures, and taste our honey fresh from the source.
              </p>
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=1.3320408,35.2286904"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-neutral-950 hover:bg-neutral-800 text-white px-6 py-3 rounded-full font-medium transition-colors w-fit"
              >
                Get Directions
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>

            <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-neutral-100 shadow-lg">
              <iframe
                title="Edau Farm location"
                src="https://maps.google.com/maps?q=1.3320408,35.2286904&z=15&output=embed"
                width="100%"
                height="420"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-[320px] lg:h-[420px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <ErrorBoundary>
        <NewsletterSection />
      </ErrorBoundary>
    </div>
  );
}

function getCategoryImage(slug: string): string {
  const images: Record<string, string> = {
    'honey': EDAU_IMAGES.honey,
    'fruits': EDAU_IMAGES.fruits,
    'livestock': EDAU_IMAGES.sheep,
    'poultry': EDAU_IMAGES.poultry,
    'vegetables': 'https://images.unsplash.com/photo-1540420779-6626-4b7a-b4ab-0b59e89c1c0d?w=800&q=80',
    'dairy': 'https://images.unsplash.com/photo-1628088062854-d8c8cf37c0f5?w=800&q=80',
  };
  return images[slug] || 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4e7?w=800&q=80';
}

const EDAU_IMAGES = {
  honey: 'https://res.cloudinary.com/dt05sixza/image/upload/v1767535679/edau_gallery/pm4gjp92azavkry6w1uy.jpg',
  sheep: 'https://res.cloudinary.com/dt05sixza/image/upload/v1767535826/edau_gallery/sag1w1ph379oskzy9zql.jpg',
  fruits: 'https://res.cloudinary.com/dt05sixza/image/upload/v1767181057/edau_gallery/kia7i5ewpg1rhkqadufv.jpg',
  poultry: 'https://res.cloudinary.com/dt05sixza/image/upload/v1780680793/edau_gallery/oezwqkgmkfxg03tpo3ly.jpg',
};
