import { Header, Footer, Container, Skeleton } from '@buscanime/ui';

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header className="sticky top-0 z-40" />
      <main className="flex flex-1 flex-col">
        <Skeleton className="h-48 w-full md:h-64" />
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
