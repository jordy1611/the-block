import { Box, Card, Group, Skeleton, Stack } from '@mantine/core';

import { aspectRatio } from '../../../styles/constants';
import { fontSize } from '../../../styles/fonts';
import { layout, space } from '../../../styles/layouts';

/**
 * Mirrors VehicleCard's layout, not just its footprint. A skeleton whose blocks
 * sit where the real content will sit means the grid does not reflow when data
 * lands — the loading state and the loaded state are the same shape.
 *
 * Block heights are the type token of the line each one stands in for, so the
 * skeleton keeps matching the card when the type scale changes.
 */
export function VehicleCardSkeleton() {
  return (
    <Card padding={0} radius="md" withBorder>
      <Card.Section>
        <Box style={{ aspectRatio: aspectRatio.photo }}>
          <Skeleton height="100%" radius={0} />
        </Box>
      </Card.Section>

      <Stack gap={layout.stackGap} p={layout.cardPadding}>
        <Group justify="space-between">
          <Skeleton height={fontSize.label} width="28%" />
          <Skeleton height={fontSize.label} width="22%" />
        </Group>

        <Skeleton height={fontSize.body} width="72%" />
        <Skeleton height={fontSize.detail} width="48%" />
        <Skeleton height={fontSize.detail} width="60%" />

        <Group gap={layout.inlineGap} mt={layout.tightGap}>
          <Skeleton height={fontSize.amount} width="38%" radius="sm" />
          <Skeleton height={fontSize.amount} width="22%" radius="sm" />
        </Group>

        <Skeleton height={fontSize.amount} width="52%" mt={space.sm} />
      </Stack>
    </Card>
  );
}



