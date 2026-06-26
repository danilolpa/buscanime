import { Suspense } from 'react';
import { Header, Footer, Container, AnimeGridSkeleton } from '@buscanime/ui';
import { AnimeBrowser } from './(home)/anime-browser';

export default function Index() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header className="sticky top-0 z-40" />
      <main className="flex flex-1 flex-col">
        <Suspense
          fallback={
            <Container>
              <div className="py-8">
                <AnimeGridSkeleton count={12} />
              </div>
            </Container>
          }
        >
          <AnimeBrowser />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
