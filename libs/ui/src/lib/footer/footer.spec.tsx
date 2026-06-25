import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe } from 'vitest-axe';
import { Footer } from './footer';

describe('Footer', () => {
  it('renderiza o texto do Logo (BUSC e ANIME)', () => {
    render(<Footer />);
    expect(screen.getByText('BUSC')).toBeInTheDocument();
    expect(screen.getByText('ANIME')).toBeInTheDocument();
  });

  it('expõe role contentinfo', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('renderiza linha de copyright', () => {
    render(<Footer />);
    expect(screen.getByText(/BuscAnime/i)).toBeInTheDocument();
  });

  it('sem violações de a11y', async () => {
    const { container } = render(<Footer />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
