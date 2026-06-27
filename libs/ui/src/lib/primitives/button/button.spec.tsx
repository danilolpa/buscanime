import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('renderiza children e dispara onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Buscar</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renderiza o ícone', () => {
    render(<Button icon={<svg data-testid="ic" />}>Ver mais</Button>);
    expect(screen.getByTestId('ic')).toBeInTheDocument();
  });

  it('mostra spinner, desabilita e marca aria-busy quando loading', () => {
    render(<Button loading>Buscar</Button>);
    const btn = screen.getByRole('button', { name: 'Buscar' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn.querySelector('svg.animate-spin')).toBeInTheDocument();
  });

  it('sem violações de a11y no estado loading', async () => {
    const { container } = render(<Button loading>Buscar</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('sem violações de a11y', async () => {
    const { container } = render(<Button>OK</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
