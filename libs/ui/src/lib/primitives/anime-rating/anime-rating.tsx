import { cn } from '../../utils/cn';

export interface AnimeRatingProps {
  value: number;
}

function tone(value: number) {
  if (value < 50) return 'bg-rose-600 text-white';
  if (value <= 80) return 'bg-yellow-300 text-neutral-900';
  return 'bg-teal-700 text-white';
}

export function AnimeRating({ value }: AnimeRatingProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-lg font-medium',
        tone(value),
      )}
    >
      {Math.round(value)}%
    </span>
  );
}
