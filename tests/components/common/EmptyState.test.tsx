import { describe, expect, it } from 'vitest';
import { Button } from '@mantine/core';

import { EmptyState } from '../../../src/components/common/EmptyState';
import { renderWithProviders, screen } from '../../support/render';

describe('EmptyState', () => {
  it('renders the title as a heading', () => {
    renderWithProviders(<EmptyState title="No vehicles match that search" />);

    expect(
      screen.getByRole('heading', { name: 'No vehicles match that search' }),
    ).toBeInTheDocument();
  });

  it('renders the optional description and recovery action', () => {
    renderWithProviders(
      <EmptyState
        title="Something went wrong"
        description="The inventory could not be loaded."
        action={<Button>Try again</Button>}
      />,
    );

    expect(screen.getByText('The inventory could not be loaded.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
