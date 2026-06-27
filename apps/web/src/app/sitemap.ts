import type { MetadataRoute } from 'next';

// Mantém em sincronia com layout.tsx (NEXT_PUBLIC_SITE_URL).
const siteUrl =
  process.env['NEXT_PUBLIC_SITE_URL'] ??
  'https://buscanime-winnin-web.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  // As páginas de detalhe são dinâmicas (milhares, vindas da AniList) e não
  // entram aqui; o sitemap cobre as rotas estáticas indexáveis.
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];
}
