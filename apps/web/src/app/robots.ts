import type { MetadataRoute } from 'next';

// Mantém em sincronia com layout.tsx (NEXT_PUBLIC_SITE_URL).
const siteUrl =
  process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://buscanime-web.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/', // proxy interno da AniList — não indexar
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
