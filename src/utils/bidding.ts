import type { Vehicle } from '../types/vehicle';
import { hasStarted } from './date';

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

/**
 * Whether the lot is open for bidding, as opposed to scheduled.
 *
 * Evaluated once per render, not on a ticker. A lot crossing its start time
 * while the page sits open is not worth a subscription in a prototype — the
 * next navigation or search picks it up.
 *
 * Distinct from `hasBids`: a lot can be open with nobody having bid yet, and
 * every lot in the shipped dataset is scheduled rather than live.
 */
export function isBiddingActive(
  vehicle: Pick<Vehicle, 'auction_start'>,
  now: Date = new Date(),
): boolean {
  return hasStarted(vehicle.auction_start, now);
}

export type ReserveStatus = 'none' | 'met' | 'not-met';

/**
 * Where the bidding stands against the seller's reserve.
 *
 * Deliberately returns a status and never the reserve figure. A reserve is the
 * seller's private floor — publishing it tells every buyer exactly what to bid
 * and nothing more. "Reserve met" is the part that changes a buyer's decision.
 *
 * `reserve_price` is null on 60 of 200 lots, which is a real state of its own:
 * no reserve at all, and the highest bid wins.
 */
export function reserveStatus(
  vehicle: Pick<Vehicle, 'current_bid' | 'starting_bid' | 'reserve_price'>,
): ReserveStatus {
  if (vehicle.reserve_price === null) return 'none';
  return displayBid(vehicle) >= vehicle.reserve_price ? 'met' : 'not-met';
}

/** Whether a proposed amount clears the floor. */
export function isValidBid(vehicle: Biddable, amount: number): boolean {
  return Number.isFinite(amount) && amount >= minimumNextBid(vehicle);
}


