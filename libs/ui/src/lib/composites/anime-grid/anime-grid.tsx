import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface AnimeGridProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export function AnimeGrid({ className, children, ...props }: AnimeGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
