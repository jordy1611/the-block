import { Alert, Button, Loader, Modal, Text } from '@mantine/core';
import { Link, useNavigate, useParams } from 'react-router';

import { EmptyState } from '../../components/common/EmptyState';
import { useAsync } from '../../hooks/useAsync';
import { loadVehicleById } from '../../services/vehicles';

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
 *
 * Phase 3 fills the body: gallery, specs, condition, seller, and the bid panel.
 */
export function VehicleDetailModal() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: vehicle, loading, error } = useAsync(() => loadVehicleById(id), id);

  const close = () => navigate('/');

  const title = vehicle
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    : loading
      ? 'Loading…'
      : 'Vehicle';

  return (
    <Modal opened onClose={close} title={title} size="lg" centered>
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
        <Text c="dimmed">
          Lot {vehicle.lot}. The detail content — gallery, specs, condition
          report, seller, and the bid panel — is the next phase.
        </Text>
      )}
    </Modal>
  );
}
