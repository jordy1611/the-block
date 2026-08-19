import { describe, expect, it } from 'vitest';

import { TitleBadge } from '../../../src/components/common/TitleBadge';
import { renderWithProviders, screen } from '../../support/render';

describe('TitleBadge', () => {
  it('names a clean title rather than saying nothing', () => {
    renderWithProviders(<TitleBadge status="clean" />);

    expect(screen.getByText('Clean title')).toBeInTheDocument();
  });

  it.each([
    ['salvage', 'Salvage'],
    ['rebuilt', 'Rebuilt'],
  ] as const)('flags a %s title', (status, label) => {
    renderWithProviders(<TitleBadge status={status} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
