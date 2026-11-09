import type { MetadataRoute } from 'next';

// Installing TimeCraft from the browser opens straight onto the boards.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TimeCraft',
    short_name: 'TimeCraft',
    description: 'A real-time kanban board for small teams.',
    start_url: '/project',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
