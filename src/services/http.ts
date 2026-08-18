/**
 * The single seam between this app and the outside world.
 *
 * There is no backend. The only live endpoint is the static dataset, but the
 * shape here is the shape a real API client would have — swapping the base URL
 * is the whole migration.
 */

/** Artificial latency, in one place, so loading states are real and visible. */
const LATENCY_MS = 300;

export class HttpError extends Error {
  status: number;
  url: string;

  constructor(status: number, url: string, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.url = url;
  }
}

/**
 * Failure simulation is explicit and never random. A mock that fails on a
 * percentage will eventually fail during someone else's demo, and they will not
 * know it was deliberate.
 *
 * Trigger it with ?simulateError in the URL, or toggle it at runtime.
 */
let simulateFailure =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('simulateError');

export function setSimulatedFailure(on: boolean): void {
  simulateFailure = on;
}

export function isSimulatingFailure(): boolean {
  return simulateFailure;
}

/** A sleep that respects cancellation, so latency does not outlive the caller. */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }

    const timer = setTimeout(resolve, ms);

    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  body?: unknown;
  signal?: AbortSignal;
}

async function request<T>(
  method: Method,
  url: string,
  { body, signal }: RequestOptions = {},
): Promise<T> {
  await sleep(LATENCY_MS, signal);

  if (simulateFailure) {
    throw new HttpError(503, url, `Simulated failure for ${method} ${url}`);
  }

  const hasBody = body !== undefined;

  const response = await fetch(url, {
    method,
    headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
    body: hasBody ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!response.ok) {
    throw new HttpError(
      response.status,
      url,
      `${method} ${url} failed with ${response.status}`,
    );
  }

  // 204 No Content has no body to parse.
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const http = {
  get: <T>(url: string, signal?: AbortSignal): Promise<T> =>
    request<T>('GET', url, { signal }),

  post: <T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> =>
    request<T>('POST', url, { body, signal }),

  put: <T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> =>
    request<T>('PUT', url, { body, signal }),

  patch: <T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> =>
    request<T>('PATCH', url, { body, signal }),

  delete: <T>(url: string, signal?: AbortSignal): Promise<T> =>
    request<T>('DELETE', url, { signal }),
};
