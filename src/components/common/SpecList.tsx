import type { ReactNode } from 'react';
import { SimpleGrid, Stack, Text } from '@mantine/core';

import { layout } from '../../styles/layouts';
import { FieldLabel } from './FieldLabel';

export interface Spec {
  label: string;
  value: ReactNode;
  /** Identifiers and readings that get compared down a column. */
  mono?: boolean;
}

interface SpecListProps {
  items: Spec[];
  /** Columns at the widest breakpoint. Always one on a phone. */
  columns?: number;
}

/**
 * Label-above-value pairs. Domain-agnostic — it never mentions a vehicle, which
 * is what keeps it in `common/`.
 *
 * Label above rather than beside: values here vary wildly in length ("FWD"
 * against "2.0L Turbo I4"), and a two-column label/value table leaves either
 * huge gaps or wrapped values. Stacked pairs stay aligned whatever the content.
 */
export function SpecList({ items, columns = 2 }: SpecListProps) {
  return (
    <SimpleGrid cols={{ base: 1, xs: 2, md: columns }} spacing={layout.sectionGap}>
      {items.map((item) => (
        <Stack key={item.label} gap={layout.tightGap}>
          <FieldLabel>{item.label}</FieldLabel>
          <Text fz="sm" ff={item.mono ? 'monospace' : undefined}>
            {item.value}
          </Text>
        </Stack>
      ))}
    </SimpleGrid>
  );
}


