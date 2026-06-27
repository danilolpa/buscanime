const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
  '&nbsp;': ' ',
};

export function stripAniListHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z#0-9]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m)
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

export interface DescriptionTextProps {
  html: string | null | undefined;
}

export function DescriptionText({ html }: DescriptionTextProps) {
  const text = stripAniListHtml(html);
  if (!text) {
    return <p className="text-sm text-ink-subtle">Sem descrição disponível.</p>;
  }
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, ' ').trim());
  return (
    <div className="space-y-3 text-sm leading-relaxed text-ink-muted">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
