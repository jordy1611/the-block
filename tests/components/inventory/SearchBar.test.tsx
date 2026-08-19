import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

import { SearchBar } from '../../../src/features/inventory/components/SearchBar';
import { renderWithProviders, screen } from '../../support/render';

describe('SearchBar', () => {
  it('reports what the buyer typed', async () => {
    const onChange = vi.fn();
    renderWithProviders(<SearchBar value="" onChange={onChange} />);

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search inventory' }), 'cx5');

    // Controlled and never re-rendered with a new value, so each keystroke
    // reports a single character rather than the accumulated query.
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenLastCalledWith('5');
  });

  it('offers a clear button only once there is something to clear', async () => {
    const onChange = vi.fn();
    const { rerender } = renderWithProviders(<SearchBar value="" onChange={onChange} />);

    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();

    rerender(<SearchBar value="mazda" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(onChange).toHaveBeenCalledWith('');
  });
});
