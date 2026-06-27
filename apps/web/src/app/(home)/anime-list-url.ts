/** Monta a URL da listagem (`/` + `format` / `q` opcionais). */
export function buildAnimeListUrl(
  pathname: string,
  format: string,
  q: string,
): string {
  const params = new URLSearchParams();
  if (format !== 'ALL') params.set('format', format);
  if (q.trim()) params.set('q', q.trim());
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
