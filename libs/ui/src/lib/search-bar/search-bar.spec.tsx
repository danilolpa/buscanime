import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, it, expect, vi } from 'vitest';
import { SearchBar } from './search-bar';

describe('SearchBar', () => {
  it('renderiza o input e o botão', () => {
    render(<SearchBar value="" onChange={vi.fn()} onSearch={vi.fn()} />);
    expect(
      screen.getByRole('searchbox', { name: 'Buscar anime' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeInTheDocument();
  });

  it('dispara onChange ao digitar', async () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} onSearch={vi.fn()} />);
    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Buscar anime' }),
      'N',
    );
    expect(onChange).toHaveBeenCalled();
  });

  it('dispara onSearch ao clicar no botão', async () => {
    const onSearch = vi.fn();
    render(<SearchBar value="Naruto" onChange={vi.fn()} onSearch={onSearch} />);
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(onSearch).toHaveBeenCalledOnce();
  });

  it('dispara onSearch ao pressionar Enter', async () => {
    const onSearch = vi.fn();
    render(<SearchBar value="Naruto" onChange={vi.fn()} onSearch={onSearch} />);
    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Buscar anime' }),
      '{Enter}',
    );
    expect(onSearch).toHaveBeenCalledOnce();
  });

  it('repassa loading pro botão Buscar', () => {
    render(
      <SearchBar
        value="naruto"
        onChange={vi.fn()}
        onSearch={vi.fn()}
        loading
      />,
    );
    expect(screen.getByRole('button', { name: 'Buscar' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('desabilita o botão Buscar quando o input está vazio', () => {
    render(<SearchBar value="   " onChange={vi.fn()} onSearch={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
  });

  it('habilita o botão Buscar quando há texto', () => {
    render(<SearchBar value="naruto" onChange={vi.fn()} onSearch={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeEnabled();
  });

  it('não dispara onSearch ao submeter com input vazio', async () => {
    const onSearch = vi.fn();
    render(<SearchBar value="" onChange={vi.fn()} onSearch={onSearch} />);
    // Enter com input vazio não deve buscar (botão desabilitado + guard no submit).
    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Buscar anime' }),
      '{Enter}',
    );
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('sem violações de a11y', async () => {
    const { container } = render(
      <SearchBar value="" onChange={vi.fn()} onSearch={vi.fn()} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
