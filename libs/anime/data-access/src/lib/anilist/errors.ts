/**
 * Detecta HTTP 429 (rate limit) da AniList.
 * Cobre `fetch` SSR (`error.status`) e `graphql-request` (`error.response.status`).
 */
export function isRateLimitError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const e = error as { status?: unknown; response?: unknown };
  if (e.status === 429) return true;
  const response = e.response;
  if (typeof response !== 'object' || response === null) return false;
  return (response as { status?: unknown }).status === 429;
}
