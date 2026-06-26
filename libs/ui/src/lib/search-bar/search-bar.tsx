import { type ChangeEvent, type FormEvent } from 'react';
import { Input } from '../input/input';
import { Button } from '../button/button';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  loading?: boolean;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  loading,
}: SearchBarProps) {
  const isEmpty = !value.trim();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isEmpty) return;
    onSearch();
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="flex w-full gap-2">
      <Input
        size="lg"
        type="search"
        aria-label="Buscar anime"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
        placeholder="Ex: Naruto, One Piece..."
      />
      <Button
        type="submit"
        variant="solid"
        size="lg"
        loading={loading}
        disabled={isEmpty}
      >
        Buscar
      </Button>
    </form>
  );
}
