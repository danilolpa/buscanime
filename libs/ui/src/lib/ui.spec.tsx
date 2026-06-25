import { render } from '@testing-library/react';

import BuscanimeUi from './ui';

describe('BuscanimeUi', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<BuscanimeUi />);
    expect(baseElement).toBeTruthy();
  });
});
