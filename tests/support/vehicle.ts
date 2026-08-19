import type { Vehicle } from '../../src/types/vehicle';

/**
 * `auction_start` in the dataset is a local timestamp with no zone, and
 * `isBiddingActive` compares it against `new Date()`. A fixture with a literal
 * date would therefore quietly change meaning as the calendar moves — a
 * "scheduled" lot becomes a live one and a passing test starts failing for a
 * reason that has nothing to do with the code.
 *
 * So the two states are expressed as offsets from now, in the same shape the
 * dataset uses: no "Z", no offset suffix.
 */
function localTimestamp(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  const pad = (value: number) => String(value).padStart(2, '0');

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  );
}

/** A lane that is already open. */
export const LIVE_AUCTION_START = localTimestamp(-2);

/** A lane that has not opened yet. */
export const SCHEDULED_AUCTION_START = localTimestamp(7);

/**
 * One lot, with every field filled and the nullable ones at their common value.
 *
 * Tests override only the fields they are about, so a card test reads as the
 * two or three facts it actually asserts on rather than fifty lines of Vehicle.
 */
export function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'veh_0001',
    vin: '1FTFW1E85MFA10001',

    year: 2023,
    make: 'Mazda',
    model: 'CX-5',
    trim: 'GT',
    body_style: 'SUV',

    exterior_color: 'Machine Grey',
    interior_color: 'Black',
    engine: '2.5L I4',
    transmission: 'automatic',
    drivetrain: 'AWD',
    odometer_km: 47_731,
    fuel_type: 'gasoline',

    condition_grade: 4.2,
    condition_report: 'Well maintained, minor cosmetic wear.',
    damage_notes: [],
    title_status: 'clean',

    province: 'Ontario',
    city: 'Mississauga',

    auction_start: SCHEDULED_AUCTION_START,

    starting_bid: 14_500,
    reserve_price: null,
    buy_now_price: null,

    images: ['https://example.test/cx5-1.jpg', 'https://example.test/cx5-2.jpg'],
    selling_dealership: 'Lakeshore Auto Group',
    lot: 'A-0043',

    current_bid: null,
    bid_count: 0,

    ...overrides,
  };
}
