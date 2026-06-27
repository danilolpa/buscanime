import { cn } from '../../utils/cn';

export interface AnimeRatingProps {
  value: number;
}

function tone(value: number) {
  if (value < 50) return 'bg-score-low text-on-score';
  if (value <= 80) return 'bg-score-mid text-ink';
  return 'bg-score-high text-on-score';
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
