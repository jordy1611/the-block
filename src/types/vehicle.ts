/**
 * Shape of one lot in the auction inventory, mirroring public/data/vehicles.json.
 *
 * Nullability here is not defensive — it is what the dataset actually contains:
 *   current_bid      null on 112 of 200 (no bids placed yet)
 *   reserve_price    null on  60 of 200 (no reserve set)
 *   buy_now_price    null on 161 of 200 (not offered)
 *
 * Read bids through displayBid() in utils/bidding.ts rather than touching
 * current_bid directly.
 */
export interface Vehicle {
  id: string;
  vin: string;

  year: number;
  make: string;
  model: string;
  trim: string;
  body_style: BodyStyle;

  exterior_color: string;
  interior_color: string;
  engine: string;
  transmission: Transmission;
  drivetrain: Drivetrain;
  odometer_km: number;
  fuel_type: FuelType;

  /** 5-point scale, 1.2 to 5.0 in the dataset. Render as "3.8 / 5". */
  condition_grade: number;
  condition_report: string;
  /** Can be empty — render "No damage reported" rather than an empty list. */
  damage_notes: string[];
  title_status: TitleStatus;

  province: string;
  city: string;

  /**
   * Local time, no timezone suffix (e.g. "2026-08-19T09:00:00").
   * `new Date()` parses it in the viewer's zone, which is what we want.
   * Never append "Z".
   */
  auction_start: string;

  starting_bid: number;
  reserve_price: number | null;
  buy_now_price: number | null;

  images: string[];
  selling_dealership: string;
  /** Lane and position, e.g. "A-0043". */
  lot: string;

  /** null until someone bids. Use displayBid(), never this directly. */
  current_bid: number | null;
  bid_count: number;
}

export type BodyStyle = 'SUV' | 'hatchback' | 'truck' | 'sedan' | 'coupe';

export type TitleStatus = 'clean' | 'salvage' | 'rebuilt';

export type FuelType = 'gasoline' | 'hybrid' | 'electric' | 'diesel';

export type Transmission = 'automatic' | 'manual' | 'CVT' | 'single-speed';

export type Drivetrain = 'FWD' | 'AWD' | '4WD' | 'RWD';
