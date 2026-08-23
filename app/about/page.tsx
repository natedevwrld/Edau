import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import {
  FiAward,
  FiCalendar,
  FiGlobe,
  FiHeart,
  FiMapPin,
  FiPackage,
  FiShoppingBag,
  FiSun,
  FiTruck,
  FiUsers,
} from 'react-icons/fi';
import FarmStoryVideo from '@/components/FarmStoryVideo';

export const metadata: Metadata = {
  title: 'About Edau Farm - Sustainable Farming in West Pokot, Kenya',
  description:
    'Edau Farm, founded in 2015 in West Pokot, Kenya. We produce premium Acacia honey, seasonal fruits, Dorper sheep, free-range poultry, and organic vegetables using regenerative, chemical-free farming that honours ancestral land.',
};

const stats = [
  { value: '9+', label: 'Years of farming' },
  { value: '100%', label: 'Chemical-free' },
  { value: '50+', label: 'Acres cultivated' },
  { value: '24', label: 'Harvest hours' },
];

const produces = [
  {
    title: 'Pure Acacia Honey',
    description:
      'Raw, unprocessed honey harvested from the acacia woodlands of West Pokot, gently strained and bottled in branded, food-grade containers for the pantry and the bulk buyer.',
    icon: '🍯',
    href: '/products?category=honey',
    color: 'honey',
  },
  {
    title: 'Fresh Seasonal Fruits',
    description:
      'Mangoes, pawpaws, passion fruits, and avocados grown under the West Pokot sun and picked at peak ripeness for maximum flavour and nutrition.',
    icon: '🥭',
    href: '/products?category=fruits',
    color: 'green',
  },
  {
    title: 'Dorper Sheep',
    description:
      'Hardy, premium Dorper breeding stock and meat sheep raised on natural pasture, known for tender, lean meat and excellent maternal qualities.',
    icon: '🐑',
    href: '/products?category=livestock',
    color: 'slate',
  },
  {
    title: 'Free-Range Poultry',
    description:
      'Chickens and table eggs raised on open pasture, moving naturally across the farm so every egg and bird is rich in flavour and good-for-you nutrition.',
    icon: '🐔',
    href: '/products?category=poultry',
    color: 'amber',
  },
  {
    title: 'Organic Vegetables',
    description:
      'Seasonal vegetables grown without synthetic fertilizers or pesticides, hand-grown in our kitchen gardens and delivered fresh to your door.',
    icon: '🥦',
    href: '/products?category=vegetables',
    color: 'forest',
  },
];

