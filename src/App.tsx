import { Badge, Box, Container, Group, Text, Title } from '@mantine/core';

/**
 * Phase 0 shell. Confirms the Mantine provider and theme are wired.
 * Phase 2 replaces the body with the inventory grid and adds routing.
 */
export default function App() {
  return (
    <Box mih="100%">
      <Box
        component="header"
        py="md"
        style={{
          borderBottom: '1px solid var(--mantine-color-default-border)',
        }}
      >
        <Container size="lg">
          <Group justify="space-between" align="center">
            <Group gap="xs" align="baseline">
              <Title order={1} fz="h3">
                The Block
              </Title>
              <Text c="dimmed" fz="sm">
                Buyer inventory
              </Text>
            </Group>
            <Badge color="signal" variant="light">
              Prototype
            </Badge>
          </Group>
        </Container>
      </Box>

      <Container size="lg" py="xl">
        <Text c="dimmed">
          Scaffold is live. Inventory lands in Phase 2.
        </Text>
      </Container>
    </Box>
  );
}
