import { useState } from 'react';
import { Alert, Button, Group, Loader, Modal, Text, Title } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Link, useNavigate, useParams } from 'react-router';

import { EmptyState } from '../../components/common/EmptyState';
import { useAsync } from '../../hooks/useAsync';
import { loadVehicleById } from '../../services/vehicles';
import { breakpoint, layout } from '../../styles/layouts';
import { BidModal } from './components/BidModal';
import { BuyoutModal } from './components/BuyoutModal';
import { VehicleDetailBody } from './components/VehicleDetailBody';

/**
 * The vehicle detail experience, as a modal over the inventory grid.
 *
 * It is a nested route rather than component state, which buys three things for
 * no extra machinery:
 *
 *   - the card's link keeps working as a plain `<Link>`; nothing on the card
 *     needs to know a modal exists
 *   - a vehicle URL is shareable and bookmarkable, and loads straight into the
 *     open modal
 *   - Escape, the overlay, and the browser's back button all close it
 *
 * The grid stays mounted underneath, so closing returns to the same scroll
 * position with the same batches rendered — which a separate page would throw
 * away every time.
 */
export function VehicleDetailModal() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: vehicle, loading, error } = useAsync(() => loadVehicleById(id), id);

  // A modal that has to scroll internally on a phone is worse than a full
  // screen, and this one is dense.
  const compact = useMediaQuery(`(max-width: ${breakpoint.sm})`);
  const [bidding, setBidding] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  // Either dialog stacked on top suspends this one's dismiss handlers.
  const stacked = bidding || buyingNow;

  const close = () => navigate('/');

  const title = vehicle ? (
    <Group gap={layout.inlineGap} align="baseline" wrap="wrap">
      <Title order={2} fz="h3">
        {vehicle.year} {vehicle.make} {vehicle.model}
      </Title>
      <Text c="dimmed" fz="sm">
        {vehicle.trim}
      </Text>
    </Group>
  ) : (
    <Text fw={600}>{loading ? 'Loading…' : 'Vehicle'}</Text>
  );

  return (
    <>
      <Modal
        opened
        onClose={close}
        title={title}
        size={layout.modalWidth}
        fullScreen={compact}
        centered
        /*
         * While a dialog is stacked on top, this one stops listening for Escape
         * and outside clicks. Without it a single Escape closes both and
         * navigates back to the grid — dismissing a bid or buyout dialog should
         * not throw away the vehicle the buyer was reading.
         */
        closeOnEscape={!stacked}
        closeOnClickOutside={!stacked}
      >
        {loading && <Loader size="sm" />}

        {error && (
          <Alert color="red" title="Could not load this vehicle">
            {error.message}
          </Alert>
        )}

        {!loading && !error && !vehicle && (
          <EmptyState
            title="Vehicle not found"
            description={`No lot in this auction matches the id “${id}”.`}
            action={
              <Button component={Link} to="/">
                Back to inventory
              </Button>
            }
          />
        )}

        {vehicle && (
          <VehicleDetailBody
            vehicle={vehicle}
            onPlaceBid={() => setBidding(true)}
            onBuyNow={() => setBuyingNow(true)}
          />
        )}
      </Modal>

      {vehicle && (
        <BidModal
          vehicle={vehicle}
          opened={bidding}
          onClose={() => setBidding(false)}
        />
      )}

      <BuyoutModal opened={buyingNow} onClose={() => setBuyingNow(false)} />
    </>
  );
}



