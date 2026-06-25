import { cn } from '../utils/cn';

export interface AnimeRatingProps {
  value: number;
}

function tone(value: number) {
  if (value < 50) return 'bg-rating-low text-white';
  if (value <= 80) return 'bg-rating-mid text-ink';
  return 'bg-rating-high text-white';
}

export function AnimeRating({ value }: AnimeRatingProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-sm font-bold',
        tone(value),
      )}
    >
      {Math.round(value)}%
    </span>
  );
}
