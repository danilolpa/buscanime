'use client';
import { memo } from 'react';
import Image from 'next/image';
import type { Anime } from '@buscanime/shared-types';
import { Chip } from '../../primitives/chip/chip';
import { AnimeRating } from '../../primitives/anime-rating/anime-rating';

// Paletas de cores vibrantes para o placeholder de loading (blobs com glow).
// Hex puro em inline style — fora do sistema de tokens porque é decoração
// aleatória, não cor semântica de UI.
const GLOW_PALETTES: [string, string, string][] = [
  ['#f43f5e', '#8b5cf6', '#06b6d4'], // rose → violet → cyan
  ['#f97316', '#ec4899', '#8b5cf6'], // orange → pink → violet
  ['#06b6d4', '#3b82f6', '#8b5cf6'], // cyan → blue → violet
  ['#10b981', '#06b6d4', '#6366f1'], // emerald → cyan → indigo
  ['#f59e0b', '#ef4444', '#ec4899'], // amber → red → pink
  ['#8b5cf6', '#ec4899', '#f43f5e'], // violet → pink → rose
  ['#06b6d4', '#10b981', '#84cc16'], // cyan → emerald → lime
  ['#f97316', '#fbbf24', '#84cc16'], // orange → yellow → lime
];

export interface AnimeCardProps {
  anime: Anime;
  /** Carrega a capa com prioridade (sem lazy) — use nos cards acima da dobra. */
  priority?: boolean;
}

export const AnimeCard = memo(function AnimeCard({
  anime,
  priority = false,
}: AnimeCardProps) {
  const [c0, c1, c2] =
    GLOW_PALETTES[Math.abs(anime.id) % GLOW_PALETTES.length] ??
    GLOW_PALETTES[0];

  return (
    <article
      className="relative aspect-[10/6] overflow-hidden rounded-lg transition-all duration-300 hover:ring-2 hover:ring-brand md:aspect-[10/9]"
      style={{
        background: `linear-gradient(135deg, ${c0}55, ${c1}44, ${c2}55)`,
      }}
    >
      {/* blobs coloridos visíveis enquanto a capa carrega */}
      <div
        className="pointer-events-none absolute -left-8 -top-8 h-36 w-36 rounded-full blur-2xl"
        style={{ background: c0 + 'cc' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-8 top-1/4 h-44 w-44 rounded-full blur-2xl"
        style={{ background: c1 + 'cc' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full blur-xl"
        style={{ background: c2 + 'cc' }}
        aria-hidden="true"
      />
      <Image
        src={anime.coverImage}
        alt={anime.title}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        priority={priority}
        className="object-cover transition duration-400 ease-out hover:scale-110"
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
