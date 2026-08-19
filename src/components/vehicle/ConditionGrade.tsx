import { Text, type TextProps } from '@mantine/core';

import { fontWeight } from '../../styles/fonts';
import { gradeColor } from './gradeColor';

interface ConditionGradeProps extends TextProps {
  /** 1.2 to 5.0 in this dataset. */
  grade: number;
  /**
   * Whether to print the denominator. On by default: a bare "4.0" means nothing
   * to a buyer who does not already know the scale.
   *
   * Turned off only where the surrounding context carries the scale for it —
   * the chip over the card photo, where there is no room and the colour band is
   * doing the comparing.
   */
  showScale?: boolean;
}

/** The condition grade, as "4.0 / 5" — or bare "4.0" where the scale is implied. */
export function ConditionGrade({
  grade,
  showScale = true,
  ...props
}: ConditionGradeProps) {
  return (
    <Text span fz="sm" {...props}>
      {/* `fz`/`lh` inherit deliberately. Mantine's Text re-asserts the medium
          font size on every instance, so without this a caller passing fz="xs"
          would shrink the wrapper and leave the digits at 16px. */}
      <Text
        span
        fz="inherit"
        lh="inherit"
        fw={fontWeight.bold}
        c={gradeColor(grade)}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {grade.toFixed(1)}
      </Text>
      {showScale && (
        <Text span fz="inherit" lh="inherit" c="dimmed">
          {' / 5'}
        </Text>
      )}
    </Text>
  );
}



