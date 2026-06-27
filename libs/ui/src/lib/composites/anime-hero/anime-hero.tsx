import Image from 'next/image';
import { AnimeRating } from '../../primitives/anime-rating/anime-rating';
import { Container } from '../../layout/container/container';

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
        className="relative h-48 w-full overflow-hidden md:h-64"
        style={{ backgroundColor: coverColor ?? '#1a1a1a' }}
        aria-hidden="true"
      >
        {bannerImage && (
          <Image
            src={bannerImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover motion-safe:animate-fade-in"
          />
        )}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/40 to-transparent md:h-64" />
      <Container className="relative -mt-20 flex flex-col items-center gap-4 text-center md:-mt-24 md:flex-row md:items-end md:text-left">
        {coverImage && (
          <div className="flex-none overflow-hidden rounded-lg shadow-lg md:sticky md:top-20 md:self-start">
            <Image
              src={coverImage}
              alt={title}
              width={176}
              height={256}
              priority
              sizes="(max-width: 768px) 128px, 176px"
              className="h-48 w-32 object-cover motion-safe:animate-fade-in motion-safe:[animation-delay:400ms] md:h-64 md:w-44"
            />
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2 pb-2">
          <h1
            id="anime-hero-title"
            className="text-2xl font-bold text-ink md:text-3xl"
          >
            {title}
          </h1>
          {nativeTitle && (
            <p className="text-sm text-ink-muted">{nativeTitle}</p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            {score != null && <AnimeRating value={score} />}
            {meta.map((m) => (
              <span key={m} className="text-sm text-ink-muted">
                {m}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
