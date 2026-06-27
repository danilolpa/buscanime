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

  it('renderiza links quando a option tem href', () => {
    render(
      <ToggleGroup
        options={[{ label: 'TV', value: 'TV', href: '/?format=TV' }]}
        value="ALL"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('link', { name: 'TV' })).toHaveAttribute(
      'href',
      '/?format=TV',
    );
  });

  it('marca aria-current na opção ativa com href', () => {
    render(
      <ToggleGroup
        options={[
          { label: 'Todos', value: 'ALL', href: '/' },
          { label: 'TV', value: 'TV', href: '/?format=TV' },
        ]}
        value="TV"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('link', { name: 'TV' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('chama onChange ao clicar em link (client navigation)', async () => {
    const onChange = vi.fn();
    render(
      <ToggleGroup
        options={[{ label: 'TV', value: 'TV', href: '/?format=TV' }]}
        value="ALL"
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole('link', { name: 'TV' }));
    expect(onChange).toHaveBeenCalledWith('TV');
  });

  it('sem violações de a11y', async () => {
    const { container } = render(
      <ToggleGroup options={options} value="ALL" onChange={vi.fn()} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renderiza a badge de contagem quando a option tem badge', () => {
    render(
      <ToggleGroup
        options={[{ label: 'TV Show', value: 'TV', badge: 9 }]}
        value="ALL"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('renderiza a badge "0"', () => {
    render(
      <ToggleGroup
        options={[{ label: 'Music', value: 'MUSIC', badge: 0 }]}
        value="ALL"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
