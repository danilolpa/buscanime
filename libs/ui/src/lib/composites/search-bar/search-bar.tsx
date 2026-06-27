import { type ChangeEvent, type FormEvent, type MouseEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Input } from '../../primitives/input/input';
import { Button } from '../../primitives/button/button';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  loading?: boolean;
  onClear?: () => void;
  /** Há uma busca já aplicada (q na URL), mesmo com o input vazio. */
  searchActive?: boolean;
  /** GET action para busca sem JS (ex.: "/"). */
  action?: string;
  /** Preserva o filtro de formato no submit GET. */
  format?: string;
  /** Link para limpar a busca sem JS. */
  clearHref?: string;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  loading,
  onClear,
  searchActive,
  action,
  format,
  clearHref,
}: SearchBarProps) {
  const isEmpty = !value.trim();
  const showClear = Boolean(onClear) && (!isEmpty || Boolean(searchActive));
  const noJsSearch = Boolean(action);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isEmpty) return;
    onSearch();
  }

  function handleClearClick(e: MouseEvent) {
    e.preventDefault();
    onClear?.();
  }

  return (
    <form
      role="search"
      method={noJsSearch ? 'get' : undefined}
      action={action}
      onSubmit={handleSubmit}
      className="flex w-full gap-2"
    >
      {noJsSearch && format && format !== 'ALL' && (
        <input type="hidden" name="format" value={format} />
      )}
      <div className="relative flex-1">
        <Input
          size="lg"
          type="search"
          name={noJsSearch ? 'q' : undefined}
          aria-label="Buscar anime"
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onChange(e.target.value)
          }
          placeholder="Ex: Naruto, One Piece..."
          className={cn(
            '[&::-webkit-search-cancel-button]:appearance-none',
            showClear && 'pr-10',
          )}
        />
        {showClear &&
          (clearHref ? (
            <a
              href={clearHref}
              onClick={handleClearClick}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink/50 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <X className="h-4 w-4" />
            </a>
          ) : (
            <button
              type="button"
              onClick={onClear}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink/50 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <X className="h-4 w-4" />
            </button>
          ))}
      </div>
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
