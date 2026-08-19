import { useEffect, useState } from 'react';
import { ActionIcon, Box } from '@mantine/core';

import { zIndex } from '../../../styles/constants';
import { iconSize, layout, radius } from '../../../styles/layouts';
import { VehicleImage } from './VehicleImage';

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <Box
      component="svg"
      width={iconSize.sm}
      height={iconSize.sm}
      viewBox="0 0 24 24"
      aria-hidden
      style={{ display: 'block' }}
    >
      <path
        d={direction === 'left' ? 'M15 5 8 12l7 7' : 'M9 5l7 7-7 7'}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  );
}

interface VehiclePhotosProps {
  images: string[];
  /** Vehicle description, e.g. "2025 Mazda CX-5". Photo number is appended. */
  alt: string;
}

/**
 * The card's photo, with arrows to step through the rest.
 *
 * Hand-rolled rather than `@mantine/carousel`: that package pulls in Embla for
 * drag physics, snap points, and autoplay, none of which a 4:3 thumbnail with
 * two arrows needs. The arrows themselves are Mantine `ActionIcon`s — the
 * primitive is still the library's.
 *
 * The buttons sit above the card's stretched link and stop their own clicks, so
 * paging through photos never navigates to the detail page. Everything else on
 * the card still does.
 */
export function VehiclePhotos({ images, alt }: VehiclePhotosProps) {
  const [index, setIndex] = useState(0);
  const count = images.length;

  /**
   * Fire-and-forget prefetch of the neighbouring photo, and only once someone
   * has actually paged. Doing it on mount would mean 200 cards requesting
   * images nobody asked to see; doing it after the first arrow press means the
   * second press is instant. No await — nothing here depends on the result.
   */
  useEffect(() => {
    if (index === 0 || count < 2) return;

    const next = new Image();
    next.src = images[(index + 1) % count];
  }, [index, images, count]);

  const step = (delta: number) => (event: React.MouseEvent) => {
    // The card is clickable via a stretched link; this must not trigger it.
    event.preventDefault();
    event.stopPropagation();
    setIndex((current) => (current + delta + count) % count);
  };

  const arrow = {
    pos: 'absolute' as const,
    top: '50%',
    variant: 'transparent' as const,
    c: 'var(--app-overlay-text)',
    bg: 'var(--app-overlay-surface)',
    radius: radius.pill,
    style: { transform: 'translateY(-50%)', zIndex: zIndex.cardControl },
  };

  return (
    <Box pos="relative">
      <VehicleImage
        key={images[index]}
        src={images[index]}
        alt={`${alt}, photo ${index + 1} of ${count}`}
      />

      {count > 1 && (
        <>
          <ActionIcon
            {...arrow}
            left={layout.overlayInset}
            aria-label="Previous photo"
            onClick={step(-1)}
          >
            <Chevron direction="left" />
          </ActionIcon>
          <ActionIcon
            {...arrow}
            right={layout.overlayInset}
            aria-label="Next photo"
            onClick={step(1)}
          >
            <Chevron direction="right" />
          </ActionIcon>
        </>
      )}
    </Box>
  );
}

