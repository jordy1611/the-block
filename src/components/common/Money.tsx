import { Text, type TextProps } from '@mantine/core';

import { formatCurrency } from '../../utils/currency';

interface MoneyProps extends TextProps {
  /** Amount in CAD. */
  value: number;
}

/**
 * The only way a dollar figure reaches the screen.
 *
 * Formatting lives in `utils/currency`; this exists so that every amount also
 * gets the same *typographic* treatment — tabular figures, so bids stacked down
 * a column of cards line up on the digit rather than drifting.
 */
export function Money({ value, ...props }: MoneyProps) {
  return (
    <Text span style={{ fontVariantNumeric: 'tabular-nums' }} {...props}>
      {formatCurrency(value)}
    </Text>
  );
}
