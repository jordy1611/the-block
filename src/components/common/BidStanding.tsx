import { Text, type TextProps } from '@mantine/core';

import type { LotStanding } from '../../hooks/useLiveLot';
import { fontWeight } from '../../styles/fonts';

const LABEL = {
  high: 'High bidder',
  outbid: 'Outbid',
} as const;

const COLOR = {
  high: 'var(--app-status-positive)',
  outbid: 'var(--app-status-caution)',
} as const;

/**
 * Where this buyer stands on a lot, once they have bid on it.
 *
 * Two words, in the same green and amber the reserve status uses, because it
 * answers the same kind of question — is this going my way — and a buyer
 * scanning the grid should not have to learn a second colour language for it.
 *
 * Renders nothing at all when there is no standing to report, which is every
 * lot they have not bid on. An "—" or a "Not bidding" would put a row of
 * absences across the grid saying nothing.
 *
 * Shared rather than colocated because the card and the bid bar both need it,
 * and a buyer who reads "Outbid" on the grid must not find different wording
 * for the same fact when they open the lot.
 */
export function BidStanding({
  standing,
  ...props
}: TextProps & { standing: LotStanding }) {
  if (standing === undefined) return null;

  return (
    <Text fz="xs" fw={fontWeight.semibold} c={COLOR[standing]} {...props}>
      {LABEL[standing]}
    </Text>
  );
}
