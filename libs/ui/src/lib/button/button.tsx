import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const button = cva(
  cn(
    'inline-flex items-center justify-center gap-2',
    'rounded-lg font-semibold transition active:brightness-90',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none',
  ),
  {
    variants: {
      variant: {
        solid: 'bg-brand text-white hover:bg-brand/90',
        outline: 'border border-brand text-brand hover:bg-brand/10',
      },
      size: { md: 'h-9 px-4 text-sm', lg: 'h-12 px-6 text-base' },
      active: { true: '', false: '' },
    },
    compoundVariants: [
      {
        variant: 'outline',
        active: true,
        class:
          'bg-brand text-white border-transparent font-bold hover:bg-brand',
      },
    ],
    defaultVariants: { variant: 'solid', size: 'md', active: false },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant, size, active, icon, children, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={cn(button({ variant, size, active }), className)}
        {...props}
      >
        {icon && <span aria-hidden="true">{icon}</span>}
        {children}
      </button>
    );
  },
);
