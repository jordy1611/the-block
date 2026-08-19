import { Badge, type BadgeProps } from '@mantine/core';

import type { TitleStatus } from '../../types/vehicle';

interface TitleBadgeProps extends BadgeProps {
  status: TitleStatus;
}

/**
 * Title status, flagged on every surface that shows a vehicle.
 *
 * A salvage or rebuilt title is the single most consequential fact about a lot
 * — it changes what the vehicle is worth and whether a buyer wants it at all.
 * Surfacing it on the card rather than burying it in the detail page costs
 * nothing and is the cheapest trust signal in the app.
 *
 * "Clean" is shown too, quietly. Absence of a warning is ambiguous; a stated
 * clean title is not.
 *
 * Colours come from the title roles rather than Mantine's named palettes, so
 * the flag a buyer relies on is defined in one place and cannot drift.
 */
const LABELS: Record<TitleStatus, string> = {
  clean: 'Clean title',
  salvage: 'Salvage',
  rebuilt: 'Rebuilt',
};

const SURFACE: Record<TitleStatus, string> = {
  clean: 'var(--app-title-clean-surface)',
  salvage: 'var(--app-title-salvage-surface)',
  rebuilt: 'var(--app-title-rebuilt-surface)',
};

const TEXT: Record<TitleStatus, string> = {
  clean: 'var(--app-title-clean-text)',
  salvage: 'var(--app-title-salvage-text)',
  rebuilt: 'var(--app-title-rebuilt-text)',
};

export function TitleBadge({ status, ...props }: TitleBadgeProps) {
  return (
    <Badge bg={SURFACE[status]} c={TEXT[status]} size="sm" {...props}>
      {LABELS[status]}
    </Badge>
  );
}

