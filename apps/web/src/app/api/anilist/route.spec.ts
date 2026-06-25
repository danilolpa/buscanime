import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Sentry from '@sentry/nextjs';
import { POST } from './route';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

describe('POST /api/anilist', () => {
  beforeEach(() => vi.clearAllMocks());

  it('faz proxy da query e devolve o payload da AniList', async () => {
    const upstream = { data: { Page: { media: [] } } };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(upstream), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );
    const req = new Request('http://localhost/api/anilist', {
      method: 'POST',
      body: JSON.stringify({ query: '{ Page { media { id } } }' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(upstream);
  });

  it('captura falha de upstream no Sentry e responde 502', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network down')),
    );
    const req = new Request('http://localhost/api/anilist', {
      method: 'POST',
      body: JSON.stringify({ query: '{}' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(502);
    expect(Sentry.captureException).toHaveBeenCalled();
  });
});
