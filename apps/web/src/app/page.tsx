import { Suspense } from 'react';
import { Header, Footer, Container, AnimeGridSkeleton } from '@buscanime/ui';
import { AnimeBrowser } from './(home)/anime-browser';

export default function Index() {
  return (
    <>
      <Header />
      <main>
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
    </>
  );
}
