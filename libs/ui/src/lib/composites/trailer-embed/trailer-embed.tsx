'use client';
import { useState } from 'react';

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
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
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
            <img
              src={thumbnail}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
          <span className="absolute inset-0 grid place-items-center bg-black/30 transition group-hover:bg-black/40">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-2xl text-black">
              ▶
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
