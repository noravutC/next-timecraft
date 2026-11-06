import type { MetadataRoute } from 'next';
import { appUrl } from '@/lib/app-url';

const PUBLIC_PAGES = ['', '/timecraft', '/privacy', '/terms'];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map((path) => ({ url: `${appUrl()}${path}` }));
}
