import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const replace = vi.fn();
// `let` (não `const`): cada beforeEach reatribui `params`, e o factory do mock lê o
// binding vivo (`() => params`) a cada render. NÃO trocar por `() => new URLSearchParams()`
// — isso quebraria o reset por teste.
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
});
