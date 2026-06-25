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
});
