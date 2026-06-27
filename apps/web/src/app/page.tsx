import type { Metadata } from 'next';
import { Header, Footer } from '@buscanime/ui';
import { HomeWithData } from './(home)/home-with-data';

// Título/descrição/OG vêm dos defaults do root layout (layout.tsx);
// aqui só fixamos o canonical da home.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default async function Index({
  searchParams,
}: {
  searchParams: Promise<{ format?: string; q?: string }>;
}) {
  const params = await searchParams;
  const initialFormat = params.format ?? 'ALL';
  const initialQ = params.q ?? '';

  return (
    <div className="flex min-h-screen flex-col">
      <Header className="sticky top-0 z-40" />
      <main className="flex flex-1 flex-col">
        <HomeWithData initialFormat={initialFormat} initialQ={initialQ} />
      </main>
      <Footer />
    </div>
  );
}
