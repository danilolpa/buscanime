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

  it('renderiza input name=q e hidden format no GET form', () => {
    render(
      <SearchBar
        value=""
        onChange={vi.fn()}
        onSearch={vi.fn()}
        action="/"
        format="TV"
      />,
    );
    expect(
      screen.getByRole('searchbox', { name: 'Buscar anime' }),
    ).toHaveAttribute('name', 'q');
    expect(document.querySelector('input[name="format"]')).toHaveValue('TV');
  });

  it('mostra × como link quando clearHref é passado', async () => {
    const onClear = vi.fn();
    render(
      <SearchBar
        value="naruto"
        onChange={vi.fn()}
        onSearch={vi.fn()}
        onClear={onClear}
        clearHref="/?format=TV"
      />,
    );
    const clear = screen.getByRole('link', { name: 'Limpar busca' });
    expect(clear).toHaveAttribute('href', '/?format=TV');
    await userEvent.click(clear);
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('sem violações de a11y', async () => {
    const { container } = render(
      <SearchBar value="" onChange={vi.fn()} onSearch={vi.fn()} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('mostra × e dispara onClear quando há texto', async () => {
    const onClear = vi.fn();
    render(
      <SearchBar
        value="naruto"
        onChange={vi.fn()}
        onSearch={vi.fn()}
        onClear={onClear}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Limpar busca' }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('mostra × quando o input está vazio mas há busca ativa', () => {
    render(
      <SearchBar
        value=""
        onChange={vi.fn()}
        onSearch={vi.fn()}
        onClear={vi.fn()}
        searchActive
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Limpar busca' }),
    ).toBeInTheDocument();
  });

  it('não mostra × quando vazio e sem busca ativa', () => {
    render(
      <SearchBar
        value=""
        onChange={vi.fn()}
        onSearch={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Limpar busca' }),
    ).not.toBeInTheDocument();
  });

  it('não mostra × sem onClear', () => {
    render(<SearchBar value="naruto" onChange={vi.fn()} onSearch={vi.fn()} />);
    expect(
      screen.queryByRole('button', { name: 'Limpar busca' }),
    ).not.toBeInTheDocument();
  });
});
