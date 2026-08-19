import { useCallback, useState } from 'react';
import { Button, SimpleGrid, Stack } from '@mantine/core';
import { Outlet } from 'react-router';

import { layout } from '../../styles/layouts';
import { EmptyState } from '../../components/common/EmptyState';
import { PageContainer } from '../../components/layout/PageContainer';
import type { Vehicle } from '../../types/vehicle';
import { LoadMoreTrigger } from './components/LoadMoreTrigger';
import { SearchBar } from './components/SearchBar';
import { VehicleCard } from './components/VehicleCard';
import { VehicleCardSkeleton } from './components/VehicleCardSkeleton';
import { useVehicleSearch } from './useVehicleSearch';

/** Enough to fill the first screen at every breakpoint, and no more. */
const SKELETON_COUNT = 8;

/**
 * Cards rendered per batch.
 *
 * Mounting all 200 at once costs a 235ms long task — long enough that clearing
 * the search visibly freezes the input. 24 fills six rows on the widest
 * breakpoint, and the next batch is requested 800px before the user reaches the
 * bottom, so the grid behaves like the whole list is already there.
 */
const PAGE_SIZE = 24;

/** Same column steps for skeletons and cards, so nothing reflows on load. */
const COLUMNS = { base: 1, xs: 2, md: 3, lg: 4 };

function countLabel(shown: number, total: number, filtered: boolean): string {
  const noun = total === 1 ? 'vehicle' : 'vehicles';
  return filtered ? `${shown} of ${total} ${noun}` : `${total} ${noun}`;
}

export function InventoryPage() {
  const { query, setQuery, retry, vehicles, total, loading, error } =
    useVehicleSearch();

  /**
   * How much of the current result set is rendered. The batch carries the array
   * it counts against — the same trick `useAsync` uses with its key — so a new
   * result set is back at one batch without an effect to reset it, and without
   * rendering the old count against the new list first.
   */
  const [batch, setBatch] = useState<{ of: Vehicle[] | undefined; count: number }>(
    { of: undefined, count: PAGE_SIZE },
  );

  const shown = batch.of === vehicles ? batch.count : PAGE_SIZE;

  const showMore = useCallback(
    () => setBatch({ of: vehicles, count: shown + PAGE_SIZE }),
    [vehicles, shown],
  );

  const visible = vehicles?.slice(0, shown);
  const hasMore = vehicles !== undefined && shown < vehicles.length;

  const description = loading
    ? 'Loading inventory…'
    : error
      ? 'Inventory unavailable'
      : countLabel(vehicles?.length ?? 0, total, query.trim().length > 0);

  return (
    <PageContainer title="Inventory" description={description}>
      <Stack gap={layout.sectionGap}>
        <SearchBar value={query} onChange={setQuery} />

        {error && (
          <EmptyState
            title="Could not load inventory"
            description={error.message}
            action={<Button onClick={retry}>Try again</Button>}
          />
        )}

        {loading && (
          <SimpleGrid cols={COLUMNS} spacing={layout.gridGutter}>
            {Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <VehicleCardSkeleton key={index} />
            ))}
          </SimpleGrid>
        )}

        {vehicles && vehicles.length === 0 && (
          <EmptyState
            title="No matching vehicles"
            description={`Nothing in the inventory matches “${query.trim()}”.`}
            action={
              <Button variant="default" onClick={() => setQuery('')}>
                Clear search
              </Button>
            }
          />
        )}

        {visible && visible.length > 0 && (
          <SimpleGrid cols={COLUMNS} spacing={layout.gridGutter}>
            {visible.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </SimpleGrid>
        )}

        {hasMore && <LoadMoreTrigger cursor={shown} onReach={showMore} />}
      </Stack>

      {/* The vehicle detail modal renders here when /vehicle/:id matches. */}
      <Outlet />
    </PageContainer>
  );
}



