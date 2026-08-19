import { http } from './http';
import type { BidReceipt, BidRequest, PaymentMethod } from '../types/bid';

/**
 * Bid submission and the accounts a bid can be charged against.
 *
 * Two endpoints, and the split between them is the point. Reads are cached and
 * shared; the write is neither, and it deliberately does not update anything it
 * has already handed out. The lot's current bid is not this module's to report
 * — see `subscribeToBidUpdates` at the bottom.
 *
 * The "server" is a dev-server middleware in `vite.config.ts`. It answers real
 * requests with real status codes, so `http` does its job here exactly as it
 * does against the inventory asset.
 */
const PAYMENT_METHODS_URL = '/api/payment-methods';
const BIDS_URL = '/api/bids';

/**
 * One shared request for the whole app, the same way the inventory is loaded.
 *
 * Saved cards do not change while a buyer is bidding, and the bid modal mounts
 * fresh on every lot — refetching the same three rows each time would be a
 * spinner in front of the payment field for no new information.
 *
 * A rejection clears the cache so reopening the modal retries.
 */
let paymentMethods: Promise<PaymentMethod[]> | null = null;

export function loadPaymentMethods(): Promise<PaymentMethod[]> {
  paymentMethods ??= http
    .get<PaymentMethod[]>(PAYMENT_METHODS_URL)
    .catch((error: unknown) => {
      paymentMethods = null;
      throw error;
    });

  return paymentMethods;
}

/**
 * Takes no AbortSignal, for the same reason `loadVehicles` does not: the
 * promise is shared, so one modal closing must not cancel the load for the next
 * one to open. `useAsync` discards the result instead.
 */

/** Drops the cache. Used by the payment field's retry action. */
export function invalidatePaymentMethods(): void {
  paymentMethods = null;
}

/**
 * Place a bid.
 *
 * A POST, and it stays a POST once the update channel below is live. Those are
 * two different things: this is the buyer asking the auction to take an amount,
 * and it needs a request/response pair — an acknowledgement, a receipt id, an
 * error the form can render next to the field that caused it. A push channel
 * has nowhere to put any of that. Submitting over the socket instead would turn
 * every validation failure into a message that arrives, if it arrives, with no
 * way to tie it back to the submit that caused it.
 *
 * Unlike the reads above this one takes a signal, because the request is not
 * shared: exactly one form is waiting on it, and if that form goes away the
 * request may as well go with it.
 */
export function placeBid(
  request: BidRequest,
  signal?: AbortSignal,
): Promise<BidReceipt> {
  return http.post<BidReceipt>(BIDS_URL, request, signal);
}

/**
 * Not built yet — the update channel, and the rest of Phase 4.
 *
 * `GET /api/bids/stream` as server-sent events, one `BidUpdate` per change to a
 * lot's bidding. It lands here rather than in the store so that the store keeps
 * its one job, holding state, and everything that talks to the outside world
 * stays in `services/`.
 *
 * The shape it will take:
 *
 *   export function subscribeToBidUpdates(
 *     onUpdate: (update: BidUpdate) => void,
 *   ): () => void
 *
 * A plain callback and an unsubscribe, because that is what a `BehaviorSubject`
 * in `store/bidStore.ts` wants to be fed by — the store owns the RxJS, the
 * service owns the EventSource, and neither needs to know about the other's.
 *
 * Note what this does *not* change: `placeBid` still returns a receipt and
 * still throws on rejection. The stream tells the app where the bidding stands;
 * the POST tells this buyer whether their own bid was taken. Collapsing the two
 * would leave a submitted form with nothing to wait on.
 */
