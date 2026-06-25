import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../utils/cn';
import { Container } from '../container/container';
import { Logo } from '../logo/logo';

export type FooterProps = HTMLAttributes<HTMLElement>;

export const Footer = forwardRef<HTMLElement, FooterProps>(function Footer(
  { className, ...props },
  ref,
) {
  const year = new Date().getFullYear();

  return (
    <footer
      ref={ref}
      className={cn('bg-brand text-white/80', className)}
      {...props}
    >
      <Container>
        <div className="flex flex-col items-center gap-2 py-6 sm:flex-row sm:justify-between">
          <Logo size="md" />
          <p className="text-sm">
            &copy; {year} BuscAnime. Todos os direitos reservados.
          </p>
        </div>
      </Container>
    </footer>
  );
});
