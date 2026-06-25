import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface AnimeGridProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export function AnimeGrid({ className, children, ...props }: AnimeGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
