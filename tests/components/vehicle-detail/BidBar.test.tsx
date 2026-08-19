import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

import { BidBar } from '../../../src/features/vehicle-detail/components/BidBar';
import { renderWithProviders, screen } from '../../support/render';
import {
  LIVE_AUCTION_START,
  SCHEDULED_AUCTION_START,
  makeVehicle,
} from '../../support/vehicle';

const noop = () => {};

describe('BidBar', () => {
  it('opens the bid form on a live lot', async () => {
    const onPlaceBid = vi.fn();
    renderWithProviders(
      <BidBar
        vehicle={makeVehicle({ auction_start: LIVE_AUCTION_START, current_bid: 16_200 })}
        onPlaceBid={onPlaceBid}
        onBuyNow={noop}
      />,
    );

    expect(screen.getByText('Current bid')).toBeInTheDocument();
    expect(screen.getByText('$16,200')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Place bid' }));

    expect(onPlaceBid).toHaveBeenCalledOnce();
  });

  it('disables both actions before the lane opens, and says when it does', () => {
    renderWithProviders(
      <BidBar
        vehicle={makeVehicle({
          auction_start: SCHEDULED_AUCTION_START,
          buy_now_price: 19_900,
        })}
        onPlaceBid={noop}
        onBuyNow={noop}
      />,
    );

    expect(screen.getByText('Starting bid')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Place bid' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buy now' })).toBeDisabled();
    expect(screen.getByText(/^Opens /)).toBeInTheDocument();
  });

  it('offers buyout only where there is a buy-now price', async () => {
    const onBuyNow = vi.fn();
    const { rerender } = renderWithProviders(
      <BidBar
        vehicle={makeVehicle({ auction_start: LIVE_AUCTION_START, buy_now_price: null })}
        onPlaceBid={noop}
        onBuyNow={onBuyNow}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Buy now' })).not.toBeInTheDocument();

    rerender(
      <BidBar
        vehicle={makeVehicle({ auction_start: LIVE_AUCTION_START, buy_now_price: 19_900 })}
        onPlaceBid={noop}
        onBuyNow={onBuyNow}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Buy now' }));

    expect(onBuyNow).toHaveBeenCalledOnce();
  });

  it('reports the reserve as a status and never as a figure', () => {
    const { rerender, container } = renderWithProviders(
      <BidBar
        vehicle={makeVehicle({ current_bid: 16_200, reserve_price: 20_000 })}
        onPlaceBid={noop}
        onBuyNow={noop}
      />,
    );

    expect(screen.getByText('Not met')).toBeInTheDocument();
    expect(container).not.toHaveTextContent('$20,000');

    rerender(
      <BidBar
        vehicle={makeVehicle({ current_bid: 21_000, reserve_price: 20_000 })}
        onPlaceBid={noop}
        onBuyNow={noop}
      />,
    );
    expect(screen.getByText('Met')).toBeInTheDocument();

    rerender(
      <BidBar
        vehicle={makeVehicle({ reserve_price: null })}
        onPlaceBid={noop}
        onBuyNow={noop}
      />,
    );
    expect(screen.getByText('None')).toBeInTheDocument();
  });
});
