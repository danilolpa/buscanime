import type { Anime, MediaFormat } from '@buscanime/shared-types';
import type { AnimeListQuery } from './generated/graphql.js';

type Media = NonNullable<NonNullable<AnimeListQuery['Page']>['media']>[number];

export function toAnime(media: NonNullable<Media>): Anime {
  return {
    id: media.id,
    title: media.title?.english ?? media.title?.romaji ?? 'Untitled',
    coverImage: media.coverImage?.large ?? '',
    averageScore: media.averageScore ?? null,
    format: (media.format as MediaFormat | null) ?? null,
    genres: (media.genres ?? []).filter((g): g is string => Boolean(g)),
  };
}
