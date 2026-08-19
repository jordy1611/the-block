import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';

import { VehicleCard } from '../../../src/features/inventory/components/VehicleCard';
import { renderWithProviders, screen } from '../../support/render';
import {
  LIVE_AUCTION_START,
  SCHEDULED_AUCTION_START,
  makeVehicle,
} from '../../support/vehicle';

describe('VehicleCard', () => {
  it('links to the vehicle by name', () => {
    renderWithProviders(<VehicleCard vehicle={makeVehicle()} />);

    expect(screen.getByRole('link', { name: '2023 Mazda CX-5' })).toHaveAttribute(
      'href',
      '/vehicle/veh_0001',
    );
  });

  it('renders the facts a buyer scans on', () => {
    renderWithProviders(<VehicleCard vehicle={makeVehicle()} />);

    expect(screen.getByText('2.5L I4 · AWD')).toBeInTheDocument();
    expect(screen.getByText('47,731 km')).toBeInTheDocument();
    expect(screen.getByText('Mississauga, Ontario')).toBeInTheDocument();
    expect(screen.getByText('4.2')).toBeInTheDocument();
  });

  it('calls the bid "Starting bid" before the lane opens, and falls back to starting_bid', () => {
    renderWithProviders(
      <VehicleCard
        vehicle={makeVehicle({
          auction_start: SCHEDULED_AUCTION_START,
          current_bid: null,
          starting_bid: 14_500,
        })}
      />,
    );

    expect(screen.getByText('Starting bid')).toBeInTheDocument();
    expect(screen.getByText('$14,500')).toBeInTheDocument();
  });

  it('calls the bid "Current bid" once the lane is open, alongside the bid count', () => {
    renderWithProviders(
      <VehicleCard
        vehicle={makeVehicle({
          auction_start: LIVE_AUCTION_START,
          current_bid: 16_200,
          bid_count: 7,
        })}
      />,
    );

    expect(screen.getByText('Current bid')).toBeInTheDocument();
    expect(screen.getByText('$16,200')).toBeInTheDocument();
    expect(screen.getByText('7 bids')).toBeInTheDocument();
  });

  it('shows the buyout only when the lot has one', () => {
    const { rerender } = renderWithProviders(
      <VehicleCard vehicle={makeVehicle({ buy_now_price: null })} />,
    );

    expect(screen.queryByText('Buyout')).not.toBeInTheDocument();

    rerender(<VehicleCard vehicle={makeVehicle({ buy_now_price: 19_900 })} />);

    expect(screen.getByText('Buyout')).toBeInTheDocument();
    expect(screen.getByText('$19,900')).toBeInTheDocument();
  });

  it('pages the photo carousel without navigating', async () => {
    renderWithProviders(<VehicleCard vehicle={makeVehicle()} />);

    expect(screen.getByAltText('2023 Mazda CX-5, photo 1 of 2')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Next photo' }));

    expect(screen.getByAltText('2023 Mazda CX-5, photo 2 of 2')).toBeInTheDocument();
  });
});