const values = [
  {
    title: 'Regenerative Farming',
    description:
      'We build soil health with compost, cover crops, and rotational grazing so the land gives more back each year than we take.',
    Icon: FiSun,
  },
  {
    title: 'Chemical-Free Growing',
    description:
      'No synthetic pesticides, herbicides, or hormones touch our produce. We protect the land for the next generation the old-fashioned way.',
    Icon: FiAward,
  },
  {
    title: 'Community First',
    description:
      'We work with smallholder neighbours, school feeding programs, and local markets to put food on tables and income in pockets across West Pokot.',
    Icon: FiUsers,
  },
  {
    title: 'Full Traceability',
    description:
      'From seed to shelf you know exactly where your food came from — and which farmer tended it with care.',
    Icon: FiGlobe,
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-800">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-900 via-primary-950 to-forest-950 text-white">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2100&q=80"
            alt="West Pokot farmland at sunrise"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(251,191,21,0.18),transparent_45%)]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-honey-400/40 bg-honey-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-honey-300">
            <FiCalendar className="h-3.5 w-3.5" /> Est. 2015 · West Pokot, Kenya
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Edau Farm — Where Tradition Meets Sustainability
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-7 text-neutral-200 sm:text-xl">
            Premium Acacia honey, seasonal fruits, Dorper sheep, free-range poultry,
            and organic vegetables — grown in the red soils of West Pokot and delivered
            fresh to your table.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-full bg-honey-500 px-6 py-3 text-sm font-semibold text-neutral-950 transition hover:translate-y-[-1px] hover:bg-honey-400"
            >
              <FiShoppingBag className="h-4 w-4" />
              Shop Our Farm
            </Link>
            <Link
              href="/farm-visits"
              className="inline-flex items-center gap-2 rounded-full border border-honey-400/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <FiMapPin className="h-4 w-4" />
              Book a Farm Visit
            </Link>
          </div>
        </div>
      </section>

      {/* Story + Video */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <span className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary-700">
              <FiSun className="h-3.5 w-3.5" /> Our Story
            </span>
            <h2 className="mt-4 text-3xl font-bold text-neutral-900 sm:text-4xl">
              A farm rooted in West Pokot, grown for Kenya
            </h2>
            <p className="mt-6 text-lg leading-8 text-neutral-700">
              Founded in 2015 on a small plot along the Kitale-Kapenguria road, Edau Farm
              began with a single question: can small-scale farming feed families well
              while healing the land? Today, across 50+ acres of red soil and acacia
              woodland, we raise that experiment into a working model of regenerative
              agriculture.
            </p>
            <p className="mt-6 text-lg leading-8 text-neutral-700">
              We draw on the traditional knowledge of West Pokot smallholder farmers —
              dryland farming, natural pasture rotation, and seasonal timing passed down
              through generations — and layer in the care and traceability modern families
              expect. Every jar of honey, every mango, and every flock of free-range
              layers is tended by neighbours who call this place home.
            </p>
            <p className="mt-6 text-lg leading-8 text-neutral-700">
              We deliver nationwide, paid for with M-Pesa, because good food should not
              stop at the county border.
            </p>
            <div className="mt-10 flex items-center gap-6">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Talk to us
              </Link>
              <span className="text-sm text-neutral-500">West Pokot County, Kenya</span>
            </div>
          </div>
          <div className="pt-4 lg:pt-0">
            <FarmStoryVideo />
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-gradient-to-b from-neutral-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-4xl gap-12 text-center">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Our Mission</h2>
              <p className="mt-4 text-lg leading-8 text-neutral-700">
                To nurture the land and our communities by producing healthy, chemical-free
                food through small-scale, regenerative farming that honours the wisdom of
                West Pokot farmers and respects the seasons.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">Our Vision</h2>
              <p className="mt-4 text-lg leading-8 text-neutral-700">
                A Kenya where every family has access to clean, nourishing food grown
                within their region — and where sustainable farming restores rather than
                depletes our soil, water, and biodiversity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Produce */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary-700">
              <FiPackage className="h-3.5 w-3.5" /> What We Grow & Raise
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              From our farm to your table
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-neutral-600 mx-auto">
              Every product carries the flavour of the West Pokot highlands and the care
              of smallholder farmers who work with nature, not against it.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {produces.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group flex h-full flex-col rounded-[1.5rem] border border-neutral-200 bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-md"
              >
                <span className="text-4xl" aria-hidden="true">
                  {item.icon}
                </span>
                <h3 className="mt-4 text-lg font-bold text-neutral-900 group-hover:text-primary-700">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600 flex-1">
                  {item.description}
                </p>
                <span className="mt-4 text-sm font-semibold text-honey-700">
                  Shop now →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gradient-to-b from-neutral-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-flex items-center rounded-full border border-honey-200 bg-honey-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-700">
              <FiHeart className="h-3.5 w-3.5" /> Our Roots
            </span>
            <h2 className="mt-4 text-3xl font-bold text-neutral-900">The practices that feed us all</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-neutral-600 mx-auto">
              Sustainability is not a marketing word for us — it is how we put food on the
              table and keep the farm healthy for the next generation.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {values.map((value) => (
              <div
                key={value.title}
                className="flex gap-5 rounded-[1.5rem] border border-neutral-200 bg-white p-6 shadow-soft"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-honey-100 text-honey-700">
                  <value.Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">{value.title}</h3>
                  <p className="mt-1 text-neutral-600">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[1.5rem] border border-neutral-200 bg-white p-6 text-center shadow-soft"
              >
                <div className="text-4xl font-extrabold text-primary-700">{stat.value}</div>
                <p className="mt-1 text-sm text-neutral-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary-900 to-forest-950 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold sm:text-4xl">Taste the difference West Pokot makes</h2>
          <p className="mt-4 text-lg text-neutral-200">
            Join thousands of Kenyan families who already shop directly from the farm.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-honey-500 px-7 py-3.5 text-sm font-semibold text-neutral-950 transition hover:translate-y-[-1px] hover:bg-honey-400"
            >
              <FiShoppingBag className="h-4 w-4" />
              Browse the farm
            </Link>
            <Link
              href="/farm-visits"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-honey-400/40 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <FiTruck className="h-4 w-4" />
              Visit us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
