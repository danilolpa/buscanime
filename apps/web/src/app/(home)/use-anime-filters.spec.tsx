import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/',
}));

import { useAnimeFilters } from './use-anime-filters';

beforeEach(() => {
  replace.mockClear();
});

describe('useAnimeFilters', () => {
  it('setFormat grava format na URL e remove em ALL', () => {
    const { result } = renderHook(() => useAnimeFilters());
    act(() => result.current.setFormat('TV'));
    expect(replace).toHaveBeenCalledWith('/?format=TV', { scroll: false });
    act(() => result.current.setFormat('ALL'));
    expect(replace).toHaveBeenLastCalledWith('/', { scroll: false });
  });

  it('onChangeText só atualiza o texto local (sem busca automática na URL)', () => {
    const { result } = renderHook(() => useAnimeFilters());
    act(() => result.current.onChangeText('naruto'));
    expect(result.current.text).toBe('naruto');
    expect(replace).not.toHaveBeenCalled();
  });

  it('submitSearch grava o texto atual como q na URL', () => {
    const { result } = renderHook(() => useAnimeFilters());
    act(() => result.current.onChangeText('one piece'));
    act(() => result.current.submitSearch());
    expect(replace).toHaveBeenCalledWith('/?q=one+piece', { scroll: false });
  });

  it('clearSearch zera o texto e remove o q da URL', () => {
    const { result } = renderHook(() =>
      useAnimeFilters({ initialQ: 'naruto' }),
    );
    expect(result.current.text).toBe('naruto');
    act(() => result.current.clearSearch());
    expect(result.current.text).toBe('');
    expect(replace).toHaveBeenCalledWith('/', { scroll: false });
  });

  it('inicializa format e q a partir das props do server', () => {
    const { result } = renderHook(() =>
      useAnimeFilters({ initialFormat: 'TV', initialQ: 'bleach' }),
    );
    expect(result.current.format).toBe('TV');
    expect(result.current.q).toBe('bleach');
    expect(result.current.text).toBe('bleach');
  });
});
