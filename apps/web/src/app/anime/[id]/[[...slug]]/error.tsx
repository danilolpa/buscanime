'use client';
import { Hourglass, ServerCrash } from 'lucide-react';
import { StatusState, Button } from 'ui';
import { isRateLimitError } from 'anime-data-access';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const rateLimited = isRateLimitError(error);
  return (
    <div className="grid min-h-screen place-items-center p-6">
      {rateLimited ? (
        <StatusState
          tone="warning"
          icon={<Hourglass />}
          title="Aguarde um momento"
          message="A AniList limitou temporariamente o acesso. Aguarde alguns segundos e tente de novo."
          action={<Button onClick={reset}>Tentar de novo</Button>}
        />
      ) : (
        <StatusState
          tone="danger"
          icon={<ServerCrash />}
          title="Erro ao carregar"
          message="Algo deu errado ao buscar este anime."
          action={<Button onClick={reset}>Tentar de novo</Button>}
        />
      )}
    </div>
  );
}
