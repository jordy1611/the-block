import { useMemo, useSyncExternalStore } from 'react';

import { getLot, subscribe } from '../store/bidStore';
import type { Vehicle } from '../types/vehicle';

/**
 * Where this buyer sits on a lot they have bid on. Undefined is the common
 * case: they have not bid, or nothing has come back about it yet.
 */
export type LotStanding = 'high' | 'outbid' | undefined;

export interface LiveLot<T extends Vehicle | undefined> {
  /** The lot, with anything the feed has said about it merged in. */
  vehicle: T;
  standing: LotStanding;
}

/**
 * The one place the authored dataset and the live feed are put together.
 *
 * Everything downstream keeps working unchanged because the merge produces a
 * `Vehicle` and nothing else: `displayBid`, `minimumNextBid`, `reserveStatus`
 * and `hasBids` all take the lot and are none the wiser about where its figure
 * came from. That is the point of overlaying the store on the record instead of
 * teaching each of those rules to consult a store — the rule that already
 * governs bids, *never read `current_bid` directly*, is what makes live updates
 * arrive everywhere at once.
 *
 * `bid_count` moves with `current_bid`, because they are one fact. A lot whose
 * figure has risen while the count sits at what the dataset said is a lot that
 * looks broken.
 *
 * Takes an optional vehicle so a caller still loading one can call it anyway —
 * `VehicleDetailModal` has no lot until its fetch lands, and hooks do not get
 * to be conditional.
 */
export function useLiveLot<T extends Vehicle | undefined>(vehicle: T): LiveLot<T> {
  // An id no lot has, for the loading case. The store is sparse, so a miss is
  // the same undefined a real id gets before anyone bids on it.
  const lot = useSyncExternalStore(subscribe, () => getLot(vehicle?.id ?? ''));

  return useMemo(() => {
    const live = lot?.live;

    /*
     * Standing needs both halves: the receipt says this buyer has a bid on the
     * lot, and only the broadcast can say whether it still leads. With a
     * receipt but no frame — the feed unavailable, or a moment before the
     * update lands — the honest answer is that we do not know yet, which is
     * what undefined means here.
     */
    const standing: LotStanding =
      lot?.mine === undefined || live === undefined
        ? undefined
        : live.highBidder
          ? 'high'
          : 'outbid';

    if (vehicle === undefined || live === undefined) return { vehicle, standing };

    // The cast is the generic's tax: spreading a T that extends Vehicle widens
    // it back to Vehicle. The fields written are the two the feed carries.
    return {
      vehicle: {
        ...vehicle,
        current_bid: live.currentBid,
        bid_count: live.bidCount,
      } as T,
      standing,
    };
  }, [vehicle, lot]);
}
