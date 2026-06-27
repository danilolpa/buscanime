import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { it, expect } from 'vitest';
import { StatList } from './stat-list';

it('renderiza label e valor, pulando vazios', () => {
  render(
    <StatList
      items={[
        { label: 'Episódios', value: 25 },
        { label: 'Fonte', value: null },
      ]}
    />,
  );
  expect(screen.getByText('Episódios')).toBeInTheDocument();
  expect(screen.getByText('25')).toBeInTheDocument();
  expect(screen.queryByText('Fonte')).not.toBeInTheDocument();
});
it('sem violações de a11y', async () => {
  const { container } = render(
    <StatList items={[{ label: 'Status', value: 'Finalizado' }]} />,
  );
  expect(await axe(container)).toHaveNoViolations();
});
