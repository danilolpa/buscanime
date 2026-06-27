import { Chip } from '../chip/chip';

export interface TagListProps {
  items: string[];
}

export function TagList({ items }: TagListProps) {
  const unique = Array.from(new Set(items));
  if (unique.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {unique.map((item) => (
        <li key={item}>
          <Chip>{item}</Chip>
        </li>
      ))}
    </ul>
  );
}
