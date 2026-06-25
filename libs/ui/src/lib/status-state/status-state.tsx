import { type ReactNode } from 'react';

export interface StatusStateProps {
  icon: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function StatusState({
  icon,
  title,
  message,
  action,
}: StatusStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="text-ink/40 [&_svg]:h-16 [&_svg]:w-16" aria-hidden="true">
        {icon}
      </div>
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      {message && <p className="max-w-sm text-sm text-ink/60">{message}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
