import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('renderiza o elemento decorativo', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el).toBeInTheDocument();
  });

  it('aplica aria-hidden (decorativo)', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });

  it('aplica rounded quando rounded=true', () => {
    const { container } = render(<Skeleton rounded />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('rounded-full');
  });

  it('aplica dimensões via style quando fornecidas', () => {
    const { container } = render(<Skeleton width={200} height={16} />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveStyle({ width: '200px', height: '16px' });
  });
});
