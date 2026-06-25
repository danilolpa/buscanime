import { Skeleton } from '../skeleton/skeleton';
import { AnimeGrid } from '../anime-grid/anime-grid';

export function AnimeCardSkeleton() {
  return (
    <article
      aria-busy="true"
      aria-label="Carregando anime"
      className="relative aspect-[3/4] overflow-hidden rounded-lg bg-black/5"
    >
      <div aria-hidden="true" className="flex h-full flex-col justify-end p-3">
        <Skeleton className="mb-2 h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </article>
  );
}

export interface AnimeGridSkeletonProps {
  count?: number;
}

export function AnimeGridSkeleton({ count = 12 }: AnimeGridSkeletonProps) {
  return (
    <AnimeGrid>
      {Array.from({ length: count }, (_, i) => (
        <AnimeCardSkeleton key={i} />
      ))}
    </AnimeGrid>
  );
}
