import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe } from 'vitest-axe';
import { Container } from './container';

describe('Container', () => {
  it('renderiza children', () => {
    render(
      <Container>
        <span data-testid="child">conteúdo</span>
      </Container>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('aplica as classes de layout padrão', () => {
    const { container } = render(<Container>x</Container>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('mx-auto');
    expect(el.className).toContain('max-w-6xl');
  });

  it('mescla className extra', () => {
    const { container } = render(
      <Container className="extra-class">x</Container>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('extra-class');
  });

  it('sem violações de a11y', async () => {
    const { container } = render(
      <Container>
        <p>Conteúdo de teste</p>
      </Container>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
