import type { BidService, BidServiceId } from '../types/bid';
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


/** Whether an amount lands on the increment rather than between two steps. */
export function isOnIncrement(amount: number): boolean {
  return Number.isInteger(amount) && amount % BID_INCREMENT === 0;
}

/**
 * Whether a proxy ceiling makes sense alongside the amount being bid.
 *
 * A max below the bid itself is the one combination that is not merely odd but
 * contradictory — it asks the auction to bid on your behalf up to less than you
 * just bid. Equal is fine: it means "this bid and no more", which is what
 * leaving the field blank also means, and there is no reason to reject someone
 * for saying it explicitly.
 */
export function isValidMaxBid(amount: number, maxAmount: number): boolean {
  return Number.isFinite(maxAmount) && maxAmount >= amount;
}

/* -------------------------------------------------------------------------- */
/* Buyer services                                                             */
/* -------------------------------------------------------------------------- */

/**
 * The fee schedule.
 *
 * These are derived from the lot rather than fetched, and that is a deliberate
 * limit rather than a shortcut: the dataset has no fee fields, so any number
 * here is invented either way. Inventing it as a pure function of data we do
 * have — the bid, the province — means two buyers looking at the same lot are
 * quoted the same thing, and the whole schedule is one file to point at when
 * someone asks where $145 came from. A real integration replaces these three
 * functions with a quote endpoint and nothing above them changes.
 *
 * `bidServices()` is the only export of the four: the catalogue is the
 * interface, the individual fees are how it is arrived at. Nothing outside this
 * file has needed a single fee on its own.
 */

/**
 * The as-described guarantee is banded by sale price, not a percentage. The
 * work behind it — re-inspecting a car and arbitrating the claim — costs about
 * the same on a $9,000 hatchback as a $40,000 truck, so a flat percentage would
 * overcharge the top of the inventory to subsidise the bottom.
 */
const GUARANTEE_BANDS: readonly { readonly upTo: number; readonly fee: number }[] = [
  { upTo: 10_000, fee: 95 },
  { upTo: 25_000, fee: 145 },
  { upTo: 50_000, fee: 225 },
  { upTo: Infinity, fee: 345 },
];

function guaranteeFee(vehicle: Biddable): number {
  const bid = displayBid(vehicle);
  return GUARANTEE_BANDS.find((band) => bid < band.upTo)!.fee;
}

/** The extension is priced off the base, so the two never drift apart. */
function extendedGuaranteeFee(vehicle: Biddable): number {
  return Math.round(guaranteeFee(vehicle) / 2 / 5) * 5;
}

/**
 * Transport, quoted by where the lot sits.
 *
 * Keyed on province rather than city: the dataset has 30-odd cities and no
 * coordinates, so a per-city rate would be 30 invented numbers pretending to be
 * a distance calculation. Seven zone rates are honest about being zones.
 */
const TRANSPORT_RATES: Readonly<Record<string, number>> = {
  Ontario: 690,
  Quebec: 790,
  Manitoba: 940,
  Saskatchewan: 1090,
  Alberta: 1240,
  'Nova Scotia': 1390,
  'British Columbia': 1450,
};

/** Used for a province the dataset does not cover today. */
const TRANSPORT_FALLBACK = 990;

function transportQuote(vehicle: Pick<Vehicle, 'province'>): number {
  return TRANSPORT_RATES[vehicle.province] ?? TRANSPORT_FALLBACK;
}

/** Every service on offer for one lot, priced. Order is the order shown. */
export function bidServices(
  vehicle: Biddable & Pick<Vehicle, 'province' | 'city'>,
): BidService[] {
  return [
    {
      id: 'as-described',
      label: 'As Described Guarantee',
      description:
        'Covers the condition report. If the vehicle arrives materially different from how it was described, the sale is arbitrated.',
      price: guaranteeFee(vehicle),
    },
    {
      id: 'extended-guarantee',
      label: 'Extended Guarantee',
      description:
        'Extends the arbitration window from 3 business days to 21, for undisclosed mechanical faults found after delivery.',
      price: extendedGuaranteeFee(vehicle),
      requires: 'as-described',
    },
    {
      id: 'transport',
      label: 'Transportation',
      description: `Door-to-door carrier from ${vehicle.city}, ${vehicle.province}. Quoted per zone; booked only if you win.`,
      price: transportQuote(vehicle),
    },
  ];
}

/** What the ticked services add to the bill. Unknown ids are ignored. */
export function servicesTotal(
  services: readonly BidService[],
  selected: readonly BidServiceId[],
): number {
  return services
    .filter((service) => selected.includes(service.id))
    .reduce((total, service) => total + service.price, 0);
}

/**
 * What the buyer owes if this bid wins: the bid plus whatever they attached.
 *
 * Not a landed cost — auction and registration fees are outside this prototype.
 * Labelled in the UI as what it is so nobody reads it as the final invoice.
 */
export function bidTotal(
  amount: number,
  services: readonly BidService[],
  selected: readonly BidServiceId[],
): number {
  return amount + servicesTotal(services, selected);
}
