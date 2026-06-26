import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, it, expect, vi } from 'vitest';
import { ToggleGroup } from './toggle-group';

const options = [
  { label: 'Todos', value: 'ALL' },
  { label: 'TV', value: 'TV' },
  { label: 'Filme', value: 'MOVIE' },
];

describe('ToggleGroup', () => {
  it('renderiza todas as opções', () => {
    render(<ToggleGroup options={options} value="ALL" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Todos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'TV' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filme' })).toBeInTheDocument();
  });

  it('marca aria-pressed na opção ativa', () => {
    render(<ToggleGroup options={options} value="TV" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'TV' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('chama onChange com o value correto ao clicar', async () => {
    const onChange = vi.fn();
    render(<ToggleGroup options={options} value="ALL" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'TV' }));
    expect(onChange).toHaveBeenCalledWith('TV');
  });

  it('sem violações de a11y', async () => {
    const { container } = render(
      <ToggleGroup options={options} value="ALL" onChange={vi.fn()} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
