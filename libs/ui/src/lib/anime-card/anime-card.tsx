import { memo, useEffect, useRef, useState } from 'react';
import type { Anime } from '@buscanime/shared-types';
import { cn } from '../utils/cn';
import { Chip } from '../chip/chip';
import { AnimeRating } from '../anime-rating/anime-rating';

export interface AnimeCardProps {
  anime: Anime;
}

export const AnimeCard = memo(function AnimeCard({ anime }: AnimeCardProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Capa já em cache: o onLoad pode não disparar, checa o estado real.
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  return (
    <article className="relative aspect-[3/4] overflow-hidden rounded-lg bg-black/5">
      <img
        ref={imgRef}
        src={anime.coverImage}
        alt={anime.title}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn(
          'absolute inset-0 h-full w-full object-cover transition duration-500 ease-out',
          loaded ? 'scale-100 opacity-100' : 'scale-105 opacity-0',
        )}
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
});
