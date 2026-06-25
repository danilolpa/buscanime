import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';
import { cn } from '../utils/cn';
import { Container } from '../container/container';
import { Logo } from '../logo/logo';

export interface HeaderProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

export const Header = forwardRef<HTMLElement, HeaderProps>(function Header(
  { className, children, ...props },
  ref,
) {
  return (
    <header ref={ref} className={cn('bg-brand', className)} {...props}>
      <Container>
        <div className="flex items-center justify-between py-4">
          <Logo size="md" />
          {children}
        </div>
      </Container>
    </header>
  );
});
