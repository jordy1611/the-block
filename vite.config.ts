import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * The pretend backend.
 *
 * Inventory is a static asset, so a GET against it is already a real request.
 * A bid is not: `http.post` runs a real `fetch`, and the dev server answers a
 * POST to a static path with a 404. Rather than special-casing the service to
 * fake its own response — which would leave the one write path in the app as
 * the only one never exercising the HTTP layer — the dev server grows two
 * routes.
 *
 * Everything here is stateless and deliberately dumb. Domain rules (the
 * increment, the minimum, the fees) live in `utils/bidding.ts`, client side,
 * where they can be read and tested. This only checks the shape of the body
 * and hands back a receipt.
 *
 * The rest of Phase 4 adds `GET /api/bids/stream` here as an SSE endpoint, which
 * is what the bid store will subscribe to. That is why bids POST to their own
 * route instead of being folded into the vehicles asset: the write and the push
 * are different channels against the same resource.
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
       * `accepted` and nothing more. Whether this bid is still the high one is
       * not knowable from a stateless POST and is not this response's job —
       * that arrives on the update channel, which every open client sees, not
       * only the one that happened to submit.
       */
      json(res, 201, {
        bidId: `bid_${crypto.randomUUID()}`,
        vehicleId: bid.vehicleId,
        amount: bid.amount,
        maxAmount: bid.maxAmount ?? null,
        placedAt: new Date().toISOString(),
        status: 'accepted',
      });
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
