import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';
import { cn } from '../utils/cn';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  function Container({ className, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn('mx-auto w-full max-w-7xl px-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
