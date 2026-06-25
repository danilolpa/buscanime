import type { Anime } from '@buscanime/shared-types';
import { Chip } from '../chip/chip';
import { AnimeRating } from '../anime-rating/anime-rating';

export interface AnimeCardProps {
  anime: Anime;
}

export function AnimeCard({ anime }: AnimeCardProps) {
  return (
    <article className="relative aspect-[3/4] overflow-hidden rounded-lg">
      <img
        src={anime.coverImage}
        alt={anime.title}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3 pt-12">
        <h3 className="font-bold text-white">{anime.title}</h3>
        <div className="mt-1 flex flex-wrap gap-1">
          {anime.genres.slice(0, 3).map((g) => (
            <Chip key={g} variant="onImage">
              {g}
            </Chip>
          ))}
        </div>
      </div>
      {anime.averageScore != null && (
        <div className="absolute bottom-2 right-2">
          <AnimeRating value={anime.averageScore} />
        </div>
      )}
    </article>
  );
}
