/**
 * Layout tokens: the spacing scale, radii, borders, and the named measurements
 * built from them.
 *
 * `space` is the scale; everything under `layout` is a role. A component asks
 * for `layout.cardPadding`, not for "16px" and not for "md" — so changing card
 * density is one edit here, not a search across every card in the app.
 */

export const space = {
  /** 10px */
  xs: '0.625rem',
  /** 12px */
  sm: '0.75rem',
  /** 16px */
  md: '1rem',
  /** 20px */
  lg: '1.25rem',
  /** 32px */
  xl: '2rem',
} as const;

export const radius = {
  /** 2px — the smallest step; Mantine needs a five-key scale. */
  xs: '0.125rem',
  /** 4px — badges and chips. */
  sm: '0.25rem',
  /** 8px — the app default: cards, inputs, buttons. */
  md: '0.5rem',
  /** 16px — large panels. */
  lg: '1rem',
  /** 32px */
  xl: '2rem',
  /** Fully round: avatars, pills. */
  pill: '999px',
} as const;

export const borderWidth = {
  hairline: '1px',
  /** Focus rings, which have to survive next to a 1px border. */
  focus: '2px',
  /** 3px — a live lot's border, thick enough to read across a grid. */
  live: '3px',
} as const;

export const layout = {
  /** 1320px. Four cards across without the grid outrunning a readable measure. */
  containerMaxWidth: '82.5rem',
  /** 16px gutter between the container and the viewport edge. */
  containerPaddingX: space.md,
  /** 32px above and below page content. */
  pagePaddingY: space.xl,
  /** 12px — keeps the sticky header shallow so more inventory stays visible. */
  headerPaddingY: space.sm,

  /** 16px inside a card. */
  cardPadding: space.md,
  /** 20px between cards, both axes. */
  gridGutter: space.lg,

  /** 20px between major blocks on a page: title, search, grid. */
  sectionGap: space.lg,
  /** 10px between related lines inside a card. */
  stackGap: space.xs,
  /** 10px between items on one line: badges, meta separated by dots. */
  inlineGap: space.xs,
  /** 6px — inside a single line of metadata, around the dot separators. */
  microGap: '0.375rem',
  /** 2px — a title and the line explaining it, read as one block. */
  tightGap: '0.125rem',

  /** 10px — how far a chip laid over an image sits from its corner. */
  overlayInset: space.xs,
  /** Padding inside such a chip. */
  chipPaddingX: space.xs,
  chipPaddingY: '0.25rem',

  /** 480px — a search field wider than this stops scanning as one field. */
  searchMaxWidth: '30rem',
  /** 420px — measure for centred prose: empty states, not-found copy. */
  proseMaxWidth: '26.25rem',
  /** 64px — vertical breathing room around a centred empty state. */
  emptyStatePaddingY: '4rem',
  /** The load-more sentinel. Has to occupy layout to be observable at all. */
  sentinelHeight: '1px',
} as const;

/** Icon sizes, in px because SVG width/height attributes take numbers. */
export const iconSize = {
  /** 16 — inside inputs. */
  sm: 16,
  /** 18 — icon buttons. */
  md: 18,
  /** 26 — the brand mark. */
  brand: 26,
} as const;

/**
 * Breakpoints in em, matching `postcss.config.cjs`. em rather than px so a
 * reader who scales their default font gets the layout that fits the text.
 */
export const breakpoint = {
  /** 576px */
  xs: '36em',
  /** 768px */
  sm: '48em',
  /** 992px */
  md: '62em',
  /** 1200px */
  lg: '75em',
  /** 1408px */
  xl: '88em',
} as const;




