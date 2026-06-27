export function slugify(title: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics (combining marks)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumerics -> hyphen
    .replace(/^-+|-+$/g, ''); // trim hyphens
  return slug || 'anime';
}

export function animeHref(id: number, title: string): string {
  return `/anime/${id}/${slugify(title)}`;
}
