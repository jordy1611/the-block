/**
 * Type tokens: families, sizes, weights, line heights.
 *
 * Sizes are named for the job, not the measurement — `label` stays `label` if it
 * later moves from 12px to 13px. rem throughout so the scale respects the
 * reader's browser setting; the px comment is the value at a 16px root.
 */

export const fontFamily = {
  /**
   * System stack. No webfont: it would be a render-blocking request on a
   * prototype whose whole point is how fast the inventory appears.
   */
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  /**
   * VINs, lot numbers, odometer readings, prices. Scan-and-compare data, so the
   * digits need to line up down a column of cards.
   */
  mono: 'ui-monospace, SFMono-Regular, "Cascadia Mono", Menlo, Consolas, monospace',
} as const;

export const fontSize = {
  /** 32px — reserved for a true page-dominant heading. Unused so far. */
  display: '2rem',
  /** 24px — the one h1 per route: "Inventory", the vehicle name. */
  title: '1.5rem',
  /** 20px — the number a buyer is actually looking for: the current bid. */
  amount: '1.25rem',
  /** 18.8px — section headings and the brand wordmark. */
  heading: '1.175rem',
  /** 16px — default body copy. */
  body: '1rem',
  /** 14px — card metadata: odometer, location, trim. */
  detail: '0.875rem',
  /** 12px — lot numbers, uppercase field labels, bid counts, the footer. */
  label: '0.75rem',
} as const;

/**
 * Three weights, not two — worth knowing before these get adopted.
 *
 * The app currently renders 600 (buttons, uppercase labels), 650 (headings and
 * card titles, set in the theme), and 700 (brand wordmark, bid amounts). 650 is
 * a Mantine default that was never chosen deliberately. Collapsing it into
 * `bold` leaves two weights and is a visible change to heading weight, which is
 * why it is called out here rather than done quietly.
 */
export const fontWeight = {
  regular: 400,
  /** Labels, buttons, anything that needs emphasis without shouting. */
  semibold: 600,
  /** Headings, prices, the brand. */
  bold: 700,
} as const;

export const lineHeight = {
  /** 1.15 — display sizes, where default leading looks loose. */
  display: 1.15,
  title: 1.2,
  heading: 1.3,
  /** 1.55 — running text. */
  body: 1.55,
  /** 1.45 — dense blocks: card metadata stacks. */
  compact: 1.45,
} as const;

export const letterSpacing = {
  normal: 'normal',
  /** Uppercase labels need loosening or they set as a solid block. */
  label: '0.4px',
} as const;
