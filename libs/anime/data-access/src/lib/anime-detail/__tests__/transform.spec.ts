import { describe, it, expect } from 'vitest';
import { toAnimeDetail } from '../transform.js';
import type { AnimeDetailQuery } from '../../graphql/generated/graphql.js';

type Media = NonNullable<AnimeDetailQuery['Media']>;

const media: Media = {
  id: 16498,
  title: {
    romaji: 'Shingeki no Kyojin',
    english: 'Attack on Titan',
    native: '進撃の巨人',
  },
  description: 'Humanity fights titans.',
  coverImage: { extraLarge: 'xl.jpg', large: 'lg.jpg', color: '#abc' },
  bannerImage: 'banner.jpg',
  averageScore: 85,
  meanScore: 84,
  popularity: 500000,
  favourites: 90000,
  episodes: 25,
  duration: 24,
  status: 'FINISHED',
  season: 'SPRING',
  seasonYear: 2013,
  format: 'TV',
  source: 'MANGA',
  startDate: { year: 2013, month: 4, day: 7 },
  endDate: { year: 2013, month: 9, day: 28 },
  genres: ['Action', 'Drama'],
  tags: [
    { name: 'Titans', rank: 90 },
    { name: null as never, rank: null },
  ],
  studios: { nodes: [{ name: 'Wit Studio' }, { name: null as never }] },
  trailer: { id: 'abc', site: 'youtube', thumbnail: 'thumb.jpg' },
  externalLinks: [
    {
      url: 'https://crunchyroll.com/aot',
      site: 'Crunchyroll',
      color: '#f47521',
      type: 'STREAMING',
    },
  ],
};

describe('toAnimeDetail', () => {
  it('prefers english title and extraLarge cover', () => {
    const d = toAnimeDetail(media);
    expect(d.title).toBe('Attack on Titan');
    expect(d.coverImage).toBe('xl.jpg');
    expect(d.studios).toEqual(['Wit Studio']);
    expect(d.tags).toEqual([{ name: 'Titans', rank: 90 }]);
  });

  it('falls back and tolerates nulls', () => {
    const bare = {
      ...media,
      title: { romaji: 'X', english: null, native: null },
      coverImage: { extraLarge: null, large: 'lg.jpg', color: null },
      genres: null,
      tags: null,
      studios: null,
      externalLinks: null,
    } as Media;
    const d = toAnimeDetail(bare);
    expect(d.title).toBe('X');
    expect(d.coverImage).toBe('lg.jpg');
    expect(d.genres).toEqual([]);
    expect(d.studios).toEqual([]);
    expect(d.externalLinks).toEqual([]);
  });
});
