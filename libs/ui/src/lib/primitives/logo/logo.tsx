import { type AnchorHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

type LogoSize = 'md' | 'lg';
type LogoAs = 'span' | 'a';

export interface LogoProps extends AnchorHTMLAttributes<HTMLElement> {
  size?: LogoSize;
  as?: LogoAs;
}

const sizeClass: Record<LogoSize, string> = {
  md: 'text-xl',
  lg: 'text-3xl',
};

export function Logo({
  size = 'md',
  as: Tag = 'span',
  className,
  ...props
}: LogoProps) {
  return (
    <Tag
      className={cn(
        'inline-flex items-baseline gap-0 font-bold leading-none',
        sizeClass[size],
        className,
      )}
      {...props}
    >
      <span className="text-white">BUSC</span>
      <span className="text-accent">ANIME</span>
    </Tag>
  );
}
