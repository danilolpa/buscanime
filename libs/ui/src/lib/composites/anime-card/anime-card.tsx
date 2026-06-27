'use client';
import { memo, useState } from 'react';
import Image from 'next/image';
import type { Anime } from '@buscanime/shared-types';
import { Chip } from '../../primitives/chip/chip';
import { AnimeRating } from '../../primitives/anime-rating/anime-rating';
import { GlowBackground } from '../../primitives/glow-background/glow-background';

export interface AnimeCardProps {
  anime: Anime;
  /** Carrega a capa com prioridade (sem lazy) — use nos cards acima da dobra. */
  priority?: boolean;
}

export const AnimeCard = memo(function AnimeCard({
  anime,
  priority = false,
}: AnimeCardProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <article className="relative aspect-[10/6] overflow-hidden rounded-lg transition-all duration-300 hover:ring-2 hover:ring-brand md:aspect-[10/9]">
      {/* fundo colorido visível enquanto a capa carrega */}
      <GlowBackground seed={anime.id} />
      <Image
        src={anime.coverImage}
        alt={anime.title}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        priority={priority}
        onLoad={() => setLoaded(true)}
        className={`object-cover transition duration-500 ease-out hover:scale-110 ${loaded ? 'scale-100 opacity-100' : 'scale-105 opacity-0'}`}
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
