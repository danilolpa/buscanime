import { describe, it, expect } from 'vitest';
import { slugify, animeHref } from './slug.js';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Attack on Titan')).toBe('attack-on-titan');
  });
  it('strips punctuation and collapses separators', () => {
    expect(slugify('Re:Zero − Starting Life!!')).toBe('re-zero-starting-life');
  });
  it('strips accents/diacritics', () => {
    expect(slugify('Mahō Shōjo')).toBe('maho-shojo');
  });
  it('falls back to "anime" for empty/symbol-only titles', () => {
    expect(slugify('—')).toBe('anime');
    expect(slugify('')).toBe('anime');
  });
});

describe('animeHref', () => {
  it('builds /anime/<id>/<slug>', () => {
    expect(animeHref(16498, 'Attack on Titan')).toBe(
      '/anime/16498/attack-on-titan',
    );
  });
});
