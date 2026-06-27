import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect } from 'vitest';
import { DescriptionText, stripAniListHtml } from './description-text';

describe('stripAniListHtml', () => {
  it('converts <br> to line breaks and strips other tags', () => {
    expect(stripAniListHtml('A<br>B<br/>C <i>x</i> <b>y</b>')).toBe(
      'A\nB\nC x y',
    );
  });
  it('decodes common entities and trims', () => {
    expect(stripAniListHtml('  Tom &amp; Jerry &mdash; ok  ')).toBe(
      'Tom & Jerry — ok',
    );
  });
  it('returns empty string for null', () => {
    expect(stripAniListHtml(null)).toBe('');
  });
});

describe('DescriptionText', () => {
  it('renders paragraphs split on blank lines', () => {
    render(<DescriptionText html={'Line one.<br><br>Line two.'} />);
    expect(screen.getByText('Line one.')).toBeInTheDocument();
    expect(screen.getByText('Line two.')).toBeInTheDocument();
  });
  it('renders a fallback when empty', () => {
    render(<DescriptionText html={null} />);
    expect(screen.getByText('Sem descrição disponível.')).toBeInTheDocument();
  });
  it('sem violações de a11y', async () => {
    const { container } = render(<DescriptionText html={'Hello.'} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
