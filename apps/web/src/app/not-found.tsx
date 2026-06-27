import type { Metadata } from 'next';
import Link from 'next/link';
import { Ghost, Home } from 'lucide-react';
import {
  Header,
  Footer,
  Container,
  StatusState,
  buttonVariants,
} from '@buscanime/ui';

// 404 global (URLs desconhecidas). Não indexar páginas de erro.
export const metadata: Metadata = {
  title: 'Página não encontrada',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header className="sticky top-0 z-40" />
      <main className="flex flex-1 flex-col">
        <Container className="flex flex-1 items-center justify-center py-8">
          <StatusState
            icon={<Ghost />}
            title="Página não encontrada"
            message="O endereço que você acessou não existe ou foi movido. Que tal voltar para a home e buscar um anime?"
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
