/**
 * Colour tokens, in two layers.
 *
 *   Layer 1 — `palette`: raw hex values, named for what they look like. Nothing
 *             here knows where it is used. This is the only file in the app
 *             allowed to contain a hex code.
 *   Layer 2 — `lightColors` / `darkColors`: roles, named for the job they do.
 *             A role points at a palette entry and can be repointed without
 *             touching a single component.
 *
 * Components consume layer 2 through the theme, never layer 1 directly — a card
 * that imports `palette.ink` is a card that renders dark grey in light mode.
 *
 * Every value below is the colour the app renders today, read out of the
 * running page, so adopting these tokens is a refactor and not a redesign.
 */

/* -------------------------------------------------------------------------- */
/* Layer 1 — palette                                                          */
/* -------------------------------------------------------------------------- */

/**
 * The two brand ramps stay as ten-step arrays because that is the shape Mantine
 * requires for a custom colour. Index is the shade: 0 lightest, 9 darkest.
 */
const petrolTeal = [
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
] as const;

const amber = [
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
] as const;

export const palette = {
  petrolTeal,
  amber,

  /** Brand shades pulled out by name, since roles reference these two most. */
  petrolTealMid: petrolTeal[5], // #53a29a — carries on dark surfaces
  petrolTealDeep: petrolTeal[7], // #358881 — carries on white
  amberMid: amber[5],

  // Neutrals, lightest to darkest.
  white: '#ffffff',
  offWhite: '#f8f9fa',
  paleGrey: '#f1f3f5',
  silver: '#ced4da',
  platinum: '#c9c9c9',
  steel: '#868e96',
  ash: '#828282',
  slate: '#424242',
  gunmetal: '#3b3b3b',
  graphite: '#2e2e2e',
  ink: '#242424',
  black: '#000000',

  // Condition grade. Two shades each: the deeper one reads on white, the
  // brighter one on a dark surface.
  emeraldDeep: '#0ca678',
  emeraldBright: '#20c997',
  goldDeep: '#f59f00',
  goldBright: '#fcc419',
  tangerineDeep: '#f76707',
  tangerineBright: '#ff922b',

  /**
    * Sits on photography, so it is the one colour that does not flip with the
    * scheme — a photo is a photo in either mode.
    */
  veil: 'rgba(0, 0, 0, 0.55)',

  // Title status. Each flag needs a surface and a text colour per scheme.
  roseTint: '#ffe3e3',
  roseWhite: '#fff5f5',
  crimson: '#c92a2a',
  maroon: '#651515',
  peachTint: '#ffe8cc',
  creamWhite: '#fff4e6',
  rust: '#d9480f',
  ember: '#6d2408',
} as const;

/* -------------------------------------------------------------------------- */
/* Layer 2 — roles                                                            */
/* -------------------------------------------------------------------------- */

export const lightColors = {
  /** The page itself. */
  pageBackground: palette.white,
  /** Cards and panels — one step off the page so they read as surfaces. */
  surface: palette.paleGrey,
  /** Recessed areas: image wells, skeleton blocks. */
  surfaceSunken: palette.offWhite,
  /** Chips laid over a photo, where neither scheme's surface would read. */
  overlaySurface: palette.veil,
  /** Text on that scrim. Always light: the scrim is always dark. */
  overlayText: palette.white,
  overlayTextMuted: palette.platinum,
  border: palette.silver,

  textPrimary: palette.black,
  /** Metadata, captions, the footer — everything that is not the main line. */
  textSecondary: palette.steel,

  /** Ordinary chrome: links, focus rings, primary buttons. */
  brand: palette.petrolTealDeep,
  /** Auction state only — live bids, high bidder, reserve. Kept scarce. */
  accent: palette.amberMid,

  gradeHigh: palette.emeraldDeep,
  gradeMedium: palette.goldDeep,
  gradeLow: palette.tangerineDeep,

  titleCleanSurface: palette.white,
  titleCleanText: palette.black,
  titleSalvageSurface: palette.roseTint,
  titleSalvageText: palette.crimson,
  titleRebuiltSurface: palette.peachTint,
  titleRebuiltText: palette.rust,
} as const;

/** Every role must exist in both schemes — the compiler enforces it. */
export type ColorRole = keyof typeof lightColors;
export type ColorScheme = Record<ColorRole, string>;

export const darkColors: ColorScheme = {
  pageBackground: palette.ink,
  surface: palette.graphite,
  surfaceSunken: palette.gunmetal,
  overlaySurface: palette.veil,
  overlayText: palette.white,
  overlayTextMuted: palette.platinum,
  border: palette.slate,

  textPrimary: palette.platinum,
  textSecondary: palette.ash,

  brand: palette.petrolTealMid,
  accent: palette.amberMid,

  gradeHigh: palette.emeraldBright,
  gradeMedium: palette.goldBright,
  gradeLow: palette.tangerineBright,

  titleCleanSurface: palette.gunmetal,
  titleCleanText: palette.platinum,
  titleSalvageSurface: palette.maroon,
  titleSalvageText: palette.roseWhite,
  titleRebuiltSurface: palette.ember,
  titleRebuiltText: palette.creamWhite,
};




