import type { Vehicle } from '../types/vehicle';

/**
 * Inventory text matching. Pure — it takes an array and returns an array.
 *
 * The searchable fields are the ones a buyer actually types: the vehicle's
 * identity (year, make, model, trim), its lot, and its VIN. Colour and condition
 * text are deliberately excluded — matching "black" against a condition report
 * that happens to mention a black scuff produces results the buyer cannot
 * explain, and unexplainable results are worse than fewer results.
 */

/**
 * A VIN is 17 effectively random characters, so short tokens hit them by
 * accident: "cx5" matched a Ram 1500 whose VIN contains CX5, and to the buyer
 * that is indistinguishable from a broken search. Buyers who search by VIN
 * paste a full one or the tail of one, so requiring six characters costs them
 * nothing and removes the noise entirely.
 */
const VIN_MIN_TOKEN_LENGTH = 6;

/** Punctuation is stripped so "cx-5", "cx5", and "CX 5" are the same query. */
function compact(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

interface SearchIndex {
  /** Year, make, model, trim, lot — with punctuation removed. */
  identity: string;
  vin: string;
}

function index(vehicle: Vehicle): SearchIndex {
  return {
    identity: compact(
      `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim} ${vehicle.lot}`,
    ),
    vin: compact(vehicle.vin),
  };
}

/** Every token must match. "2025 mazda" narrows; it does not widen. */
export function matchesQuery(vehicle: Vehicle, tokens: string[]): boolean {
  const { identity, vin } = index(vehicle);

  return tokens.every(
    (token) =>
      identity.includes(token) ||
      (token.length >= VIN_MIN_TOKEN_LENGTH && vin.includes(token)),
  );
}

/** Tokens are compacted the same way the index is, so both sides agree. */
export function tokenize(query: string): string[] {
  return query
    .trim()
    .split(/\s+/)
    .map(compact)
    .filter(Boolean);
}

/**
 * An empty query returns everything, in the order the dataset ships.
 *
 * Always a new array, including that case. Every search then produces a result
 * set the caller can identify by reference — which is how the grid knows to
 * start again from the first batch — and the cached inventory array is never
 * handed out where something could sort or mutate it in place.
 */
export function filterVehicles(vehicles: Vehicle[], query: string): Vehicle[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return [...vehicles];
  }

  return vehicles.filter((vehicle) => matchesQuery(vehicle, tokens));
}

