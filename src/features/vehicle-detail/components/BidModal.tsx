import { Alert, Modal, Stack } from '@mantine/core';

import { Money } from '../../../components/common/Money';
import { SpecList } from '../../../components/common/SpecList';
import { layout } from '../../../styles/layouts';
import type { Vehicle } from '../../../types/vehicle';
import { displayBid, minimumNextBid } from '../../../utils/bidding';

interface BidModalProps {
  vehicle: Vehicle;
  opened: boolean;
  onClose: () => void;
}

/**
 * The bid flow's shell, stacked over the detail modal.
 *
 * Held in the detail modal's own state rather than given a route: a half-filled
 * bid form is not a thing anyone should be able to link someone else to, and
 * unlike the vehicle itself it has nothing worth restoring on reload.
 *
 * Phase 4 replaces the body with the form, validation, and confirmation. The
 * numbers below are reads, not state — the rules already live in
 * `utils/bidding.ts`.
 */
export function BidModal({ vehicle, opened, onClose }: BidModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Place a bid" size="md" centered>
      <Stack gap={layout.sectionGap}>
        <SpecList
          items={[
            { label: 'Current bid', value: <Money value={displayBid(vehicle)} /> },
            {
              label: 'Minimum next bid',
              value: <Money value={minimumNextBid(vehicle)} />,
            },
          ]}
        />

        <Alert color="lane" title="Not wired up yet">
          The amount input, validation, and confirmation are the next phase. The
          increment and minimum shown here are the real rules.
        </Alert>
      </Stack>
    </Modal>
  );
}

