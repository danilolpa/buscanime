import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe } from 'vitest-axe';
import { SearchX } from 'lucide-react';
import { StatusState } from './status-state';

describe('StatusState', () => {
  it('renderiza o title', () => {
    render(
      <StatusState
        icon={<SearchX data-testid="icon" />}
        title="Nada encontrado"
      />,
    );
    expect(screen.getByText('Nada encontrado')).toBeInTheDocument();
  });

  it('renderiza o message quando fornecido', () => {
    render(
      <StatusState
        icon={<SearchX />}
        title="Nada encontrado"
        message="Tente outro termo de busca."
      />,
    );
    expect(screen.getByText('Tente outro termo de busca.')).toBeInTheDocument();
  });

  it('não renderiza message quando não fornecido', () => {
    render(<StatusState icon={<SearchX />} title="Nada encontrado" />);
    expect(
      screen.queryByText('Tente outro termo de busca.'),
    ).not.toBeInTheDocument();
  });

  it('renderiza action quando fornecido', () => {
    render(
      <StatusState
        icon={<SearchX />}
        title="Erro"
        action={<button>Tentar de novo</button>}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Tentar de novo' }),
    ).toBeInTheDocument();
  });

  it('renderiza o ícone passado', () => {
    render(
      <StatusState
        icon={<SearchX data-testid="status-icon" />}
        title="Nada encontrado"
      />,
    );
    expect(screen.getByTestId('status-icon')).toBeInTheDocument();
  });

  it('sem violações de a11y', async () => {
    const { container } = render(
      <StatusState
        icon={<SearchX />}
        title="Nada encontrado"
        message="Tente outro termo de busca."
        action={<button>Tentar de novo</button>}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('usa o tone neutral por padrão', () => {
    const { container } = render(
      <StatusState icon={<SearchX />} title="Nada encontrado" />,
    );
    const circle = container.querySelector('[aria-hidden="true"]');
    expect(circle).toHaveClass('bg-ink/5', 'text-ink/40');
  });

  it('aplica as classes do tone danger no círculo do ícone', () => {
    const { container } = render(
      <StatusState tone="danger" icon={<SearchX />} title="Erro" />,
    );
    const circle = container.querySelector('[aria-hidden="true"]');
    expect(circle).toHaveClass('bg-red-100', 'text-red-600');
  });

  it('aplica as classes do tone warning no círculo do ícone', () => {
    const { container } = render(
      <StatusState tone="warning" icon={<SearchX />} title="Muitas buscas" />,
    );
    const circle = container.querySelector('[aria-hidden="true"]');
    expect(circle).toHaveClass('bg-amber-100', 'text-amber-600');
  });

  it('aplica a animação de entrada sob motion-safe', () => {
    const { container } = render(<StatusState icon={<SearchX />} title="x" />);
    expect(container.firstChild).toHaveClass('motion-safe:animate-status-in');
  });

  it('sem violações de a11y no tone danger com action', async () => {
    const { container } = render(
      <StatusState
        tone="danger"
        icon={<SearchX />}
        title="Erro ao carregar"
        message="Algo deu errado ao buscar os animes."
        action={<button>Tentar de novo</button>}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
