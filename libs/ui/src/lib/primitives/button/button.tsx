import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const button = cva(
  cn(
    'inline-flex items-center justify-center gap-2',
    'rounded-lg font-semibold transition active:ring-2 active:ring-offset-2 active:ring-brand',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none',
  ),
  {
    variants: {
      variant: {
        solid: 'bg-brand text-white hover:bg-brand/80',
        outline: 'border-2 border-brand text-brand md:hover:bg-brand/20',
        accent:
          'bg-accent text-ink hover:bg-accent/90 active:ring-accent focus-visible:outline-accent',
      },
      size: { md: 'h-8 px-6 text-sm', lg: 'h-12 px-6' },
      active: { true: '', false: '' },
    },
    compoundVariants: [
      {
        variant: 'outline',
        active: true,
        class: 'bg-brand text-white border-transparent md:hover:bg-brand',
      },
    ],
    defaultVariants: { variant: 'solid', size: 'md', active: false },
  },
);

export { button as buttonVariants };

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  icon?: ReactNode;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant,
      size,
      active,
      icon,
      loading,
      children,
      disabled,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={cn(button({ variant, size, active }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <span aria-hidden="true">
            <Loader2 className="animate-spin" />
          </span>
        ) : (
          icon && <span aria-hidden="true">{icon}</span>
        )}
        {children}
      </button>
    );
  },
);
