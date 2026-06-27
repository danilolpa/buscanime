import { Chip } from '../chip/chip';

export interface TagListProps {
  items: string[];
}

export function TagList({ items }: TagListProps) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item}>
          <Chip>{item}</Chip>
        </li>
      ))}
    </ul>
  );
}
