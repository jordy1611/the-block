import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Types only, and with the extension `tsconfig.node.json`'s nodenext
// resolution requires. The wire format is a contract between this file and the
// app, so it is worth sharing; nothing runtime is imported from `src` — see
// the note on the rules below.
import type { BidUpdate } from './src/types/bid.ts';
import type { Vehicle } from './src/types/vehicle.ts';

/**
 * The pretend backend.
 *
 * Inventory is a static asset, so a GET against it is already a real request.
 * A bid is not: `http.post` runs a real `fetch`, and the dev server answers a
 * POST to a static path with a 404. Rather than special-casing the service to
 * fake its own response — which would leave the one write path in the app as
 * the only one never exercising the HTTP layer — the dev server grows three
 * routes: the saved cards, the bid, and the feed the bid is broadcast on.
 *
 * The three rules the rival bidder needs are restated below rather than
 * imported from `src/utils/bidding.ts`. Sharing them was tried and is not
 * worth its cost: pulling runtime code from `src` into the config drags those
 * files into a second TypeScript project with different resolution rules, and
 * every module they touch after it. A real auction server would hold its own
 * copy of the increment anyway — that is what makes the client's validation
 * worth running. Types are still shared, because the wire format genuinely is
 * one contract rather than two.
 *
 * What *is* here is state, which it did not have before and cannot avoid
 * having now: a broadcast of where a lot stands has to be a fact somebody
 * holds. It is per-process and in memory — restart the dev server and every
 * lot is back to the dataset's figures.
 */

/** Saved cards. Server-side data, so the app has to fetch it to know it. */
const PAYMENT_METHODS = [
  {
    id: 'pm_visa_4242',
    label: 'Visa ending 4242',
    detail: 'Expires 09/2028',
    isDefault: true,
  },
  {
    id: 'pm_mc_8810',
    label: 'Mastercard ending 8810',
    detail: 'Expires 02/2027',
    isDefault: false,
  },
  {
    id: 'pm_float_dealer',
    label: 'Dealer floor plan',
    detail: 'Net 7 · approved to $250,000',
    isDefault: false,
  },
] as const;

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Length', Buffer.byteLength(payload));
  res.end(payload);
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('error', reject);
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (raw === '') {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Body was not valid JSON'));
      }
    });
  });
}

/** The fields a bid is rejected outright for missing. */
function describeInvalid(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return 'Expected a JSON object';

  const bid = body as Record<string, unknown>;

  if (typeof bid.vehicleId !== 'string' || bid.vehicleId === '') {
    return 'vehicleId is required';
  }
  if (typeof bid.amount !== 'number' || !Number.isFinite(bid.amount)) {
    return 'amount must be a number';
  }
  if (typeof bid.paymentMethodId !== 'string' || bid.paymentMethodId === '') {
    return 'paymentMethodId is required';
  }
  if (!PAYMENT_METHODS.some((method) => method.id === bid.paymentMethodId)) {
    return 'Unknown payment method';
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Where the lots stand                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The rules this file needs, in its own words. They mirror `BID_INCREMENT`,
 * `isBiddingActive` and `displayBid` in `src/utils/bidding.ts`; if one of those
 * changes, this changes with it.
 */
const BID_INCREMENT = 100;

function isOpen(vehicle: Vehicle): boolean {
  // Zoneless timestamps, parsed local, exactly as the client parses them.
  return new Date(vehicle.auction_start).getTime() <= Date.now();
}

function standingBid(vehicle: Vehicle): number {
  return vehicle.current_bid ?? vehicle.starting_bid;
}

/** The dataset, read once, as the starting point every lot is measured from. */
const DATASET = fileURLToPath(
  new URL('./public/data/vehicles.json', import.meta.url),
);

let inventory: Vehicle[] | null = null;

function dataset(): Vehicle[] {
  inventory ??= JSON.parse(readFileSync(DATASET, 'utf8')) as Vehicle[];
  return inventory;
}

/**
 * Only the lots that have moved since the server started.
 *
 * Sparse on purpose: an untouched lot is fully described by the dataset the
 * client already has, so holding a row for all 200 would be 200 copies of
 * something nobody needs to be told.
 */
const lots = new Map<string, Omit<BidUpdate, 'vehicleId'>>();

/** Everyone currently listening on the feed. */
const watchers = new Set<ServerResponse>();

function send(res: ServerResponse, update: BidUpdate): void {
  res.write(`data: ${JSON.stringify(update)}\n\n`);
}

function broadcast(update: BidUpdate): void {
  for (const watcher of watchers) send(watcher, update);
}

/**
 * Take a bid and report the lot's new standing, or null if it changes nothing.
 *
 * `byBuyer` is what becomes `highBidder` on the wire. In a real auction that is
 * per-recipient — every watcher gets their own answer to "are you still on
 * top". Here there is one buyer and every connection is theirs, so a bid either
 * came from the app (theirs) or from the rival ticker below (not).
 */
function applyBid(
  vehicleId: string,
  amount: number,
  byBuyer: boolean,
): BidUpdate | null {
  const current = lots.get(vehicleId);

  if (current === undefined) {
    const vehicle = dataset().find((candidate) => candidate.id === vehicleId);
    if (vehicle === undefined) return null;
    if (amount <= standingBid(vehicle)) return null;

    const seeded = {
      currentBid: amount,
      bidCount: vehicle.bid_count + 1,
      highBidder: byBuyer,
      at: new Date().toISOString(),
    };
    lots.set(vehicleId, seeded);
    return { vehicleId, ...seeded };
  }

  if (amount <= current.currentBid) return null;

  const next = {
    currentBid: amount,
    bidCount: current.bidCount + 1,
    highBidder: byBuyer,
    at: new Date().toISOString(),
  };
  lots.set(vehicleId, next);
  return { vehicleId, ...next };
}

/**
 * Rival traffic, so the feed has something to say that this buyer did not say
 * themselves.
 *
 * Without it `highBidder` would be true forever and the outbid state — the one
 * the whole two-channel split exists to deliver — would be unreachable without
 * opening a second browser. It only runs while someone is listening.
 *
 * Half the time it bids on a lot this buyer currently leads, because that is
 * the interesting case; otherwise it takes any open lane, so the grid moves on
 * its own the way a live sale does.
 */
const RIVAL_INTERVAL_MS = 11_000;
const HEARTBEAT_MS = 20_000;

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function rivalBid(): void {
  const held = [...lots.entries()]
    .filter(([, state]) => state.highBidder)
    .map(([vehicleId]) => vehicleId);

  const open = dataset().filter(isOpen);
  if (open.length === 0) return;

  const vehicleId =
    held.length > 0 && Math.random() < 0.5 ? pick(held) : pick(open).id;

  const vehicle = dataset().find((candidate) => candidate.id === vehicleId);
  if (vehicle === undefined) return;

  const standing = lots.get(vehicleId)?.currentBid ?? standingBid(vehicle);

  // One to three steps, always landing on the increment — the client would
  // refuse the same bid from the buyer.
  const amount = standing + BID_INCREMENT * (1 + Math.floor(Math.random() * 3));

  const update = applyBid(vehicleId, amount, false);
  if (update !== null) broadcast(update);
}

let ticker: ReturnType<typeof setInterval> | null = null;

function startTicker(): void {
  if (ticker !== null) return;
  ticker = setInterval(rivalBid, RIVAL_INTERVAL_MS);
  // No reason for invented auction traffic to hold the dev server open.
  ticker.unref();
}

function stopTicker(): void {
  if (ticker === null) return;
  clearInterval(ticker);
  ticker = null;
}

function openStream(req: IncomingMessage, res: ServerResponse): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    // Vite's dev server does not buffer, but a proxy in front of it might.
    'X-Accel-Buffering': 'no',
  });

  // EventSource reconnects on its own; this is how long it waits first.
  res.write('retry: 3000\n\n');

  /*
   * Catch-up. A client opening the app after the ticker has been running is
   * looking at a stale dataset, and the next frame it happens to receive would
   * correct one lot. Replaying everything that has moved costs one message per
   * changed lot and makes a late join indistinguishable from an early one.
   */
  for (const [vehicleId, state] of lots) send(res, { vehicleId, ...state });

  watchers.add(res);
  startTicker();

  // Idle SSE connections get dropped by intermediaries. A comment frame is the
  // conventional way to keep one warm, and the client ignores it.
  const heartbeat = setInterval(() => res.write(': ping\n\n'), HEARTBEAT_MS);
  heartbeat.unref();

  req.on('close', () => {
    clearInterval(heartbeat);
    watchers.delete(res);
    if (watchers.size === 0) stopTicker();
  });
}

