import { Box, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';

import { iconSize, layout } from '../../styles/layouts';
import classes from './CopyText.module.css';

function CopyIcon({ copied }: { copied: boolean }) {
  return (
    <Box
      component="svg"
      className={classes.icon}
      width={iconSize.xs}
      height={iconSize.xs}
      viewBox="0 0 24 24"
      aria-hidden
      style={{ display: 'block', flexShrink: 0 }}
    >
      {copied ? (
        <path
          d="m5 13 4.5 4.5L19 7"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <g fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round">
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M15 5.5A1.5 1.5 0 0 0 13.5 4H6a2 2 0 0 0-2 2v7.5A1.5 1.5 0 0 0 5.5 15" />
        </g>
      )}
    </Box>
  );
}

interface CopyTextProps {
  /** The text shown, and the text copied. */
  value: string;
  /** What the value is, for the tooltip and the screen-reader name. */
  label?: string;
}

/**
 * A value you can click to copy, with the copy icon to its right.
 *
 * VINs and lot numbers exist to be pasted somewhere else — into a valuation
 * tool, a spreadsheet, a message to a colleague — and selecting seventeen
 * characters of monospace by hand is a small, repeated annoyance.
 *
 * Font size and family are inherited rather than set, so the value keeps
 * whatever typography its surroundings gave it and only gains the affordance.
 * `useClipboard` is Mantine's; the copied state resets itself.
 */
export function CopyText({ value, label = 'value' }: CopyTextProps) {
  const clipboard = useClipboard({ timeout: 1500 });

  return (
    <Tooltip
      label={clipboard.copied ? 'Copied' : `Copy ${label}`}
      withArrow
      fz="xs"
    >
      <UnstyledButton
        className={classes.copy}
        onClick={() => clipboard.copy(value)}
        aria-label={`Copy ${label}`}
        px={layout.chipPaddingY}
        style={{ gap: layout.microGap }}
      >
        <Text span fz="inherit" ff="inherit" lh="inherit">
          {value}
        </Text>
        <CopyIcon copied={clipboard.copied} />
      </UnstyledButton>
    </Tooltip>
  );
}

