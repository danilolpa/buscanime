import type { MediaFormat } from '@buscanime/shared-types';
import type { ToggleGroupOption } from '@buscanime/ui';

export const FORMAT_OPTIONS: ToggleGroupOption[] = [
  { label: 'All Formats', value: 'ALL' },
  { label: 'TV Show', value: 'TV' },
  { label: 'Movie', value: 'MOVIE' },
  { label: 'TV Short', value: 'TV_SHORT' },
  { label: 'Special', value: 'SPECIAL' },
  { label: 'OVA', value: 'OVA' },
  { label: 'ONA', value: 'ONA' },
  { label: 'Music', value: 'MUSIC' },
];

/** 'ALL' (ou desconhecido) → undefined (sem filtro); senão o próprio MediaFormat. */
export function toMediaFormat(value: string): MediaFormat | undefined {
  return value === 'ALL' ? undefined : (value as MediaFormat);
}
