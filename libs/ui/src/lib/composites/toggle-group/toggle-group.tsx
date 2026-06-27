import { cn } from '../../utils/cn';
import { Button, buttonVariants } from '../../primitives/button/button';

export interface ToggleGroupOption {
  label: string;
  value: string;
  badge?: string | number;
  /** URL real para navegação sem JS (progressive enhancement). */
  href?: string;
}

export interface ToggleGroupProps {
  options: ToggleGroupOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ToggleGroup({
  options,
  value,
  onChange,
  className,
}: ToggleGroupProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="group">
      {options.map((opt) => {
        const isActive = opt.value === value;
        const content = (
          <>
            {opt.label}
            {opt.badge != null && (
              <span className="ml-2 rounded-full bg-current/15 px-1.5 text-xs font-semibold tabular-nums">
                {opt.badge}
              </span>
            )}
          </>
        );

        if (opt.href) {
          return (
            <a
              key={opt.value}
              href={opt.href}
              onClick={(e) => {
                e.preventDefault();
                onChange(opt.value);
              }}
              className={buttonVariants({
                variant: 'outline',
                size: 'md',
                active: isActive,
              })}
              aria-current={isActive ? 'page' : undefined}
            >
              {content}
            </a>
          );
        }

        return (
          <Button
            key={opt.value}
            variant="outline"
            size="md"
            active={isActive}
            aria-pressed={isActive}
            onClick={() => onChange(opt.value)}
          >
            {content}
          </Button>
        );
      })}
    </div>
  );
}
