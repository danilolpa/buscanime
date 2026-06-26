import { Button } from '../button/button';

export interface ToggleGroupOption {
  label: string;
  value: string;
  badge?: string | number;
}

export interface ToggleGroupProps {
  options: ToggleGroupOption[];
  value: string;
  onChange: (value: string) => void;
}

export function ToggleGroup({ options, value, onChange }: ToggleGroupProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group">
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <Button
            key={opt.value}
            variant="outline"
            size="md"
            active={isActive}
            aria-pressed={isActive}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
            {opt.badge != null && (
              <span className="ml-2 rounded-full bg-current/15 px-1.5 text-xs font-semibold tabular-nums">
                {opt.badge}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
