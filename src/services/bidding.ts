import { http } from './http';
import type {
  BidReceipt,
  BidRequest,
  BidUpdate,
  PaymentMethod,
} from '../types/bid';

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
 * A POST, and it stays a POST now that the update channel below is live. Those are
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

/* -------------------------------------------------------------------------- */
/* The update channel                                                         */
/* -------------------------------------------------------------------------- */

const BID_STREAM_URL = '/api/bids/stream';

/**
 * Where the app learns what a lot is actually at.
 *
 * Server-sent events rather than a socket: every frame travels one way, from
 * the auction to the buyer. Nothing the app has to say goes up this channel —
 * a bid is `placeBid` above, and it stays a request with a response, because a
 * rejection has to come back attached to the submit that caused it. A socket
 * would buy a second direction neither side uses and cost a protocol upgrade,
 * a reconnect loop, and a heartbeat to write by hand.
 *
 * A callback and an unsubscribe, deliberately — not an Observable. The store
 * owns the RxJS; this owns the EventSource, and neither needs to know what the
 * other is made of. Swapping SSE for a socket, or for polling, is a change to
 * this function alone.
 *
 * It does not go through `http.ts`: there is no request/response pair to add
 * latency to or to fail, `EventSource` is not `fetch`, and a stream that opens
 * once and lives for the session has nothing the client's abort handling
 * applies to. Reconnection is the browser's job and it does it on its own.
 *
 * Absent `EventSource` — jsdom, an old browser — this is a no-op subscription
 * and the app renders the dataset's figures, which is the same thing it shows
 * before the first frame arrives.
 */
export function subscribeToBidUpdates(
  onUpdate: (update: BidUpdate) => void,
): () => void {
  if (typeof EventSource === 'undefined') return () => {};

  const source = new EventSource(BID_STREAM_URL);

  source.onmessage = (event: MessageEvent<string>) => {
    try {
      onUpdate(JSON.parse(event.data) as BidUpdate);
    } catch {
      // A frame we cannot parse is one lot's figure missed, and the next frame
      // for that lot carries its whole standing again. Tearing the feed down
      // over it would cost every other lot as well.
    }
  };

  return () => source.close();
}
