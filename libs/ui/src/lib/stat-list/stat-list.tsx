import type { ReactNode } from 'react';

export interface StatItem {
  label: string;
  value: ReactNode;
}
export interface StatListProps {
  items: StatItem[];
}

function isEmpty(v: ReactNode): boolean {
  return v === null || v === undefined || v === '';
}

export function StatList({ items }: StatListProps) {
  const visible = items.filter((i) => !isEmpty(i.value));
  if (visible.length === 0) return null;
  return (
    <dl className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
      {visible.map((i) => (
        <div
          key={i.label}
          className="flex items-center justify-between gap-4 px-4 py-2.5"
        >
          <dt className="text-sm text-neutral-500">{i.label}</dt>
          <dd className="text-sm font-medium text-neutral-900">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}
