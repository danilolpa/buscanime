import type { ReactNode } from 'react';
import { Video, ShoppingCart, ExternalLink, Play } from 'lucide-react';
import { buttonVariants } from '../button/button';
import { cn } from '../utils/cn';

export interface ExternalLinkItem {
  url: string;
  site: string;
  color: string | null;
}
export interface ExternalLinksProps {
  links: ExternalLinkItem[];
}

function siteIcon(site: string): ReactNode {
  const lower = site.toLowerCase();
  if (lower.includes('youtube')) return <Video size={16} />;
  if (lower.includes('amazon')) return <ShoppingCart size={16} />;
  if (
    lower.includes('funimation') ||
    lower.includes('hidive') ||
    lower.includes('netflix') ||
    lower.includes('prime video')
  )
    return <Play size={16} />;
  return <ExternalLink size={16} />;
}

export function ExternalLinks({ links }: ExternalLinksProps) {
  if (links.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {links.map((l) => (
        <li key={`${l.site}-${l.url}`}>
          <a
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'md' }),
              'w-full justify-start gap-2',
            )}
          >
            <span aria-hidden="true">{siteIcon(l.site)}</span>
            {l.site}
          </a>
        </li>
      ))}
    </ul>
  );
}
