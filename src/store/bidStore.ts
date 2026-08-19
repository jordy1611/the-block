import { BehaviorSubject, skip } from 'rxjs';

import { subscribeToBidUpdates } from '../services/bidding';
import type { BidReceipt, BidUpdate, LotBidState } from '../types/bid';

/**
 * Where the bidding stands, for every lot the app has heard anything about.
 *
 * This is the only global state in the app, and it is deliberately an overlay
 * rather than a copy of the inventory. `services/vehicles.ts` already caches
 * the dataset for the whole session; mirroring 200 records in here would make
 * two things true at once about the same lot and leave the app to decide which
 * of them to believe. So the store holds exactly what the dataset cannot know
 * — what has changed since it was authored — keyed by vehicle id, and the two
 * are merged at the point of use by `useLiveLot`.
 *
 * The map is sparse. A lot nobody has bid on is not in it, which is most of
 * them, and `getLot` returning undefined for those is the normal case rather
 * than a miss.
 *
 * A `BehaviorSubject` because it is a current value plus a multicast of every
 * change to it, which is the whole shape of this problem, and because RxJS is
 * already a dependency earning its keep in the search pipeline. React consumes
 * it through `useSyncExternalStore` rather than an RxJS-flavoured hook — the
 * adapter below is four lines, and no component ends up importing rxjs.
 */
type Lots = ReadonlyMap<string, LotBidState>;

const lots = new BehaviorSubject<Lots>(new Map());

/**
 * Every write replaces the map and the one entry that changed, and touches no
 * other entry.
 *
 * That is what makes the grid cheap: all 200 cards read their own lot through
 * `useSyncExternalStore`, every one of them is notified of every frame, and
 * React bails out of re-rendering the 199 whose entry came back
 * `Object.is`-equal. Mutating an entry in place, or rebuilding all of them,
 * would re-render the entire grid on every rival bid.
 */
function write(vehicleId: string, entry: LotBidState): void {
  const next = new Map(lots.value);
  next.set(vehicleId, entry);
  lots.next(next);
}

/**
 * A pushed change to a lot, from the feed.
 *
 * Exported because the store's job is applying one of these, and the feed is
 * only its first caller — a socket, a poll, or a test driving the UI through a
 * known sequence all feed the same door.
 *
 * Note what it leaves alone: `mine`. A rival outbidding this buyer does not
 * unmake the bid they placed; it changes where that bid now stands, which is
 * `live.highBidder`.
 */
export function applyBidUpdate(update: BidUpdate): void {
  write(update.vehicleId, {
    live: update,
    mine: lots.value.get(update.vehicleId)?.mine,
  });
}

/**
 * This buyer's own accepted bid, from the POST's receipt.
 *
 * Kept beside the broadcast rather than folded into it, because a receipt is
 * not a statement about the lot — it is an acknowledgement that the auction
 * took an amount from this buyer. Letting it set `live.currentBid` would show
 * one buyer a figure nobody else has been told, which is the failure the whole
 * two-channel split exists to avoid. The lot's figure moves when the feed says
 * it moved, including for the bid that just went in.
 */
export function recordReceipt(receipt: BidReceipt): void {
  write(receipt.vehicleId, {
    live: lots.value.get(receipt.vehicleId)?.live,
    mine: receipt,
  });
}

/** What the store holds for one lot, or undefined if it holds nothing. */
export function getLot(vehicleId: string): LotBidState | undefined {
  return lots.value.get(vehicleId);
}

/**
 * Opened by the first subscriber and left open for the life of the page.
 *
 * Refcounting it down to zero would tear the feed down and rebuild it every
 * time the grid emptied between renders, and reconnecting costs a request and
 * a full catch-up replay. One connection per tab is the honest number.
 *
 * Connecting here rather than in `App.tsx` keeps the wiring where the state
 * is: nothing has to remember to mount a component for the store to work, and
 * a test that renders one card in isolation opens nothing, because jsdom has
 * no `EventSource` and the service hands back a no-op.
 */
let feed: (() => void) | null = null;

function connect(): void {
  feed ??= subscribeToBidUpdates(applyBidUpdate);
}

/**
 * The `useSyncExternalStore` half. `skip(1)` drops the BehaviorSubject's replay
 * of its current value: React has just read the snapshot itself, and an
 * immediate "something changed" on subscribe is a re-render saying nothing.
 */
export function subscribe(onChange: () => void): () => void {
  connect();

  const subscription = lots.pipe(skip(1)).subscribe(() => onChange());

  return () => subscription.unsubscribe();
}
