import { describe, it, expect } from 'vitest';
import { FORMAT_OPTIONS, toMediaFormat } from './format-options';

describe('format-options', () => {
  it('a primeira opção é "All Formats" com value ALL', () => {
    expect(FORMAT_OPTIONS[0]).toEqual({ label: 'All Formats', value: 'ALL' });
  });

  it('ALL vira undefined (sem filtro)', () => {
    expect(toMediaFormat('ALL')).toBeUndefined();
  });

  it('os demais valores viram o MediaFormat correspondente', () => {
    expect(toMediaFormat('TV')).toBe('TV');
    expect(toMediaFormat('MOVIE')).toBe('MOVIE');
    expect(toMediaFormat('MUSIC')).toBe('MUSIC');
  });
});
