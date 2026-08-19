/**
 * The visual tokens that are not colour, type, or layout: motion, elevation,
 * stacking, and fixed proportions.
 *
 * Small file on purpose. It exists so that "how fast does a hover feel" and
 * "what sits above what" are answered in one place rather than by whichever
 * component was written last.
 */

export const duration = {
  /** 150ms — hover and focus. Fast enough to feel like a response. */
  fast: '150ms',
  /** 200ms — image fade-in, so a photo arrives rather than snapping in. */
  base: '200ms',
  /** 2s — one breath of the live-lot pulse. Slow enough to read as a state. */
  pulse: '2000ms',
} as const;

export const easing = {
  standard: 'ease',
} as const;

/**
 * Motion is decoration, and decoration is optional. Every transition built from
 * these tokens must be disabled under `prefers-reduced-motion: reduce`.
 */
export const motion = {
  hover: `${duration.fast} ${easing.standard}`,
  fade: `${duration.base} ${easing.standard}`,
  /** How far a card lifts on hover. */
  hoverLift: '-2px',
} as const;

/**
 * Shadows stay pointed at Mantine's generated values. They are multi-layer
 * rgba stacks tuned per elevation, and re-typing them here would be copying
 * something we have no intention of maintaining.
 */
export const shadow = {
  card: 'var(--mantine-shadow-md)',
} as const;

/**
 * One scale, so nothing is fixed by guessing a bigger number than the thing it
 * needs to cover. Mantine's own overlays (modals, tooltips) sit at 200+.
 */
export const zIndex = {
  /**
   * The card's stretched link — an ::after that covers the whole card so the
   * card is clickable without wrapping its contents in an anchor.
   */
  cardLink: 1,
  /** Controls that must stay clickable above that link: the photo arrows. */
  cardControl: 2,
  header: 100,
} as const;

export const aspectRatio = {
  /** Vehicle photography, and the image well that reserves space for it. */
  photo: '4 / 3',
} as const;


