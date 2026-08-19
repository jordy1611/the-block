import { http } from './http';
import type { Vehicle } from '../types/vehicle';
import { filterVehicles } from '../utils/search';

/**
 * Inventory access. There is no backend, so the "endpoint" is a static asset —
 * but it is fetched over the network like any other resource, never imported.
 * A static import would bundle 288KB of JSON into the JS and take the real
 * loading and error states with it.
 */
const INVENTORY_URL = '/data/vehicles.json';

/**
 * One shared request for the whole app.
 *
 * Caching the promise rather than the result means concurrent callers during
 * the initial load all await the same request instead of each firing their own.
 * Opening a detail page after the list has loaded resolves instantly from here.
 *
 * A failed request clears the cache so a retry actually retries, rather than
 * replaying the same rejection forever.
 */
let inventory: Promise<Vehicle[]> | null = null;

export function loadVehicles(): Promise<Vehicle[]> {
  inventory ??= http.get<Vehicle[]>(INVENTORY_URL).catch((error: unknown) => {
    inventory = null;
    throw error;
  });

  return inventory;
}

/**
 * Deliberately takes no AbortSignal.
 *
 * The request above is shared, so letting one component abort it would cancel
 * the load for every other subscriber too. Callers that unmount mid-flight
 * discard the result instead of aborting the request — that is what the
 * `cancelled` flag in useAsync does.
 */

/**
 * One lot by id. Resolves to undefined when the id matches nothing, which is a
 * real case — a bookmarked or hand-edited URL — and the caller renders
 * not-found rather than crashing.
 */
export async function loadVehicleById(
  id: string,
): Promise<Vehicle | undefined> {
  const vehicles = await loadVehicles();
  return vehicles.find((vehicle) => vehicle.id === id);
}

export interface VehicleSearchResult {
  vehicles: Vehicle[];
  /** Size of the unfiltered inventory, so the UI can say "42 of 200". */
  total: number;
}

/**
 * Search as an async operation, even though the filtering itself is synchronous
 * once the dataset is in memory.
 *
 * Keeping it behind a Promise is what makes the search pipeline honest: the
 * first keystrokes can land while the inventory request is still in flight, so
 * there really are concurrent, cancellable searches for `switchMap` to manage.
 * It also means moving search to a real endpoint later touches this function
 * and nothing else.
 */
export async function searchVehicles(query: string): Promise<VehicleSearchResult> {
  const vehicles = await loadVehicles();

  return { vehicles: filterVehicles(vehicles, query), total: vehicles.length };
}

/** Drops the cache. Used by the error state's retry action. */
export function invalidateInventory(): void {
  inventory = null;
}
