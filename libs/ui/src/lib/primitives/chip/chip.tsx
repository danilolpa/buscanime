import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

export function Chip({ className, children, ...props }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm bg-brand px-1.5 py-0.5 text-xs font-semibold text-white',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
