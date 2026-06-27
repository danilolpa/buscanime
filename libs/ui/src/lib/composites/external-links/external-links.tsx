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
  bg: string;
  fg: string;
}

/**
 * Cor da marca para as redes mais comuns. Os tons foram ajustados para
 * garantir contraste WCAG AA (≥ 4.5:1) com o texto escolhido — sites sem
 * mapeamento caem no botão `accent` padrão.
 */
const BRANDS: Brand[] = [
  { match: 'youtube', bg: '#e00000', fg: '#ffffff' },
  { match: 'crunchyroll', bg: '#c8500a', fg: '#ffffff' },
  { match: 'netflix', bg: '#e50914', fg: '#ffffff' },
  { match: 'hulu', bg: '#1ce783', fg: '#053d2a' },
  { match: 'funimation', bg: '#410099', fg: '#ffffff' },
  { match: 'prime video', bg: '#1276c7', fg: '#ffffff' },
  { match: 'disney', bg: '#113ccf', fg: '#ffffff' },
  { match: 'hidive', bg: '#0b7ca6', fg: '#ffffff' },
  { match: 'tiktok', bg: '#000000', fg: '#ffffff' },
  { match: 'facebook', bg: '#1466d6', fg: '#ffffff' },
  { match: 'twitter', bg: '#1378c4', fg: '#ffffff' },
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
                brand && 'hover:opacity-90',
              )}
              style={
                brand
                  ? { backgroundColor: brand.bg, color: brand.fg }
                  : undefined
              }
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
