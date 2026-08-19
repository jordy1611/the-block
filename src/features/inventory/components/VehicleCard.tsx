import { Box, Card, Divider, Group, Stack, Text } from '@mantine/core';
import { Link } from 'react-router';

import { fontWeight, lineHeight } from '../../../styles/fonts';
import { iconSize, layout, radius, space } from '../../../styles/layouts';
import { FieldLabel } from '../../../components/common/FieldLabel';
import { Money } from '../../../components/common/Money';
import { ConditionGrade } from '../../../components/common/ConditionGrade';
import type { Vehicle } from '../../../types/vehicle';
import { displayBid, hasBids, isBiddingActive } from '../../../utils/bidding';
import { formatAuctionDayTime } from '../../../utils/date';
import { formatOdometer } from '../../../utils/odometer';
import { VehiclePhotos } from './VehiclePhotos';
import classes from './VehicleCard.module.css';

interface VehicleCardProps {
  vehicle: Vehicle;
}

/**
 * Drawn inline rather than pulled from an icon package — the app has three
 * icons total, and none of them justify a dependency.
 */
function HeartIcon() {
  return (
    <Box
      component="svg"
      width={iconSize.md}
      height={iconSize.md}
      viewBox="0 0 24 24"
      aria-hidden
      style={{ display: 'block' }}
    >
      <path
        d="M12 20.3 4.6 13a4.6 4.6 0 0 1 0-6.5 4.6 4.6 0 0 1 6.5 0l.9.9.9-.9a4.6 4.6 0 0 1 6.5 0 4.6 4.6 0 0 1 0 6.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Box>
  );
}

/** Label above figure. Used for the bid and, when there is one, the buyout. */
function Amount({ label, value }: { label: string; value: number }) {
  return (
    <Stack gap={0}>
      <FieldLabel>{label}</FieldLabel>
      <Money value={value} fz="xl" fw={fontWeight.bold} />
    </Stack>
  );
}

function bidCountLabel(vehicle: Vehicle): string {
  if (!hasBids(vehicle)) return 'No bids yet';
  return vehicle.bid_count === 1 ? '1 bid' : `${vehicle.bid_count} bids`;
}

/**
 * One lot in the grid.
 *
 * The whole card is the link. A "View details" button inside a card is a second
 * target for the same destination, and on a phone it is the smaller of the two.
 *
 * The bid label switches between "Current bid" and "Starting bid" on whether
 * the lane is open, not on whether anyone has bid. Once a lot is live the
 * starting bid *is* the current bid — it is the number a buyer has to beat.
 * Before it opens there is no current bid to speak of. How contested a lot
 * actually is rides on the bid count beside it, which is the honest place for
 * it: "Current bid / No bids yet" says both things without either lying.
 */
export function VehicleCard({ vehicle }: VehicleCardProps) {
  const biddingActive = isBiddingActive(vehicle);

  return (
    <Card
      pos="relative"
      padding={0}
      radius="md"
      withBorder
      className={[classes.card, biddingActive && classes.live]
        .filter(Boolean)
        .join(' ')}
    >
      <Card.Section pos="relative">
        <VehiclePhotos
          images={vehicle.images}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
        />

        {/* On the photo rather than under it: the grade is the first thing a
            buyer filters on, and this is the only spot on the card that is
            already being looked at. */}
        <Box
          pos="absolute"
          top={layout.overlayInset}
          left={layout.overlayInset}
          bg="var(--app-overlay-surface)"
          px={layout.chipPaddingX}
          py={layout.chipPaddingY}
          style={{ borderRadius: radius.sm, display: 'flex' }}
        >
          {/* One step down from the component's default: on the photo it is a
              glance cue, not a figure to read. The flex box and tighter leading
              are what keep this chip the same height as the one below it —
              inline text would otherwise inherit the 1.55 body line-height. */}
          <ConditionGrade
            grade={vehicle.condition_grade}
            showScale={false}
            fz="xs"
            lh={lineHeight.heading}
          />
        </Box>

        {/* Presentational for now — there is no watchlist behind it yet. */}
        <Box
          pos="absolute"
          top={layout.overlayInset}
          right={layout.overlayInset}
          c="var(--app-overlay-text-muted)"
          bg="var(--app-overlay-surface)"
          p={layout.chipPaddingY}
          style={{ borderRadius: radius.pill, display: 'flex' }}
        >
          <HeartIcon />
        </Box>

        <Box
          pos="absolute"
          bottom={layout.overlayInset}
          left={layout.overlayInset}
          bg="var(--app-overlay-surface)"
          px={layout.chipPaddingX}
          py={layout.chipPaddingY}
          style={{ borderRadius: radius.sm }}
        >
          <Text
            fz="xs"
            fw={fontWeight.semibold}
            c="var(--app-overlay-text)"
            lh={lineHeight.heading}
          >
            {biddingActive ? 'Started' : 'Starts'}{' '}
            {formatAuctionDayTime(vehicle.auction_start)}
          </Text>
        </Box>
      </Card.Section>

      <Stack gap={layout.stackGap} p={layout.cardPadding}>
        <div>
          {/* The link is here, not around the card. Its ::after covers the
              whole card, so the card stays clickable while the photo arrows
              remain real buttons rather than buttons nested inside an anchor. */}
          <Text
            component={Link}
            to={`/vehicle/${vehicle.id}`}
            className={classes.stretchedLink}
            fz="lg"
            fw={fontWeight.semibold}
            lh={lineHeight.heading}
            lineClamp={1}
          >
            {vehicle.year} {vehicle.make} {vehicle.model}
          </Text>
          <Text fz="sm" c="dimmed" lineClamp={1}>
            {vehicle.engine} · {vehicle.drivetrain}
          </Text>
        </div>

        <Group gap={layout.microGap} wrap="nowrap">
          <Text fz="sm" ff="monospace">
            {formatOdometer(vehicle.odometer_km)}
          </Text>
          <Text fz="sm" c="dimmed">
            ·
          </Text>
          <Text fz="sm" c="dimmed" lineClamp={1}>
            {vehicle.city}, {vehicle.province}
          </Text>
        </Group>

        <Divider />

        <Group
          justify="space-between"
          align="flex-end"
          wrap="nowrap"
          gap={layout.stackGap}
        >
          <Group gap={space.md} align="flex-end" wrap="nowrap">
            {/* Only a live lot has a *current* bid. Before it opens, the figure
                is what bidding will start at, whatever the dataset carries. */}
            <Amount
              label={biddingActive ? 'Current bid' : 'Starting bid'}
              value={displayBid(vehicle)}
            />
            {/* Present on 39 of 200 lots — conditional, never "$null". */}
            {vehicle.buy_now_price !== null && (
              <Amount label="Buyout" value={vehicle.buy_now_price} />
            )}
          </Group>
          {biddingActive && (
            <Text fz="xs" c="dimmed">
              {bidCountLabel(vehicle)}
            </Text>
          )}
        </Group>
      </Stack>
    </Card>
  );
}












