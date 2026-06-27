import { describe, it, expect } from 'vitest';
import { buildAnimeListUrl } from './anime-list-url';

describe('buildAnimeListUrl', () => {
  it('retorna pathname sem query quando ALL e q vazio', () => {
    expect(buildAnimeListUrl('/', 'ALL', '')).toBe('/');
  });

  it('inclui format na query', () => {
    expect(buildAnimeListUrl('/', 'TV', '')).toBe('/?format=TV');
  });

  it('inclui q na query', () => {
    expect(buildAnimeListUrl('/', 'ALL', 'naruto')).toBe('/?q=naruto');
  });

  it('combina format e q', () => {
    expect(buildAnimeListUrl('/', 'TV', 'one piece')).toBe(
      '/?format=TV&q=one+piece',
    );
  });
});
