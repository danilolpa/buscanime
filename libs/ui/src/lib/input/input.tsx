import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { cn } from '../utils/cn';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'aria-label'> {
  'aria-label': string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, icon, ...props },
  ref,
) {
  return (
    <div className="relative inline-flex w-full items-center">
      {icon && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 flex items-center text-ink/50"
        >
          {icon}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full rounded-md border border-ink/20 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
          'disabled:opacity-50 disabled:pointer-events-none',
          icon && 'pl-9',
          className,
        )}
        {...props}
      />
    </div>
  );
});
