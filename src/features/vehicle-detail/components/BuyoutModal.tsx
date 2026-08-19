import { Button, Group, Modal, Stack, Text } from '@mantine/core';

import { layout } from '../../../styles/layouts';

interface BuyoutModalProps {
  opened: boolean;
  onClose: () => void;
}

/**
 * Buyout confirmation — the shell only.
 *
 * Cancel closes. **Buyout does nothing yet**, deliberately: taking a lot at its
 * buy-now price ends the auction for everyone watching it, so it needs the same
 * things a bid needs — a POST, a receipt, and the update channel to tell the
 * other bidders the lot is gone — and none of that exists until the bid store
 * lands (the rest of Phase 4). Wiring the button to close the dialog would be
 * worse than leaving it inert, because a dialog that dismisses itself reads as
 * a purchase that went through.
 *
 * Listed under "Deliberately not built" in CLAUDE.md so it is not mistaken for
 * a bug.
 *
 * Takes no vehicle: there is nothing here to render from one yet. It gets the
 * lot when it gets a service call.
 */
export function BuyoutModal({ opened, onClose }: BuyoutModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Buy now" size="sm" centered>
      <Stack gap={layout.sectionGap}>
        <Text fz="sm">Are you sure?</Text>

        <Group justify="flex-end" gap={layout.inlineGap}>
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button>Buyout</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
