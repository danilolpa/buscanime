import { type HTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const chip = cva(
  'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'bg-brand/10 text-brand',
        onImage: 'bg-black/60 text-white',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface ChipProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chip> {
  children: ReactNode;
}

export function Chip({ className, variant, children, ...props }: ChipProps) {
  return (
    <span className={cn(chip({ variant }), className)} {...props}>
      {children}
    </span>
  );
}
