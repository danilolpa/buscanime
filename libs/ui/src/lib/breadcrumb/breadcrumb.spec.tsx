import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { it, expect, describe } from 'vitest';
import { Breadcrumb } from './breadcrumb';

const items = [{ label: 'Home', href: '/' }, { label: 'Naruto' }];

describe('Breadcrumb', () => {
  it('renderiza o nav com aria-label breadcrumb', () => {
    render(<Breadcrumb items={items} />);
    expect(
      screen.getByRole('navigation', { name: 'breadcrumb' }),
    ).toBeInTheDocument();
  });

  it('renderiza link para itens com href', () => {
    render(<Breadcrumb items={items} />);
    const link = screen.getByRole('link', { name: 'Home' });
    expect(link).toHaveAttribute('href', '/');
  });

  it('renderiza o item atual sem link e com aria-current="page"', () => {
    render(<Breadcrumb items={items} />);
    const current = screen.getByText('Naruto');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.tagName).not.toBe('A');
  });

  it('sem violações de a11y', async () => {
    const { container } = render(<Breadcrumb items={items} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
