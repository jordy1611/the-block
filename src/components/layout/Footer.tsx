import { Box, Container, Divider, Text } from '@mantine/core';

import { layout, space } from '../../styles/layouts';

/**
 * Page-end credit. No background of its own — the rule is the only separation
 * it needs, and it is drawn in the same dimmed colour as the text so the two
 * read as one quiet block rather than a bordered section.
 */
export function Footer() {
  return (
    <Box component="footer" pb={layout.pagePaddingY}>
      <Container>
        <Divider color="var(--app-text-secondary)" mb={space.sm} />
        <Text c="dimmed" fz="xs" ta="center">
          Openlane coding challenge created by Jordan Shryock and Claude with love.
        </Text>
      </Container>
    </Box>
  );
}

