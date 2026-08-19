import { Button, Group, Paper, Stack, Text } from '@mantine/core';

import { FieldLabel } from '../../../components/common/FieldLabel';
import { Money } from '../../../components/common/Money';
import { fontWeight } from '../../../styles/fonts';
import { layout, space } from '../../../styles/layouts';
import type { Vehicle } from '../../../types/vehicle';
import {
  displayBid,
  hasBids,
  isBiddingActive,
  reserveStatus,
} from '../../../utils/bidding';
import { formatAuctionWeekdayTime } from '../../../utils/date';

const RESERVE_LABEL = {
  none: 'None',
  met: 'Met',
  'not-met': 'Not met',
} as const;

const RESERVE_COLOR = {
  none: undefined,
  met: 'var(--app-status-positive)',
  'not-met': 'var(--app-status-caution)',
} as const;

interface BidBarProps {
  vehicle: Vehicle;
  onPlaceBid: () => void;
}

/**
 * The money, closing out the facts column.
 *
 * Everything a buyer needs to decide whether to bid, in the order they ask it:
 * what it is at, how contested it is, whether they can skip the auction, and
 * whether the seller will actually let it go — then the action itself.
 *
 * The figures wrap rather than sitting on one line, because this column is
 * narrow; the button spans the full width so the action is unmissable at the
 * end of the read.
 *
 * The reserve is shown as a status and never as a figure — see `reserveStatus`.
 */
export function BidBar({ vehicle, onPlaceBid }: BidBarProps) {
  const live = isBiddingActive(vehicle);
  const reserve = reserveStatus(vehicle);

  return (
    <Paper withBorder radius="md" p={layout.cardPadding} bg="var(--app-surface)">
      <Stack gap={layout.sectionGap}>
        {/* Spread across the full width so the reserve sits hard right, each
            field centred over its own value. The bid is the only headline —
            buyout and reserve share a smaller size beneath it. */}
        <Group justify="space-between" align="flex-start" wrap="wrap" gap={space.lg}>
          <Stack gap={layout.tightGap} ta="center">
            <FieldLabel>
              {live && hasBids(vehicle) ? 'Current bid' : 'Starting bid'}
            </FieldLabel>
            <Money value={displayBid(vehicle)} fz="h2" fw={fontWeight.bold} />
          </Stack>

          {vehicle.buy_now_price !== null && (
            <Stack gap={layout.tightGap} ta="center">
              <FieldLabel>Buyout</FieldLabel>
              <Money
                value={vehicle.buy_now_price}
                fz="lg"
                fw={fontWeight.semibold}
              />
            </Stack>
          )}

          <Stack gap={layout.tightGap} ta="center">
            <FieldLabel>Reserve</FieldLabel>
            <Text fz="lg" fw={fontWeight.semibold} c={RESERVE_COLOR[reserve]}>
              {RESERVE_LABEL[reserve]}
            </Text>
          </Stack>
        </Group>

        <Stack gap={layout.tightGap}>
          <Button size="md" fullWidth onClick={onPlaceBid} disabled={!live}>
            Place bid
          </Button>
          {!live && (
            <Text fz="xs" c="dimmed" ta="center">
              Opens {formatAuctionWeekdayTime(vehicle.auction_start)}
            </Text>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}





