import * as Sentry from '@sentry/nextjs';

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const body = await request.text();
    const upstream = await fetch(ANILIST_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body,
    });
    const payload = await upstream.text();
    console.info(`[anilist] ${upstream.status} in ${Date.now() - startedAt}ms`);
    return new Response(payload, {
      status: upstream.status,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    Sentry.captureException(error);
    console.error(`[anilist] failed in ${Date.now() - startedAt}ms`, error);
    return Response.json(
      { error: 'Upstream AniList request failed' },
      { status: 502 },
    );
  }
}
