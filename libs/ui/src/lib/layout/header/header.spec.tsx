import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe } from 'vitest-axe';
import { Header } from './header';

describe('Header', () => {
  it('renderiza o texto do Logo (BUSC e ANIME)', () => {
    render(<Header />);
    expect(screen.getByText('BUSC')).toBeInTheDocument();
    expect(screen.getByText('ANIME')).toBeInTheDocument();
  });

  it('expõe role banner', () => {
    render(<Header />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('renderiza children quando passados', () => {
    render(
      <Header>
        <nav data-testid="nav">nav</nav>
      </Header>,
    );
    expect(screen.getByTestId('nav')).toBeInTheDocument();
  });

  it('logo é um link para a home', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: /BuscAnime/i });
    expect(link).toHaveAttribute('href', '/');
  });

  it('sem violações de a11y', async () => {
    const { container } = render(<Header />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
