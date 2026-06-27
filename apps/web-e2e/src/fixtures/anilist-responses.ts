/** Fixtures alinhados ao MSW de `anime-browser.spec.tsx`. */

const mediaItem = (id: number, title: string, cover = 'cover.jpg') => ({
  id,
  title: { romaji: title, english: null },
  coverImage: { large: cover },
  averageScore: 80,
  format: 'TV' as const,
  genres: ['Action'],
});

export const anilistPage1 = {
  pageInfo: { currentPage: 1, hasNextPage: true },
  media: [mediaItem(1, 'Naruto', 'n.jpg')],
};

export const anilistPage2 = {
  pageInfo: { currentPage: 2, hasNextPage: false },
  media: [mediaItem(2, 'Bleach', 'b.jpg')],
};

export const anilistEmptyPage = {
  pageInfo: { currentPage: 1, hasNextPage: false },
  media: [],
};

export const anilistZeroFormatCounts = Object.fromEntries(
  ['ALL', 'TV', 'MOVIE', 'TV_SHORT', 'SPECIAL', 'OVA', 'ONA', 'MUSIC'].map(
    (k) => [k, { pageInfo: { total: 0 } }],
  ),
);

export interface AnimeListVariables {
  page?: number;
  search?: string | null;
  format?: string | null;
}

export function resolveAnimeListPage(variables: AnimeListVariables) {
  const search = variables.search?.trim();
  if (search?.includes('nonexistent')) {
    return anilistEmptyPage;
  }
  if (variables.page === 2) {
    return anilistPage2;
  }
  return anilistPage1;
}
