import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, it, expect, vi } from 'vitest';
import { Input } from './input';

describe('Input', () => {
  it('renderiza com aria-label acessível', () => {
    render(
      <Input aria-label="Buscar anime" value="" onChange={() => undefined} />,
    );
    expect(
      screen.getByRole('textbox', { name: 'Buscar anime' }),
    ).toBeInTheDocument();
  });

  it('dispara onChange ao digitar', async () => {
    const onChange = vi.fn();
    render(<Input aria-label="Buscar anime" value="" onChange={onChange} />);
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Buscar anime' }),
      'Na',
    );
    expect(onChange).toHaveBeenCalled();
  });

  it('renderiza ícone quando fornecido', () => {
    render(
      <Input
        aria-label="Buscar"
        value=""
        onChange={() => undefined}
        icon={<svg data-testid="search-icon" />}
      />,
    );
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('sem violações de a11y', async () => {
    const { container } = render(
      <Input aria-label="Buscar anime" value="" onChange={() => undefined} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
