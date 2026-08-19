import type { ReactNode } from 'react';
import { Box, Center, Stack, Text, Title } from '@mantine/core';

import { layout } from '../../styles/layouts';

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  /** Optional recovery action — retry, clear search, go back. */
  action?: ReactNode;
}

/**
 * One component for every "there is nothing here" case: no search results, a
 * failed load, an unknown route. Domain-agnostic on purpose — it never mentions
 * a vehicle, which is what keeps it in `common/`.
 */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Center py={layout.emptyStatePaddingY} px="md">
      <Stack align="center" gap={layout.stackGap} maw={layout.proseMaxWidth}>
        <Title order={2} fz="h3" ta="center">
          {title}
        </Title>
        {description && (
          <Text c="dimmed" fz="sm" ta="center">
            {description}
          </Text>
        )}
        {action && <Box mt="sm">{action}</Box>}
      </Stack>
    </Center>
  );
}


