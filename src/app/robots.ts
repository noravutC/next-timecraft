import type { MetadataRoute } from 'next';
import { appUrl } from '@/lib/app-url';

// The marketing pages are public; everything behind sign-in stays out.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/project',
        '/settings',
        '/notifications',
        '/organization/',
        '/invite/',
        '/join/',
        '/login',
      ],
    },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
