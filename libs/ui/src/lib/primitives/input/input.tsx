import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const input = cva(
  cn(
    'w-full rounded-md border border-border bg-surface text-ink placeholder:text-ink-subtle',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
    'disabled:opacity-50 disabled:pointer-events-none',
  ),
  {
    // Alturas iguais às do Button: md = h-9, lg = h-12.
    variants: {
      size: {
        md: 'h-9 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'aria-label' | 'size'>,
    VariantProps<typeof input> {
  'aria-label': string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, icon, size, ...props },
  ref,
) {
  return (
    <div className="relative inline-flex w-full items-center">
      {icon && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 flex items-center text-ink-subtle"
        >
          {icon}
        </span>
      )}
      <input
        ref={ref}
        className={cn(input({ size }), icon && 'pl-9', className)}
        {...props}
      />
    </div>
  );
});
