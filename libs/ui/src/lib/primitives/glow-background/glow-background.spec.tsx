import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { it, expect, describe } from 'vitest';
import { GlowBackground } from './glow-background';

describe('GlowBackground', () => {
  it('renderiza um fundo decorativo (aria-hidden)', () => {
    const { container } = render(<GlowBackground seed={1} />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('é determinístico: a mesma semente gera o mesmo gradiente', () => {
    const a = render(<GlowBackground seed="naruto" />);
    const b = render(<GlowBackground seed="naruto" />);
    const styleA = a.container.firstElementChild?.getAttribute('style');
    const styleB = b.container.firstElementChild?.getAttribute('style');
    expect(styleA).toBe(styleB);
  });

  it('aceita seed numérica e string sem quebrar', () => {
    expect(() => render(<GlowBackground seed={42} />)).not.toThrow();
    expect(() => render(<GlowBackground seed="one piece" />)).not.toThrow();
  });

  it('não tem violações de a11y', async () => {
    const { container } = render(<GlowBackground seed={1} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
