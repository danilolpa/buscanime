import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect } from 'vitest';
import { ExternalLinks } from './external-links';

const links = [
  { url: 'https://crunchyroll.com/x', site: 'Crunchyroll', color: '#f47521' },
];

describe('ExternalLinks', () => {
  it('renderiza links externos com rel seguro', () => {
    render(<ExternalLinks links={links} />);
    const link = screen.getByRole('link', { name: 'Crunchyroll' });
    expect(link).toHaveAttribute('href', 'https://crunchyroll.com/x');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('não renderiza nada quando vazio', () => {
    const { container } = render(<ExternalLinks links={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('sem violações de a11y', async () => {
    const { container } = render(<ExternalLinks links={links} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
