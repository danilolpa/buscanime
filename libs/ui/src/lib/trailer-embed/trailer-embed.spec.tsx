import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { it, expect } from 'vitest';
import { TrailerEmbed } from './trailer-embed';

it('não renderiza nada sem youtubeId', () => {
  const { container } = render(
    <TrailerEmbed youtubeId={null} thumbnail={null} />,
  );
  expect(container).toBeEmptyDOMElement();
});
it('carrega o iframe só após o clique', () => {
  render(<TrailerEmbed youtubeId="abc123" thumbnail="t.jpg" title="Trailer" />);
  expect(screen.queryByTitle('Trailer')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /reproduzir trailer/i }));
  const iframe = screen.getByTitle('Trailer');
  expect(iframe).toHaveAttribute('src', expect.stringContaining('abc123'));
});
it('sem violações de a11y', async () => {
  const { container } = render(
    <TrailerEmbed youtubeId="abc123" thumbnail="t.jpg" />,
  );
  expect(await axe(container)).toHaveNoViolations();
});
