/**
 * Detecta o 429 (rate limit) da AniList. graphql-request lança `ClientError`
 * em respostas não-2xx, expondo o status HTTP em `error.response.status`.
 * Usamos duck-typing (em vez de `instanceof ClientError`) pra não depender da
 * identidade da classe através do boundary dist/src.
 */
export function isRateLimitError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const response = (error as { response?: unknown }).response;
  if (typeof response !== 'object' || response === null) return false;
  return (response as { status?: unknown }).status === 429;
}
