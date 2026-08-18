import { useEffect, useState } from 'react';

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
}

interface Entry<T> extends AsyncState<T> {
  /** Which key this result belongs to. */
  key: string;
}

const PENDING = { data: undefined, loading: true, error: undefined } as const;

/**
 * Runs an async factory and exposes it as render state.
 *
 * `key` marks the boundary at which the work should re-run. Pass the id when
 * the request depends on one; leave it out when the source never changes.
 *
 * Two details worth knowing:
 *
 * 1. The stored entry carries the key it was produced for. When the key changes
 *    we report pending until the new result lands, rather than briefly showing
 *    the previous record's data. Doing it this way keeps all state transitions
 *    in the resolve handlers — no setState during render, none synchronously
 *    inside the effect.
 *
 * 2. Cleanup sets a `cancelled` flag rather than aborting the request. The
 *    inventory request is shared across the whole app, so aborting it on one
 *    unmount would cancel the load for every other consumer. Discarding the
 *    result is the correct scope for a component to act at.
 */
export function useAsync<T>(
  factory: () => Promise<T>,
  key: string = '',
): AsyncState<T> {
  const [entry, setEntry] = useState<Entry<T>>({ ...PENDING, key });

  useEffect(() => {
    let cancelled = false;

    factory().then(
      (data) => {
        if (!cancelled) {
          setEntry({ data, loading: false, error: undefined, key });
        }
      },
      (error: Error) => {
        if (!cancelled) {
          setEntry({ data: undefined, loading: false, error, key });
        }
      },
    );

    return () => {
      cancelled = true;
    };
    // factory is deliberately not a dependency: callers pass it inline, so it is
    // a new function every render and would re-run this effect forever.
    // `key` is the real re-run signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return entry.key === key ? entry : { ...PENDING };
}
