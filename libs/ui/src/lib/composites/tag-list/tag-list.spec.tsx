import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { it, expect } from 'vitest';
import { TagList } from './tag-list';

it('renderiza um chip por item', () => {
  render(<TagList items={['Action', 'Drama', 'Shounen']} />);
  ['Action', 'Drama', 'Shounen'].forEach((t) =>
    expect(screen.getByText(t)).toBeInTheDocument(),
  );
});
it('não renderiza nada quando vazio', () => {
  const { container } = render(<TagList items={[]} />);
  expect(container).toBeEmptyDOMElement();
});
it('sem violações de a11y', async () => {
  const { container } = render(<TagList items={['Action']} />);
  expect(await axe(container)).toHaveNoViolations();
});
