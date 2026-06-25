import { type ChangeEvent, type FormEvent } from 'react';
import { Input } from '../input/input';
import { Button } from '../button/button';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}

export function SearchBar({ value, onChange, onSearch }: SearchBarProps) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSearch();
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="flex w-full gap-2">
      <Input
        type="search"
        aria-label="Buscar anime"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
        placeholder="Ex: Naruto, One Piece..."
      />
      <Button type="submit" variant="solid">
        Buscar
      </Button>
    </form>
  );
}
