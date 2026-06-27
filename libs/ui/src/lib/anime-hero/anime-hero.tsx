import { AnimeRating } from '../anime-rating/anime-rating';
import { Container } from '../container/container';

export interface AnimeHeroProps {
  title: string;
  nativeTitle?: string | null;
  coverImage: string | null;
  coverColor?: string | null;
  bannerImage: string | null;
  meta?: string[];
  score?: number | null;
}

export function AnimeHero({
  title,
  nativeTitle,
  coverImage,
  coverColor,
  bannerImage,
  meta = [],
  score,
}: AnimeHeroProps) {
  return (
    <section className="relative" aria-labelledby="anime-hero-title">
      <div
        className="h-48 w-full bg-cover bg-center md:h-64"
        style={{
          backgroundColor: coverColor ?? '#1a1a1a',
          backgroundImage: bannerImage ? `url(${bannerImage})` : undefined,
        }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/40 to-transparent md:h-64" />
      <Container className="relative -mt-20 flex flex-col gap-4 md:-mt-24 md:flex-row md:items-end">
        {coverImage && (
          <div className="flex-none md:sticky md:top-20 md:self-start">
            <img
              src={coverImage}
              alt={title}
              className="h-48 w-32 rounded-lg object-cover shadow-lg md:h-64 md:w-44"
            />
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2 pb-2">
          <h1
            id="anime-hero-title"
            className="text-2xl font-bold text-neutral-900 md:text-3xl"
          >
            {title}
          </h1>
          {nativeTitle && (
            <p className="text-sm text-neutral-500">{nativeTitle}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {score != null && <AnimeRating value={score} />}
            {meta.map((m) => (
              <span key={m} className="text-sm text-neutral-600">
                {m}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
