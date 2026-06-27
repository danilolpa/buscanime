import type {
  AnimeDetail,
  AnimeDetailExternalLink,
  AnimeDetailTag,
  MediaFormat,
} from '@buscanime/shared-types';
import type { AnimeDetailQuery } from '../graphql/generated/graphql.js';

type Media = NonNullable<AnimeDetailQuery['Media']>;

const str = (v: string | null | undefined): v is string => Boolean(v);

export function toAnimeDetail(media: Media): AnimeDetail {
  return {
    id: media.id,
    title: media.title?.english ?? media.title?.romaji ?? 'Untitled',
    romajiTitle: media.title?.romaji ?? null,
    nativeTitle: media.title?.native ?? null,
    description: media.description ?? null,
    coverImage: media.coverImage?.extraLarge ?? media.coverImage?.large ?? null,
    coverColor: media.coverImage?.color ?? null,
    bannerImage: media.bannerImage ?? null,
    averageScore: media.averageScore ?? null,
    meanScore: media.meanScore ?? null,
    popularity: media.popularity ?? null,
    favourites: media.favourites ?? null,
    episodes: media.episodes ?? null,
    duration: media.duration ?? null,
    status: media.status ?? null,
    season: media.season ?? null,
    seasonYear: media.seasonYear ?? null,
    format: (media.format as MediaFormat | null) ?? null,
    source: media.source ?? null,
    startDate: media.startDate ?? null,
    endDate: media.endDate ?? null,
    genres: (media.genres ?? []).filter(str),
    tags: (media.tags ?? [])
      .filter((t): t is NonNullable<typeof t> => Boolean(t?.name))
      .map((t): AnimeDetailTag => ({ name: t.name, rank: t.rank ?? null })),
    studios: (media.studios?.nodes ?? []).map((n) => n?.name).filter(str),
    trailer:
      media.trailer?.id && media.trailer.site
        ? {
            id: media.trailer.id,
            site: media.trailer.site,
            thumbnail: media.trailer.thumbnail ?? null,
          }
        : null,
    externalLinks: (media.externalLinks ?? [])
      .filter((l): l is NonNullable<typeof l> => Boolean(l?.url))
      .map(
        (l): AnimeDetailExternalLink => ({
          url: l.url,
          site: l.site,
          color: l.color ?? null,
          type: l.type ?? null,
        }),
      ),
  };
}
