import { Header, Footer, Container, Skeleton } from '@buscanime/ui';

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header className="sticky top-0 z-40" />
      <main className="flex flex-1 flex-col">
        <section className="relative">
          <Skeleton className="h-48 w-full md:h-64" />
          <Container className="relative -mt-20 flex gap-4 md:-mt-24">
            <Skeleton className="h-48 w-32 flex-none rounded-lg md:h-64 md:w-44" />
            <div className="flex flex-1 flex-col gap-3 pb-2">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </Container>
        </section>
        <Container className="grid gap-8 py-8 md:grid-cols-[280px_1fr]">
          <Skeleton className="h-64 w-full rounded-lg" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
