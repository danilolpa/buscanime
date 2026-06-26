'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { isRateLimitError } from '@buscanime/anime-data-access';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Não re-tenta no 429 (rate limit): mostra o estado na hora e não
            // gera carga extra na API. Demais erros mantêm o padrão (3).
            retry: (failureCount, error) =>
              !isRateLimitError(error) && failureCount < 3,
          },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
