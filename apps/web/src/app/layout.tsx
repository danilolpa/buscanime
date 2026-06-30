import type { Metadata } from 'next';
import './global.css';
import { Providers } from './providers';

const siteUrl =
  process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://buscanime-web.vercel.app';

const defaultTitle =
  'BuscaAnime · Pesquise animes com notas, episódios e trailers';
const defaultDescription =
  'Explore milhares de animes com nota média, número de episódios, estúdio, gêneros e trailers. Dados atualizados da AniList, em português.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: '%s · BuscaAnime',
  },
  description: defaultDescription,
  applicationName: 'BuscaAnime',
  keywords: [
    'anime',
    'animes',
    'buscar anime',
    'pesquisar anime',
    'lista de animes',
    'nota de anime',
    'episódios',
    'estúdio',
    'trailer',
    'AniList',
  ],
  openGraph: {
    type: 'website',
    siteName: 'BuscaAnime',
    locale: 'pt_BR',
    url: '/',
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: '/og-home.png',
        width: 1200,
        height: 630,
        alt: 'BuscaAnime — descubra, pesquise e explore animes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: defaultDescription,
    images: ['/og-home.png'],
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
