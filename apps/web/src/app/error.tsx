'use client';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

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
    <main>
      <h2>Algo deu errado.</h2>
      <button onClick={reset}>Tentar novamente</button>
    </main>
  );
}
