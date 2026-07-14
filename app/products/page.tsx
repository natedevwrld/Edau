'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import CategoryFilter from '@/components/CategoryFilter';
import MobileFilter from '@/components/MobileFilter';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FiFilter, FiPackage, FiSearch, FiShuffle, FiStar } from 'react-icons/fi';
import axios from 'axios';

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category'));
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('createdAt');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [shuffleProducts, setShuffleProducts] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchParams.get('focus') && searchInputRef.current) {
      window.setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchParams]);

  useEffect(() => {
    const category = searchParams.get('category');
    const search = searchParams.get('q') || searchParams.get('search');
    setSelectedCategory(category);
    setSearchQuery(search || '');
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
    const interval = window.setInterval(() => {
      fetchProducts();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [selectedCategory, searchQuery, sortBy, page, shuffleProducts]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/products/categories');
      setCategories(res.data.categories || []);
    } catch {
      setCategories([]);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);

    try {
      const params: any = {
        page,
        limit: 12,
        timestamp: Date.now(),
      };

      if (sortBy.startsWith('-')) {
        params.sortBy = sortBy.substring(1);
        params.order = 'desc';
      } else if (sortBy === 'price-low') {
        params.sort = 'price-low';
      } else if (sortBy === 'price-high') {
        params.sort = 'price-high';
      } else if (sortBy === 'rating') {
        params.sort = 'rating';
      } else {
        params.sortBy = sortBy;
        params.order = 'desc';
      }

      if (selectedCategory) {
        const normalizedCategory = selectedCategory
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        params.category = normalizedCategory;
      }
      if (searchQuery) params.search = searchQuery;

      const res = await axios.get('/api/products', {
        params,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });

      let fetchedProducts = res.data.products || [];
      if (shuffleProducts && fetchedProducts.length > 0) {
        fetchedProducts = [...fetchedProducts].sort(() => Math.random() - 0.5);
      }

      setProducts(fetchedProducts);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch {
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-6 shadow-[0_30px_80px_-35px_rgba(15,23,42,0.35)] sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.2),_transparent_40%)]" />
        <div className="relative">
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-700">
            <FiStar className="mr-2 h-3.5 w-3.5" /> Fresh from the farm
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl lg:text-5xl">
            Curated farm favourites for modern homes.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg">
            Discover premium honey, seasonal produce, and healthy livestock with fast ordering and simple delivery.
          </p>
          <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={(e) => { e.preventDefault(); setPage(1); }}>
            <div className="relative flex-1">
              <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search honey, fruits, livestock..." className="w-full rounded-full border border-neutral-200 bg-white/90 py-3 pl-11 pr-4 text-sm text-neutral-800 shadow-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
            </div>
            <button type="submit" className="rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 md:hidden">
        <MobileFilter categories={categories} selectedCategory={selectedCategory} onSelectCategory={(cat) => { setSelectedCategory(cat); setPage(1); }} sortBy={sortBy} onSortChange={setSortBy} />
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-4">
        <div className="hidden md:block md:col-span-1">
          <CategoryFilter categories={categories} selectedCategory={selectedCategory} onSelectCategory={(cat) => { setSelectedCategory(cat); setPage(1); }} />
          <div className="mt-4 rounded-[1.4rem] border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
              <FiFilter className="h-4 w-4" /> Sort your browse
            </div>
            <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} className="mt-4 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100">
              <option value="createdAt">Newest first</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="rating">Highest rated</option>
              <option value="title">Name: A to Z</option>
            </select>
            <label className="mt-4 flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm text-neutral-700">
              <span className="flex items-center gap-2"><FiShuffle className="h-4 w-4" /> Shuffle results</span>
              <input type="checkbox" checked={shuffleProducts} onChange={(e) => { setShuffleProducts(e.target.checked); setPage(1); }} className="h-4 w-4 rounded border-neutral-300 text-amber-600 focus:ring-amber-500" />
            </label>
          </div>
        </div>

        <div className="md:col-span-3">
          {searchQuery && (
            <div className="mb-6 rounded-[1.2rem] border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm text-neutral-700">
              Search results for <span className="font-semibold text-neutral-900">“{searchQuery}”</span>
              {products.length > 0 && <span className="ml-2 text-neutral-500">({products.length} found)</span>}
            </div>
          )}

          {loading ? (
            <LoadingSpinner branded={true} />
          ) : products.length === 0 ? (
            <div className="rounded-[1.6rem] border border-dashed border-neutral-300 bg-neutral-50 py-20 text-center">
              <FiPackage className="mx-auto h-14 w-14 text-neutral-400" />
              <p className="mt-4 text-xl font-semibold text-neutral-800">No products matched your browse</p>
              <p className="mt-2 text-sm text-neutral-500">Try another keyword or clear your filters.</p>
              {(selectedCategory || searchQuery) && (
                <button onClick={() => { setSelectedCategory(null); setSearchQuery(''); setPage(1); }} className="mt-5 rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <button onClick={() => setPage(page - 1)} disabled={page === 1} className="rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50">
                    ← Previous
                  </button>
                  <span className="rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700">
                    Page <span className="text-neutral-950">{page}</span> of {totalPages}
                  </span>
                  <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50">
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><LoadingSpinner /></div>}>
      <ProductsContent />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';
