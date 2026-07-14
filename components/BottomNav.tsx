'use client';


import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiGrid, FiImage, FiUser } from 'react-icons/fi';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
// Removed currency context and state


export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { href: '/', icon: FiHome, label: t('nav.home') },
    { href: '/products', icon: FiGrid, label: t('nav.categories') },
    { href: '/gallery', icon: FiImage, label: t('nav.gallery') },
    { href: '/dashboard', icon: FiUser, label: t('nav.account') },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2 relative">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative',
                isActive ? 'text-primary-600' : 'text-gray-600'
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
