'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';

export interface TrailerEmbedProps {
  youtubeId: string | null;
  thumbnail: string | null;
  title?: string;
}

export function TrailerEmbed({
  youtubeId,
  thumbnail,
  title = 'Trailer',
}: TrailerEmbedProps) {
  const [playing, setPlaying] = useState(false);
  if (!youtubeId) return null;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-scrim">
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Reproduzir trailer: ${title}`}
          className="group absolute inset-0 h-full w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {thumbnail && (
            <Image
              src={thumbnail}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 66vw"
              className="object-cover"
            />
          )}
          <span className="absolute inset-0 grid place-items-center bg-scrim/30 transition group-hover:bg-scrim/40">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-surface/90 text-scrim">
              <Play aria-hidden="true" className="translate-x-0.5" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
