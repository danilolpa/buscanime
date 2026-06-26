import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const replace = vi.fn();
let params = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/',
  useSearchParams: () => params,
}));

import { useAnimeFilters } from './use-anime-filters';

beforeEach(() => {
  replace.mockClear();
  params = new URLSearchParams();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe('useAnimeFilters', () => {
  it('setFormat grava format na URL e remove em ALL', () => {
    const { result } = renderHook(() => useAnimeFilters());
    act(() => result.current.setFormat('TV'));
    expect(replace).toHaveBeenCalledWith('/?format=TV', { scroll: false });
    act(() => result.current.setFormat('ALL'));
    expect(replace).toHaveBeenLastCalledWith('/', { scroll: false });
  });

  it('digitar faz debounce de 300ms antes de gravar q', () => {
    const { result } = renderHook(() => useAnimeFilters());
    act(() => result.current.onChangeText('naruto'));
    expect(replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(300));
    expect(replace).toHaveBeenCalledWith('/?q=naruto', { scroll: false });
  });

  it('flush (Buscar/Enter) grava na hora e cancela o debounce pendente', () => {
    const { result } = renderHook(() => useAnimeFilters());
    act(() => result.current.onChangeText('one piece'));
    act(() => result.current.flush());
    expect(replace).toHaveBeenCalledWith('/?q=one+piece', { scroll: false });
    replace.mockClear();
    act(() => vi.advanceTimersByTime(300));
    expect(replace).not.toHaveBeenCalled();
  });
});
