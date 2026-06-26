import { Button } from '../button/button';

export interface ToggleGroupOption {
  label: string;
  value: string;
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
          </Button>
        );
      })}
    </div>
  );
}
