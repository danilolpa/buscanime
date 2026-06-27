import { type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export type StatusTone = 'neutral' | 'danger' | 'warning';

export interface StatusStateProps {
  icon: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
  tone?: StatusTone;
}

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: 'bg-ink/5 text-ink/40',
  danger: 'bg-danger-surface text-danger',
  warning: 'bg-warning-surface text-warning',
};

export function StatusState({
  icon,
  title,
  message,
  action,
  tone = 'neutral',
}: StatusStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-20 text-center motion-safe:animate-status-in">
      <div
        className={cn(
          'flex h-20 w-20 items-center justify-center rounded-full [&_svg]:h-9 [&_svg]:w-9',
          TONE_CLASSES[tone],
        )}
        aria-hidden="true"
      >
        {icon}
      </div>
      <h2 className="text-2xl font-bold text-ink">{title}</h2>
      {message && <p className="max-w-md text-base text-ink/60">{message}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
