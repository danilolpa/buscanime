import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export function Container({ className, children, ...props }: ContainerProps) {
  return (
    <div className={cn('mx-auto w-full max-w-6xl px-4', className)} {...props}>
      {children}
    </div>
  );
}
