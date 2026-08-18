import type { Vehicle } from '../types/vehicle';

/**
 * Bidding rules. Pure functions — no React, no I/O, no store access.
 *
 * The dataset has no bid increment of its own, so we set one. $100 is coarse
 * enough to feel like a real auction floor and fine enough that it never
 * outpaces the cheapest lots (the lowest bid in the inventory is $2,500).
 */
export const BID_INCREMENT = 100;

/** Just the fields the bidding rules actually read. */
type Biddable = Pick<Vehicle, 'current_bid' | 'starting_bid'>;

/**
 * The number a buyer thinks of as "the bid".
 *
 * current_bid is null on 112 of 200 vehicles — over half the inventory has no
 * bids yet, and for those the starting bid is what stands. This is the only
 * place that fallback should ever be written.
 */
export function displayBid(vehicle: Biddable): number {
  return vehicle.current_bid ?? vehicle.starting_bid;
}

/** Whether anyone has actually bid, as opposed to the lot merely being open. */
export function hasBids(vehicle: Biddable): boolean {
  return vehicle.current_bid !== null;
}

/** The smallest bid the app will accept next. */
export function minimumNextBid(vehicle: Biddable): number {
  return displayBid(vehicle) + BID_INCREMENT;
}

/** Whether a proposed amount clears the floor. */
export function isValidBid(vehicle: Biddable, amount: number): boolean {
  return Number.isFinite(amount) && amount >= minimumNextBid(vehicle);
}
