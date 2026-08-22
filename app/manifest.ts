import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Edau Farm - West Pokots Premier Sustainable Farm',
    short_name: 'Edau Farm',
    description: 'Premium honey, fresh fruits, livestock, and poultry from West Pokot, Kenya. Order online with M-Pesa payment.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2e7d32',
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      {
        src: '/logo.png',
        sizes: '1254x1254',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    categories: ['shopping', 'food', 'lifestyle'],
    shortcuts: [
      {
        name: 'Shop Products',
        short_name: 'Shop',
        url: '/products',
        icons: [{ src: '/logo.png', sizes: '96x96', type: 'image/png' }],
      },
      {
        name: 'Farm Visits',
        short_name: 'Visits',
        url: '/farm-visits',
        icons: [{ src: '/logo.png', sizes: '96x96', type: 'image/png' }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}
