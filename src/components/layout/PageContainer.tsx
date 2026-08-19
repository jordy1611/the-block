import type { ReactNode } from 'react';
import { Container, Stack, Text, Title } from '@mantine/core';

import { layout } from '../../styles/layouts';

interface PageContainerProps {
  /** Page heading. Rendered as the single h1 for the route. */
  title?: ReactNode;
  /** One line under the title — counts, context, status. */
  description?: ReactNode;
  children: ReactNode;
}

/**
 * Every route's outer frame. Owns the container width, the page padding, and
 * the title block, so no page hand-rolls its own — that is what keeps two pages
 * built a day apart looking like the same product.
 *
 * The width itself comes from the theme's Container default, not from here.
 */
export function PageContainer({ title, description, children }: PageContainerProps) {
  return (
    <Container py={layout.pagePaddingY}>
      <Stack gap={layout.sectionGap}>
        {title && (
          <Stack gap={layout.tightGap}>
            <Title order={1} fz="h2">
              {title}
            </Title>
            {description && (
              <Text c="dimmed" fz="sm">
                {description}
              </Text>
            )}
          </Stack>
        )}
        {children}
      </Stack>
    </Container>
  );
}
