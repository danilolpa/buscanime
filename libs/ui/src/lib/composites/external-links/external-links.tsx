import type { ReactNode } from 'react';
import { Video, ShoppingCart, ExternalLink, Play } from 'lucide-react';
import { buttonVariants } from '../../primitives/button/button';
import { cn } from '../../utils/cn';

export interface ExternalLinkItem {
  url: string;
  site: string;
  color: string | null;
}
export interface ExternalLinksProps {
  links: ExternalLinkItem[];
}

interface Brand {
  match: string;
  /** Tailwind bg class — tons ajustados para contraste WCAG AA (≥ 4.5:1). */
  bg: string;
  /** Tailwind text class */
  fg: string;
}

const BRANDS: Brand[] = [
  { match: 'youtube', bg: 'bg-red-600', fg: 'text-white' },
  { match: 'crunchyroll', bg: 'bg-orange-700', fg: 'text-white' },
  { match: 'netflix', bg: 'bg-red-700', fg: 'text-white' },
  { match: 'hulu', bg: 'bg-emerald-400', fg: 'text-emerald-950' },
  { match: 'funimation', bg: 'bg-violet-900', fg: 'text-white' },
  { match: 'prime video', bg: 'bg-blue-600', fg: 'text-white' },
  { match: 'disney', bg: 'bg-blue-700', fg: 'text-white' },
  { match: 'hidive', bg: 'bg-cyan-700', fg: 'text-white' },
  { match: 'tiktok', bg: 'bg-neutral-950', fg: 'text-white' },
  { match: 'facebook', bg: 'bg-blue-600', fg: 'text-white' },
  { match: 'twitter', bg: 'bg-blue-500', fg: 'text-white' },
];

function brandFor(site: string): Brand | null {
  const lower = site.toLowerCase();
  return BRANDS.find((b) => lower.includes(b.match)) ?? null;
}

function siteIcon(site: string): ReactNode {
  const lower = site.toLowerCase();
  if (lower.includes('youtube')) return <Video size={16} />;
  if (lower.includes('amazon')) return <ShoppingCart size={16} />;
  if (
    lower.includes('funimation') ||
    lower.includes('hidive') ||
    lower.includes('netflix') ||
    lower.includes('prime video') ||
    lower.includes('crunchyroll') ||
    lower.includes('hulu') ||
    lower.includes('disney')
  )
    return <Play size={16} />;
  return <ExternalLink size={16} />;
}

export function ExternalLinks({ links }: ExternalLinksProps) {
  if (links.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {links.map((l) => {
        const brand = brandFor(l.site);
        return (
          <li key={`${l.site}-${l.url}`}>
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({
                  variant: brand ? 'solid' : 'accent',
                  size: 'md',
                }),
                'w-full justify-start gap-2',
                brand && [brand.bg, brand.fg, 'hover:opacity-90'],
              )}
            >
              <span aria-hidden="true">{siteIcon(l.site)}</span>
              {l.site}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
