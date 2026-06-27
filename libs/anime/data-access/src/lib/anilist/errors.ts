/**
 * Detecta HTTP 429 (rate limit) da AniList.
 *
 * Unifica detecção entre transportes:
 * - SSR (`fetch`): erro com `.status`
 * - Browser (`graphql-request`): erro com `.response.status`
 *
 * Permite que a UI trate "tente novamente" sem acoplar ao tipo de transporte.
 *
 * @param error - Erro capturado no catch de fetch ou React Query
 * @returns `true` se o status HTTP for 429
 */
export function isRateLimitError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const e = error as { status?: unknown; response?: unknown };
  if (e.status === 429) return true;
  const response = e.response;
  if (typeof response !== 'object' || response === null) return false;
  return (response as { status?: unknown }).status === 429;
}
