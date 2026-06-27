export interface ExternalLinkItem {
  url: string;
  site: string;
  color: string | null;
}
export interface ExternalLinksProps {
  links: ExternalLinkItem[];
}

export function ExternalLinks({ links }: ExternalLinksProps) {
  if (links.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {links.map((l) => (
        <li key={l.url}>
          <a
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50"
            style={
              l.color
                ? { borderLeftColor: l.color, borderLeftWidth: 3 }
                : undefined
            }
          >
            {l.site}
          </a>
        </li>
      ))}
    </ul>
  );
}
