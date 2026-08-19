import { Divider, SimpleGrid, Stack, Text } from '@mantine/core';

import { CopyText } from '../../../components/common/CopyText';
import { FieldLabel } from '../../../components/common/FieldLabel';
import { SpecList } from '../../../components/common/SpecList';
import { fontWeight } from '../../../styles/fonts';
import { layout } from '../../../styles/layouts';
import type { Vehicle } from '../../../types/vehicle';
import { isBiddingActive } from '../../../utils/bidding';
import { formatAuctionWeekdayTime } from '../../../utils/date';
import { formatOdometer } from '../../../utils/odometer';

interface VehicleFactsProps {
  vehicle: Vehicle;
}

/**
 * The at-a-glance column: what the vehicle is, where it is, when it sells, and
 * who is selling it.
 *
 * Deliberately not the full spec sheet — that lives in the accordion, where a
 * buyer goes when they have already decided the lot is worth reading about.
 * This column answers "is this the right vehicle" in one look.
 *
 * Condition grade and title status are not repeated here. Both sit in the
 * condition report's header, which is the one place a buyer looks for them.
 */
export function VehicleFacts({ vehicle }: VehicleFactsProps) {
  const live = isBiddingActive(vehicle);

  return (
    <Stack gap={layout.sectionGap}>
      <Stack gap={layout.tightGap}>
        <Text fz="h2" fw={fontWeight.bold} ff="monospace">
          {formatOdometer(vehicle.odometer_km)}
        </Text>
        <Text c="dimmed" fz="sm">
          {vehicle.city}, {vehicle.province}
        </Text>
      </Stack>

      <Divider />

      <SpecList
        items={[
          { label: 'Engine', value: vehicle.engine },
          { label: 'Drivetrain', value: vehicle.drivetrain },
          { label: 'Transmission', value: vehicle.transmission },
          { label: 'Fuel', value: vehicle.fuel_type },
        ]}
      />

      <Divider />

      <Stack gap={layout.tightGap}>
        <FieldLabel>Selling dealership</FieldLabel>
        <Text fz="sm">{vehicle.selling_dealership}</Text>
      </Stack>

      <SpecList
        items={[
          { label: 'Lot', value: vehicle.lot, mono: true },
          {
            label: 'VIN',
            value: <CopyText value={vehicle.vin} label="VIN" />,
            mono: true,
          },
        ]}
      />

      <Divider />

      {/* Last in the column, so it sits directly above the bid box — when the
          lot sells and what it costs are one thought, not two. The bid count
          belongs here rather than among the figures: it describes the auction,
          not the price. */}
      <SimpleGrid cols={{ base: 1, xs: 2 }} spacing={layout.sectionGap}>
        <Stack gap={layout.tightGap}>
          <FieldLabel>{live ? 'Bidding open since' : 'Bidding starts'}</FieldLabel>
          <Text fz="sm" fw={fontWeight.semibold}>
            {formatAuctionWeekdayTime(vehicle.auction_start)}
          </Text>
        </Stack>

        {/* Meaningless before the lot opens — same rule as the grid card. */}
        {live && (
          <Stack gap={layout.tightGap}>
            <FieldLabel>Bids</FieldLabel>
            <Text fz="sm" fw={fontWeight.semibold}>
              {vehicle.bid_count}
            </Text>
          </Stack>
        )}
      </SimpleGrid>
    </Stack>
  );
}





