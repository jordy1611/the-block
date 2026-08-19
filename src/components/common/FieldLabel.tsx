import type { ReactNode } from 'react';
import { Text, type TextProps } from '@mantine/core';

import { fontWeight, letterSpacing } from '../../styles/fonts';

/**
 * The small uppercase label that sits above a value.
 *
 * One definition, because it appears above bids on the card, above every spec
 * in the modal, and above the figures in the bid bar — three places that would
 * otherwise drift apart a prop at a time.
 */
export function FieldLabel({
  children,
  ...props
}: TextProps & { children: ReactNode }) {
  return (
    <Text
      fz="xs"
      c="dimmed"
      tt="uppercase"
      fw={fontWeight.semibold}
      lts={letterSpacing.label}
      {...props}
    >
      {children}
    </Text>
  );
}


