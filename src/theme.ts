import { createTheme, type MantineColorsTuple } from '@mantine/core';

/**
 * Brand palette. Two scales, each with a job:
 *
 * - `lane`   primary. A deep petrol teal — reads as a serious marketplace rather
 *            than default-library blue, and holds contrast in both color schemes.
 * - `signal` accent. Amber, reserved for auction state: live bids, high-bidder
 *            confirmation, reserve indicators. Never used for ordinary chrome.
 */
const lane: MantineColorsTuple = [
  '#eef7f6',
  '#dbebe9',
  '#b5d6d2',
  '#8cc0ba',
  '#69aea6',
  '#53a29a',
  '#459c94',
  '#358881',
  '#297972',
  '#146861',
];

const signal: MantineColorsTuple = [
  '#fff8e1',
  '#ffefcc',
  '#ffdd9b',
  '#ffca64',
  '#ffba38',
  '#ffb01b',
  '#ffab09',
  '#e39500',
  '#ca8400',
  '#af7100',
];

export const theme = createTheme({
  colors: { lane, signal },
  primaryColor: 'lane',
  // Shade 7 carries enough weight on white; 5 keeps it readable on dark surfaces.
  primaryShade: { light: 7, dark: 5 },

  defaultRadius: 'md',

  fontFamily:
    'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',

  // VINs, lot numbers, and odometer readings are scan-and-compare data. They get
  // a monospace face so digits align down a column.
  fontFamilyMonospace:
    'ui-monospace, SFMono-Regular, "Cascadia Mono", Menlo, Consolas, monospace',

  headings: {
    fontWeight: '650',
    sizes: {
      h1: { fontSize: '2rem', lineHeight: '1.15' },
      h2: { fontSize: '1.5rem', lineHeight: '1.2' },
      h3: { fontSize: '1.175rem', lineHeight: '1.3' },
    },
  },

  components: {
    Button: { defaultProps: { fw: 600 } },
    Badge: { defaultProps: { radius: 'sm' } },
  },
});
