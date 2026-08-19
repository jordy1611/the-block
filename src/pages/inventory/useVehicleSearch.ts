import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BehaviorSubject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  from,
  map,
  of,
  switchMap,
} from 'rxjs';

import { invalidateInventory, searchVehicles } from '../../services/vehicles';
import type { Vehicle } from '../../types/vehicle';

/**
 * Long enough to swallow a fast typist's keystrokes, short enough that the grid
 * feels like it is responding to the keyboard rather than lagging behind it.
 */
const DEBOUNCE_MS = 200;

interface SearchState {
  vehicles: Vehicle[] | undefined;
  /** Unfiltered inventory size, for "42 of 200". */
  total: number;
  loading: boolean;
  error: Error | undefined;
}

const INITIAL: SearchState = {
  vehicles: undefined,
  total: 0,
  loading: true,
  error: undefined,
};

/**
 * Inventory search.
 *
 * This is the one place in the app where RxJS earns its keep. The pipeline is
 * three operators that would each be a piece of hand-written bookkeeping:
 *
 *   debounceTime          a timer ref, cleared on every keystroke and on unmount
 *   distinctUntilChanged  a "last query I actually ran" ref
 *   switchMap             a stale-response guard, so a slow early search cannot
 *                         land after a fast later one and show the wrong results
 *
 * The third one is not hypothetical: keystrokes during the initial 300ms load
 * produce genuinely concurrent searches. switchMap drops the superseded ones.
 *
 * The query is held in React state as well as pushed into the subject, so the
 * input stays immediate while the search behind it stays debounced.
 */
export function useVehicleSearch() {
  const queries = useMemo(() => new BehaviorSubject(''), []);
  const [query, setQueryState] = useState('');
  const [state, setState] = useState<SearchState>(INITIAL);
  // Bumping this tears down and rebuilds the pipeline. The BehaviorSubject
  // survives, so a retry re-runs the current query rather than resetting it.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const subscription = queries
      .pipe(
        debounceTime(DEBOUNCE_MS),
        distinctUntilChanged(),
        switchMap((value) =>
          from(searchVehicles(value)).pipe(
            map(
              ({ vehicles, total }): SearchState => ({
                vehicles,
                total,
                loading: false,
                error: undefined,
              }),
            ),
            catchError((error: Error) =>
              of<SearchState>({
                vehicles: undefined,
                total: 0,
                loading: false,
                error,
              }),
            ),
          ),
        ),
      )
      .subscribe(setState);

    return () => subscription.unsubscribe();
  }, [queries, attempt]);

  const setQuery = useCallback(
    (value: string) => {
      setQueryState(value);
      queries.next(value);
    },
    [queries],
  );

  // Typing never flips the state back to loading. After the first load the
  // dataset is in memory, so results return within a microtask — showing
  // skeletons for that would be a flash, not feedback.
  const retry = useCallback(() => {
    invalidateInventory();
    setState((current) => ({ ...current, loading: true, error: undefined }));
    setAttempt((value) => value + 1);
  }, []);

  return { query, setQuery, retry, ...state };
}
