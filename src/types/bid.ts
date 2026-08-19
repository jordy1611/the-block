/**
 * Bid flow types.
 *
 * Declarations only, like everything else in this folder. The rules that act on
 * these shapes are in `utils/bidding.ts`; the transport is `services/bidding.ts`.
 */

/**
 * The optional services a buyer can attach to a bid.
 *
 * A closed union rather than free strings: the checkbox list, the fee schedule,
 * and the POST body all key off these, and a typo in any one of them should not
 * compile.
 */
export type BidServiceId = 'as-described' | 'extended-guarantee' | 'transport';

export interface BidService {
  id: BidServiceId;
  label: string;
  /** One line on what the buyer is actually paying for. Shown on the tooltip. */
  description: string;
  price: number;
  /**
   * Set when this service is an add-on to another. The UI indents it under its
   * parent and cannot select it on its own.
   */
  requires?: BidServiceId;
}

/** A card or account already on file. Never carries a full number. */
export interface PaymentMethod {
  id: string;
  /** "Visa ending 4242" — the last four is all a buyer needs to pick. */
  label: string;
  detail: string;
  isDefault: boolean;
}

/** The POST body. */
export interface BidRequest {
  vehicleId: string;
  amount: number;
  /** Proxy ceiling. null when the buyer is bidding a single amount. */
  maxAmount: number | null;
  notes: string;
  services: BidServiceId[];
  paymentMethodId: string;
}

/**
 * What the POST hands back.
 *
 * An acknowledgement, not a bid state: `accepted` means the auction took the
 * bid, not that it is winning. Whether it still stands arrives on the update
 * channel below — that is a broadcast to every watcher of the lot, and reading
 * it out of one buyer's POST response would give them a different answer to
 * everyone else's.
 */
export interface BidReceipt {
  bidId: string;
  vehicleId: string;
  amount: number;
  maxAmount: number | null;
  /** ISO 8601, UTC. Server-stamped, unlike `auction_start`. */
  placedAt: string;
  status: 'accepted';
}

/**
 * One pushed change to a lot's bidding — the shape the feed delivers.
 *
 * This, not the POST response, is where the app learns what a lot is at.
 * `GET /api/bids/stream` emits one of these per change, to every client
 * watching; `services/bidding.ts` receives them and `store/bidStore.ts` holds
 * them. It is deliberately the whole standing of the lot rather than a delta,
 * so a client that connects late or misses a frame is corrected by the next
 * one it does see.
 */
export interface BidUpdate {
  vehicleId: string;
  currentBid: number;
  bidCount: number;
  /** Whether the receiving buyer still holds the high bid on this lot. */
  highBidder: boolean;
  at: string;
}

/**
 * What the store holds for one lot — two facts, from two different places.
 *
 * They are kept apart rather than flattened because they are not equally
 * public. `live` is the broadcast every watcher of the lot receives, and it is
 * the only thing allowed to move the figure on the page. `mine` is this
 * buyer's own accepted bid, which nobody else can see and which says nothing
 * about whether it still stands — collapsing the two would let a receipt
 * quietly become the current bid, which is exactly what `BidReceipt.status`
 * being `accepted` and never "winning" exists to prevent.
 *
 * Both are optional: a lot the feed has not mentioned and this buyer has not
 * bid on has no entry in the store at all.
 */
export interface LotBidState {
  /** Where the lot stands, per the feed. */
  live: BidUpdate | undefined;
  /** The last bid this buyer had accepted on the lot. */
  mine: BidReceipt | undefined;
}
