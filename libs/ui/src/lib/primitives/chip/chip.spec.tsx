import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect } from 'vitest';
import { Chip } from './chip';

describe('Chip', () => {
  it('renderiza children', () => {
    render(<Chip>Action</Chip>);
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('sem violações de a11y', async () => {
    const { container } = render(<Chip>Action</Chip>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
