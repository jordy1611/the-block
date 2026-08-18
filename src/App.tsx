import { Alert, Badge, Box, Container, Group, Loader, Text, Title } from '@mantine/core';

import { useAsync } from './hooks/useAsync';
import { loadVehicles } from './services/vehicles';
import { displayBid, minimumNextBid } from './utils/bidding';
import { formatCurrency } from './utils/currency';
import { formatAuctionStart } from './utils/date';
import { formatOdometer } from './utils/odometer';

/**
 * Phase 1 harness. Proves the data layer end to end — loading, error, and
 * success states, plus every formatter. Phase 2 replaces the body with the
 * real inventory grid.
 */
export default function App() {
  const { data, loading, error } = useAsync(() => loadVehicles());

  return (
    <Box mih="100%">
      <Box
        component="header"
        py="md"
        style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
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
        {loading && (
          <Group gap="xs">
            <Loader size="sm" />
            <Text c="dimmed">Loading inventory…</Text>
          </Group>
        )}

        {error && (
          <Alert color="red" title="Could not load inventory">
            {error.message}
          </Alert>
        )}

        {data && (
          <Box>
            <Text fw={600} mb="md">
              {data.length} lots loaded
            </Text>
            {data.slice(0, 3).map((vehicle) => (
              <Box key={vehicle.id} mb="sm">
                <Text>
                  {vehicle.lot} · {vehicle.year} {vehicle.make} {vehicle.model}{' '}
                  {vehicle.trim}
                </Text>
                <Text c="dimmed" fz="sm">
                  {formatOdometer(vehicle.odometer_km)} ·{' '}
                  {vehicle.condition_grade} / 5 · {formatAuctionStart(vehicle.auction_start)}
                </Text>
                <Text fz="sm">
                  bid {formatCurrency(displayBid(vehicle))} · next{' '}
                  {formatCurrency(minimumNextBid(vehicle))}
                </Text>
              </Box>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
}
