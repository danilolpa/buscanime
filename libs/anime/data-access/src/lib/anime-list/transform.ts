import type { Anime, MediaFormat } from '@buscanime/shared-types';
import type { AnimeListQuery } from '../graphql/generated/graphql.js';

type Media = NonNullable<NonNullable<AnimeListQuery['Page']>['media']>[number];

/**
 * Converte um item GraphQL `Media` no tipo de domínio `Anime`.
 *
 * Isola o shape da API AniList do que a UI consome (`@buscanime/shared-types`).
 * Se a query GraphQL mudar campos, só este arquivo precisa atualizar.
 *
 * Regras de mapeamento:
 * - Título: `english` → fallback `romaji` → `'Untitled'`
 * - `coverImage`, `averageScore`, `format`, `genres` com defaults seguros
 *
 * @param media - Item não-nulo da resposta `AnimeList`
 */
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
