import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchAnimeListPage } from '../fetch-page.js';
import { isRateLimitError } from '../../anilist/errors.js';

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);
}

const naruto = {
  id: 1,
  title: { romaji: 'Naruto', english: null },
  coverImage: { large: 'n.jpg' },
  averageScore: 80,
  format: 'TV',
  genres: ['Action'],
};

afterEach(() => vi.restoreAllMocks());

describe('fetchAnimeListPage', () => {
  it('retorna a 1ª página normalizada', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch(200, {
        data: {
          Page: {
            pageInfo: { currentPage: 1, hasNextPage: true },
            media: [naruto],
          },
        },
      }),
    );

    const page = await fetchAnimeListPage({ page: 1, transport: 'ssr' });
    expect(page.items).toEqual([
      {
        id: 1,
        title: 'Naruto',
        coverImage: 'n.jpg',
        averageScore: 80,
        format: 'TV',
        genres: ['Action'],
      },
    ]);
    expect(page.pageInfo?.hasNextPage).toBe(true);
  });

  it('lança erro detectável como rate limit em 429', async () => {
    vi.stubGlobal('fetch', mockFetch(429, {}));
    await expect(
      fetchAnimeListPage({ page: 1, transport: 'ssr' }),
    ).rejects.toSatisfy(isRateLimitError);
  });

  it('lança em outras respostas não-OK', async () => {
    vi.stubGlobal('fetch', mockFetch(500, {}));
    await expect(
      fetchAnimeListPage({ page: 1, transport: 'ssr' }),
    ).rejects.toThrow('AniList request failed: 500');
  });
});
