import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchAnimeDetail } from '../fetch.js';
import { isRateLimitError } from '../../anilist/errors.js';

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);
}

afterEach(() => vi.unstubAllGlobals());

describe('fetchAnimeDetail', () => {
  it('returns a mapped AnimeDetail on success', async () => {
    const media = {
      id: 1,
      title: { romaji: 'X', english: 'X', native: null },
      description: null,
      coverImage: { extraLarge: 'c.jpg', large: null, color: null },
      bannerImage: null,
      averageScore: null,
      meanScore: null,
      popularity: null,
      favourites: null,
      episodes: null,
      duration: null,
      status: null,
      season: null,
      seasonYear: null,
      format: null,
      source: null,
      startDate: null,
      endDate: null,
      genres: [],
      tags: [],
      studios: { nodes: [] },
      trailer: null,
      externalLinks: [],
    };
    vi.stubGlobal('fetch', mockFetch(200, { data: { Media: media } }));
    const d = await fetchAnimeDetail(1);
    expect(d?.id).toBe(1);
    expect(d?.coverImage).toBe('c.jpg');
  });

  it('returns null when Media is null', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { data: { Media: null } }));
    expect(await fetchAnimeDetail(999999)).toBeNull();
  });

  it('returns null on a 404 (non-existent id)', async () => {
    vi.stubGlobal('fetch', mockFetch(404, { data: { Media: null } }));
    expect(await fetchAnimeDetail(123)).toBeNull();
  });

  it('throws on a malformed 200 with no data', async () => {
    vi.stubGlobal('fetch', mockFetch(200, {}));
    await expect(fetchAnimeDetail(1)).rejects.toThrow('missing data');
  });

  it('throws a rate-limit-detectable error on 429', async () => {
    vi.stubGlobal('fetch', mockFetch(429, {}));
    await expect(fetchAnimeDetail(1)).rejects.toSatisfy(isRateLimitError);
  });

  it('throws a throttle-detectable error on 403', async () => {
    vi.stubGlobal('fetch', mockFetch(403, {}));
    await expect(fetchAnimeDetail(1)).rejects.toSatisfy(isRateLimitError);
  });

  it('throws on other non-OK responses', async () => {
    vi.stubGlobal('fetch', mockFetch(500, {}));
    await expect(fetchAnimeDetail(1)).rejects.toThrow();
  });
});
