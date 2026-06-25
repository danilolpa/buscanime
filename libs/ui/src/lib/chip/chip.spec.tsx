import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect } from 'vitest';
import { Chip } from './chip';

describe('Chip', () => {
  it('renderiza children', () => {
    render(<Chip>Action</Chip>);
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('renderiza variante onImage', () => {
    render(<Chip variant="onImage">Drama</Chip>);
    expect(screen.getByText('Drama')).toBeInTheDocument();
  });

  it('sem violações de a11y — default', async () => {
    const { container } = render(<Chip>Action</Chip>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('sem violações de a11y — onImage', async () => {
    const { container } = render(<Chip variant="onImage">Drama</Chip>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
