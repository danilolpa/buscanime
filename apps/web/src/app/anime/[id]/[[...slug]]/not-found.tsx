import type { Metadata } from 'next';
import Link from 'next/link';
import { Ghost, Home } from 'lucide-react';
import { Header, Footer, Container, StatusState, buttonVariants } from 'ui';

// Já retorna HTTP 404, mas reforça que páginas de erro não devem ser indexadas.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AnimeNotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header className="sticky top-0 z-40" />
      <main className="flex flex-1 flex-col">
        <Container className="flex flex-1 items-center justify-center py-8">
          <StatusState
            icon={<Ghost />}
            title="Anime não encontrado"
            message="Não localizamos esse anime. Ele pode ter sido removido ou o link está incorreto."
            action={
              <Link
                href="/"
                className={buttonVariants({ variant: 'solid', size: 'lg' })}
              >
                <Home aria-hidden="true" />
                Voltar para a home
              </Link>
            }
          />
        </Container>
      </main>
      <Footer />
    </div>
  );
}
