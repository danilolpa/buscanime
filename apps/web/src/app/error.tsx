'use client';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { ServerCrash } from 'lucide-react';
import { StatusState, Button } from 'ui';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <StatusState
        tone="danger"
        icon={<ServerCrash />}
        title="Algo deu errado"
        message="Tivemos um problema ao carregar esta página. Tente novamente."
        action={<Button onClick={reset}>Tentar novamente</Button>}
      />
    </div>
  );
}
