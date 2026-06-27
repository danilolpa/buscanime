import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Logo } from './logo';

describe('Logo', () => {
  it('renderiza BUSC e ANIME no texto', () => {
    render(<Logo />);
    expect(screen.getByText('BUSC')).toBeInTheDocument();
    expect(screen.getByText('ANIME')).toBeInTheDocument();
  });

  it('renderiza como span por padrão', () => {
    const { container } = render(<Logo />);
    expect(container.firstChild?.nodeName).toBe('SPAN');
  });

  it('renderiza como âncora quando as="a"', () => {
    render(<Logo as="a" href="/" />);
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('aplica size md por padrão', () => {
    const { container } = render(<Logo />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('text-xl');
  });

  it('aplica size lg', () => {
    const { container } = render(<Logo size="lg" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('text-3xl');
  });
});
