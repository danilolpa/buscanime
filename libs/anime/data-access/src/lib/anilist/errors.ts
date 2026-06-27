/** Statuses que indicam bloqueio temporário da AniList (rate limit ou Cloudflare). */
const ANILIST_THROTTLE_STATUSES = new Set([403, 429]);

function isThrottleStatus(status: unknown): boolean {
  return typeof status === 'number' && ANILIST_THROTTLE_STATUSES.has(status);
}

/**
 * Detecta bloqueio temporário da AniList (HTTP 429 ou 403).
 *
 * A AniList (via Cloudflare) às vezes responde 403 em vez de 429 no localhost
 * ou sob carga — a UI deve mostrar "aguarde e tente de novo", não erro genérico.
 *
 * Unifica detecção entre transportes:
 * - SSR (`fetch`): erro com `.status`
 * - Browser (`graphql-request`): erro com `.response.status`
 *
 * @param error - Erro capturado no catch de fetch ou React Query
 * @returns `true` se o status HTTP for 403 ou 429
 */
export function isRateLimitError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const e = error as { status?: unknown; response?: unknown };
  if (isThrottleStatus(e.status)) return true;
  const response = e.response;
  if (typeof response !== 'object' || response === null) return false;
  return isThrottleStatus((response as { status?: unknown }).status);
}
