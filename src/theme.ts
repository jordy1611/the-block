import {
  createTheme,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from '@mantine/core';

import {
  darkColors,
  lightColors,
  palette,
  type ColorScheme,
} from './styles/colors';
import { fontFamily, fontSize, fontWeight, lineHeight } from './styles/fonts';
import { borderWidth, layout, radius, space } from './styles/layouts';
import { duration, easing, motion, shadow, zIndex } from './styles/constants';

/**
 * The single mapping layer between our design tokens and Mantine.
 *
 * Every value here comes from `src/styles/`. If you find a literal below —
 * a hex code, a px value, a font weight — it is a bug, not a shortcut.
 *
 * Two mechanisms, because Mantine has two kinds of token:
 *
 *   `theme`                 the scales Mantine already models — colours,
 *                           spacing, radius, font sizes, headings.
 *   `cssVariablesResolver`  everything else. It emits our semantic roles as
 *                           `--app-*` variables per colour scheme, and
 *                           overrides Mantine's own surface variables so that
 *                           built-in components resolve to our tokens too.
 */

/** Mantine requires exactly ten shades; our ramps are authored that way. */
const lane = palette.petrolTeal as unknown as MantineColorsTuple;
const signal = palette.amber as unknown as MantineColorsTuple;

export const theme = createTheme({
  white: palette.white,
  black: palette.black,

  colors: { lane, signal },
  primaryColor: 'lane',
  // Shade 7 carries enough weight on white; 5 keeps it readable on dark.
  primaryShade: { light: 7, dark: 5 },

  fontFamily: fontFamily.sans,
  // VINs, lot numbers, and odometer readings are scan-and-compare data. A
  // monospace face keeps digits aligned down a column of cards.
  fontFamilyMonospace: fontFamily.mono,

  fontSizes: {
    xs: fontSize.label,
    sm: fontSize.detail,
    md: fontSize.body,
    lg: fontSize.heading,
    xl: fontSize.amount,
  },

  headings: {
    fontWeight: String(fontWeight.bold),
    sizes: {
      h1: { fontSize: fontSize.display, lineHeight: String(lineHeight.display) },
      h2: { fontSize: fontSize.title, lineHeight: String(lineHeight.title) },
      h3: { fontSize: fontSize.heading, lineHeight: String(lineHeight.heading) },
    },
  },

  spacing: space,
  radius: {
    xs: radius.xs,
    sm: radius.sm,
    md: radius.md,
    lg: radius.lg,
    xl: radius.xl,
  },
  defaultRadius: 'md',

  components: {
    Button: { defaultProps: { fw: fontWeight.semibold } },
    Badge: { defaultProps: { radius: 'sm' } },

    // Page width lives here, not in each page.
    Container: { defaultProps: { size: layout.containerMaxWidth } },

    // Cards sit on their own surface rather than sharing the page background.
    // One variable, resolved per scheme below.
    Card: { defaultProps: { bg: 'var(--app-surface)' } },
  },
});

/**
 * Semantic roles as CSS variables.
 *
 * `variables` is scheme-independent; `light` and `dark` are swapped by Mantine
 * on the root element. Anything a `*.module.css` needs has to be here — a
 * stylesheet cannot import TypeScript.
 *
 * The `--mantine-*` overrides are the important part: they point Mantine's own
 * surface, text, and border variables at our roles, so `c="dimmed"`, a bordered
 * Card, and an Alert all resolve to tokens without touching a single component.
 */
const roleVariables = (colors: ColorScheme) => ({
  '--app-page-background': colors.pageBackground,
  '--app-surface': colors.surface,
  '--app-surface-sunken': colors.surfaceSunken,
  '--app-overlay-surface': colors.overlaySurface,
  '--app-overlay-text': colors.overlayText,
  '--app-overlay-text-muted': colors.overlayTextMuted,
  '--app-border': colors.border,
  '--app-text-primary': colors.textPrimary,
  '--app-text-secondary': colors.textSecondary,
  '--app-brand': colors.brand,
  '--app-accent': colors.accent,

  '--app-status-positive': colors.statusPositive,
  '--app-status-caution': colors.statusCaution,

  '--app-grade-high': colors.gradeHigh,
  '--app-grade-medium': colors.gradeMedium,
  '--app-grade-low': colors.gradeLow,

  '--app-title-clean-surface': colors.titleCleanSurface,
  '--app-title-clean-text': colors.titleCleanText,
  '--app-title-salvage-surface': colors.titleSalvageSurface,
  '--app-title-salvage-text': colors.titleSalvageText,
  '--app-title-rebuilt-surface': colors.titleRebuiltSurface,
  '--app-title-rebuilt-text': colors.titleRebuiltText,

  // Mantine's own tokens, repointed at ours.
  '--mantine-color-body': colors.pageBackground,
  '--mantine-color-text': colors.textPrimary,
  '--mantine-color-dimmed': colors.textSecondary,
  '--mantine-color-default-border': colors.border,
});

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {
    '--app-duration-fast': duration.fast,
    '--app-duration-base': duration.base,
    '--app-easing': easing.standard,
    '--app-hover-lift': motion.hoverLift,
    '--app-border-width': borderWidth.hairline,
    '--app-border-width-focus': borderWidth.focus,
    '--app-border-width-live': borderWidth.live,
    '--app-duration-pulse': duration.pulse,
    '--app-z-card-link': String(zIndex.cardLink),
    '--app-shadow-card': shadow.card,
  },
  light: roleVariables(lightColors),
  dark: roleVariables(darkColors),
});







