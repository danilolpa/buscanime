/** Fixtures alinhados ao MSW de `anime-browser.spec.tsx`. */

// next/image exige URL absoluta de um host em `remotePatterns` (next.config.js);
// usamos s4.anilist.co (já configurado) para os fixtures espelharem o real.
const cover = (file: string) =>
  `https://s4.anilist.co/file/anilistcdn/media/anime/cover/${file}`;

const mediaItem = (id: number, title: string, coverFile = 'cover.jpg') => ({
  id,
  title: { romaji: title, english: null },
  coverImage: { large: cover(coverFile) },
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
