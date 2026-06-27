import * as Sentry from '@sentry/nextjs';
import {
  ANILIST_JSON_HEADERS,
  ANILIST_REVALIDATE_SECONDS,
  getAnilistEndpoint,
} from 'anime-data-access';

const UPSTREAM_TIMEOUT_MS = 10_000;
// Queries GraphQL da AniList são pequenas; corta abuso de relay com payload gigante.
const MAX_BODY_LENGTH = 100_000;

export async function POST(request: Request) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const body = await request.text();
    if (body.length > MAX_BODY_LENGTH) {
      return Response.json(
        { error: 'Request body too large' },
        { status: 413 },
      );
    }

    const upstream = await fetch(getAnilistEndpoint(), {
      method: 'POST',
      headers: { ...ANILIST_JSON_HEADERS },
      body,
      signal: controller.signal,
      // Mesmo TTL do SSR — reduz hits repetidos à AniList (IPs compartilhados na Vercel).
      next: { revalidate: ANILIST_REVALIDATE_SECONDS },
    });
    const payload = await upstream.text();
    console.info(`[anilist] ${upstream.status} in ${Date.now() - startedAt}ms`);

    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };
    // Repassa o tempo de espera do rate limit (429) para a UI poder informar.
    const retryAfter = upstream.headers.get('retry-after');
    if (retryAfter) headers['retry-after'] = retryAfter;

    return new Response(payload, { status: upstream.status, headers });
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    Sentry.captureException(error);
    console.error(
      `[anilist] ${aborted ? 'timeout' : 'failed'} in ${Date.now() - startedAt}ms`,
      error,
    );
    return Response.json(
      {
        error: aborted
          ? 'Upstream AniList request timed out'
          : 'Upstream AniList request failed',
      },
      { status: aborted ? 504 : 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
