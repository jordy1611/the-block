import { describe, expect, it } from 'vitest';

import { Money } from '../../../src/components/common/Money';
import { renderWithProviders, screen } from '../../support/render';

describe('Money', () => {
  it('renders the amount as whole-dollar CAD', () => {
    renderWithProviders(<Money value={14_500} />);

    expect(screen.getByText('$14,500')).toBeInTheDocument();
  });

  it('passes Mantine text props through to the rendered element', () => {
    renderWithProviders(<Money value={2_500} data-testid="bid" />);

    expect(screen.getByTestId('bid')).toHaveTextContent('$2,500');
  });
});