function mockApi(): Plugin {
  const handle = async (
    req: IncomingMessage,
    res: ServerResponse,
    next: (error?: unknown) => void,
  ): Promise<void> => {
    const url = req.url?.split('?')[0] ?? '';
    if (!url.startsWith('/api/')) {
      next();
      return;
    }

    if (req.method === 'GET' && url === '/api/payment-methods') {
      json(res, 200, PAYMENT_METHODS);
      return;
    }

    if (req.method === 'GET' && url === '/api/bids/stream') {
      openStream(req, res);
      return;
    }

    if (req.method === 'POST' && url === '/api/bids') {
      let body: unknown;
      try {
        body = await readBody(req);
      } catch (error) {
        json(res, 400, { message: (error as Error).message });
        return;
      }

      const invalid = describeInvalid(body);
      if (invalid !== null) {
        json(res, 400, { message: invalid });
        return;
      }

      const bid = body as {
        vehicleId: string;
        amount: number;
        maxAmount: number | null;
      };

      /*
       * The receipt is `accepted` and nothing more. Whether this bid is still
       * the high one is not this response's job — that goes out on the feed,
       * which every open client sees rather than only the one that submitted.
       *
       * Note the order: the receipt is written first and the broadcast follows.
       * The buyer's own client therefore learns its bid was taken from the
       * POST, and learns where the lot now stands from the same frame everyone
       * else gets, rather than from a privileged copy in its own response.
       */
      json(res, 201, {
        bidId: `bid_${crypto.randomUUID()}`,
        vehicleId: bid.vehicleId,
        amount: bid.amount,
        maxAmount: bid.maxAmount ?? null,
        placedAt: new Date().toISOString(),
        status: 'accepted',
      });

      const update = applyBid(bid.vehicleId, bid.amount, true);
      if (update !== null) broadcast(update);
      return;
    }

    json(res, 404, { message: `No mock route for ${req.method} ${url}` });
  };

  return {
    name: 'the-block-mock-api',
    configureServer(server) {
      server.middlewares.use(handle);
    },
    // `npm run preview` serves the production build; the bid flow should still
    // work there, or the only way to demo it is the dev server.
    configurePreviewServer(server) {
      server.middlewares.use(handle);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mockApi()],
  server: {
    port: 8080,
    // Fail loudly if 8080 is taken rather than silently moving to 8081.
    // A predictable URL matters more here than a server that always starts.
    strictPort: true,
  },
  preview: {
    port: 8080,
    strictPort: true,
  },
})
