'use client';
import { memo } from 'react';
import type { Anime } from '@buscanime/shared-types';
import { Chip } from '../chip/chip';
import { AnimeRating } from '../anime-rating/anime-rating';

export interface AnimeCardProps {
  anime: Anime;
}

export const AnimeCard = memo(function AnimeCard({ anime }: AnimeCardProps) {
  return (
    <article className="relative aspect-[10/6] overflow-hidden rounded-lg bg-black/5 transition-all duration-300 hover:ring-2 hover:ring-purple-500 md:aspect-[10/9]">
      <img
        src={anime.coverImage}
        alt={anime.title}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition duration-400 ease-out hover:scale-110"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-black to-transparent" />
      <div className="absolute inset-x-0 top-0 p-4">
        <h3 className="text-xl font-bold text-white">{anime.title}</h3>
        <div className="mt-2 flex flex-wrap gap-1">
          {anime.genres.slice(0, 3).map((g) => (
            <Chip key={g}>{g}</Chip>
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
});
