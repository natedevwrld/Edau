'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiArrowRight, FiChevronLeft, FiChevronRight, FiPlay } from 'react-icons/fi';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  cta: string;
  ctaLink: string;
  bgGradient: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: 'Pure Acacia Honey from West Pokot',
    subtitle: 'Hand-harvested, raw, and rich in nature’s goodness for homes that value quality.',
    image: 'https://images.unsplash.com/photo-1587049352846-4a232e259e83?w=1200&q=80',
    cta: 'Shop Honey',
    ctaLink: '/products?category=honey',
    bgGradient: 'from-amber-700 via-amber-800 to-amber-900',
  },
  {
    id: 2,
    title: 'Fresh Fruits, Delivered at Peak Flavor',
    subtitle: 'Seasonal fruits harvested daily and packed for a brighter table.',
    image: 'https://images.unsplash.com/photo-1619566636858-adf8ef8c7d23?w=1200&q=80',
    cta: 'Shop Fruits',
    ctaLink: '/products?category=fruits',
    bgGradient: 'from-green-700 via-emerald-800 to-green-900',
  },
  {
    id: 3,
    title: 'Healthy Livestock and Poultry',
    subtitle: 'Premium breeds raised on natural pasture with care, quality, and traceability.',
    image: 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=1200&q=80',
    cta: 'Explore Farm Products',
    ctaLink: '/products',
    bgGradient: 'from-slate-700 via-slate-800 to-slate-900',
  },
];

export default function HeroBanner({ className = '' }: { className?: string }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [heroVideoUrl, setHeroVideoUrl] = useState<string | null>(null);
  const [heroTitle, setHeroTitle] = useState('Farm-fresh quality, delivered with heart.');
  const [heroSubtitle, setHeroSubtitle] = useState('From premium honey to seasonal produce and healthy livestock, Edau Farm brings the countryside to your doorstep.');

  useEffect(() => {
    async function fetchHeroSettings() {
      try {
        const response = await fetch('/api/site-settings');
        const data = await response.json();
        const videoUrl = data?.settings?.hero_background_video_url;
        if (typeof videoUrl === 'string' && videoUrl.trim()) {
          setHeroVideoUrl(videoUrl.trim());
        }
        if (typeof data?.settings?.hero_title === 'string' && data.settings.hero_title.trim()) {
          setHeroTitle(data.settings.hero_title.trim());
        }
        if (typeof data?.settings?.hero_subtitle === 'string' && data.settings.hero_subtitle.trim()) {
          setHeroSubtitle(data.settings.hero_subtitle.trim());
        }
      } catch {
        // Fall back to the default experience.
      }
    }

    fetchHeroSettings();
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || heroVideoUrl) return;

    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [isAutoPlaying, heroVideoUrl]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    window.setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
  };

  if (heroVideoUrl) {
    return (
      <div className={`relative overflow-hidden rounded-[2rem] border border-white/20 bg-neutral-950 shadow-[0_30px_90px_-35px_rgba(0,0,0,0.55)] ${className}`}>
        <video
          src={heroVideoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/20" />
        <div className="relative flex h-full items-end p-6 sm:p-8 lg:p-10">
          <div className="max-w-xl rounded-[1.75rem] border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
            <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-100">
              <FiPlay className="mr-2 h-3.5 w-3.5" />
              Featured showcase
            </span>
            <h2 className="mt-4 text-2xl font-semibold leading-tight text-white sm:text-3xl lg:text-4xl">
              {heroTitle}
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/80 sm:text-base">
              {heroSubtitle}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/products" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:translate-y-[-1px] hover:bg-neutral-100">
                Shop now <FiArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/about" className="inline-flex items-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                Our story
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative overflow-hidden rounded-[2rem] border border-white/20 bg-neutral-950 shadow-[0_30px_90px_-35px_rgba(0,0,0,0.55)] ${className}`}>
      {slides.map((slide, index) => (
        <div key={slide.id} className={`absolute inset-0 transition-opacity duration-700 ${index === currentSlide ? 'z-10 opacity-100' : 'z-0 opacity-0'}`}>
          <div className="absolute inset-0">
            <Image src={slide.image} alt={slide.title} fill priority={index === 0} quality={85} sizes="100vw" className="object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient} opacity-90`} />
          </div>
          <div className="relative flex h-full items-end p-6 sm:p-8 lg:p-10">
            <div className="max-w-xl rounded-[1.75rem] border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/80">
                Edau Farm
              </span>
              <h2 className="mt-4 text-2xl font-semibold leading-tight text-white sm:text-3xl lg:text-4xl">{slide.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/80 sm:text-base">{slide.subtitle}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={slide.ctaLink} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:translate-y-[-1px] hover:bg-neutral-100">
                  {slide.cta} <FiArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/about" className="inline-flex items-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                  Our story
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button onClick={prevSlide} aria-label="Previous slide" className="absolute left-3 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/90 p-2.5 shadow-lg opacity-0 transition duration-300 hover:scale-110 hover:bg-white group-hover:opacity-100 sm:left-4">
        <FiChevronLeft className="h-5 w-5 text-neutral-900 sm:h-6 sm:w-6" />
      </button>
      <button onClick={nextSlide} aria-label="Next slide" className="absolute right-3 top-1/2 z-30 -translate-y-1/2 rounded-full bg-white/90 p-2.5 shadow-lg opacity-0 transition duration-300 hover:scale-110 hover:bg-white group-hover:opacity-100 sm:right-4">
        <FiChevronRight className="h-5 w-5 text-neutral-900 sm:h-6 sm:w-6" />
      </button>

      <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 space-x-2 sm:bottom-6">
        {slides.map((_, index) => (
          <button key={index} onClick={() => goToSlide(index)} aria-label={`Go to slide ${index + 1}`} className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-6 bg-white shadow-lg sm:w-8' : 'w-2 bg-white/50 hover:bg-white/80 sm:w-3'}`} />
        ))}
      </div>
    </div>
  );
}
