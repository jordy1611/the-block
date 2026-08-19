import { useState } from 'react';
import { ActionIcon, Box, Center, Group, Text, UnstyledButton } from '@mantine/core';

import { aspectRatio, zIndex } from '../../../styles/constants';
import { fontWeight } from '../../../styles/fonts';
import { iconSize, layout, radius, borderWidth } from '../../../styles/layouts';

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <Box
      component="svg"
      width={iconSize.md}
      height={iconSize.md}
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

interface PhotoGalleryProps {
  images: string[];
  alt: string;
}

/**
 * Main photo with a thumbnail strip, arrows, and a position counter.
 *
 * Loads eagerly, unlike the grid's `VehicleImage`. Everything here is the
 * reason the modal was opened — deferring it behind an IntersectionObserver
 * would only add a delay to the one image the buyer asked to see.
 */
export function PhotoGallery({ images, alt }: PhotoGalleryProps) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const count = images.length;

  const step = (delta: number) =>
    setIndex((current) => (current + delta + count) % count);

  return (
    <Box>
      <Box
        pos="relative"
        style={{
          aspectRatio: aspectRatio.photo,
          overflow: 'hidden',
          borderRadius: radius.md,
          backgroundColor: 'var(--app-surface-sunken)',
        }}
      >
        {!failed[index] && (
          <Box
            component="img"
            src={images[index]}
            alt={`${alt}, photo ${index + 1} of ${count}`}
            onError={() => setFailed((current) => ({ ...current, [index]: true }))}
            w="100%"
            h="100%"
            style={{ objectFit: 'cover' }}
          />
        )}

        {failed[index] && (
          <Center pos="absolute" inset={0}>
            <Text c="dimmed" fz="sm">
              Photo unavailable
            </Text>
          </Center>
        )}

        {count > 1 && (
          <>
            <ActionIcon
              pos="absolute"
              top="50%"
              left={layout.overlayInset}
              variant="transparent"
              c="var(--app-overlay-text)"
              bg="var(--app-overlay-surface)"
              radius={radius.pill}
              aria-label="Previous photo"
              onClick={() => step(-1)}
              style={{ transform: 'translateY(-50%)', zIndex: zIndex.cardControl }}
            >
              <Chevron direction="left" />
            </ActionIcon>
            <ActionIcon
              pos="absolute"
              top="50%"
              right={layout.overlayInset}
              variant="transparent"
              c="var(--app-overlay-text)"
              bg="var(--app-overlay-surface)"
              radius={radius.pill}
              aria-label="Next photo"
              onClick={() => step(1)}
              style={{ transform: 'translateY(-50%)', zIndex: zIndex.cardControl }}
            >
              <Chevron direction="right" />
            </ActionIcon>

            <Box
              pos="absolute"
              bottom={layout.overlayInset}
              left="50%"
              bg="var(--app-overlay-surface)"
              px={layout.chipPaddingX}
              py={layout.chipPaddingY}
              style={{ borderRadius: radius.sm, transform: 'translateX(-50%)' }}
            >
              <Text fz="xs" fw={fontWeight.semibold} c="var(--app-overlay-text)">
                {index + 1} / {count}
              </Text>
            </Box>
          </>
        )}
      </Box>

      {count > 1 && (
        <Group gap={layout.inlineGap} mt={layout.inlineGap} wrap="wrap">
          {images.map((image, thumbIndex) => (
            <UnstyledButton
              key={image}
              onClick={() => setIndex(thumbIndex)}
              aria-label={`Show photo ${thumbIndex + 1}`}
              aria-current={thumbIndex === index}
              w={layout.thumbnailSize}
              style={{
                aspectRatio: aspectRatio.photo,
                overflow: 'hidden',
                borderRadius: radius.sm,
                backgroundColor: 'var(--app-surface-sunken)',
                outline:
                  thumbIndex === index
                    ? `${borderWidth.focus} solid var(--app-brand)`
                    : undefined,
                outlineOffset: borderWidth.focus,
              }}
            >
              {!failed[thumbIndex] && (
                <Box
                  component="img"
                  src={image}
                  alt=""
                  loading="lazy"
                  onError={() =>
                    setFailed((current) => ({ ...current, [thumbIndex]: true }))
                  }
                  w="100%"
                  h="100%"
                  style={{ objectFit: 'cover', display: 'block' }}
                />
              )}
            </UnstyledButton>
          ))}
        </Group>
      )}
    </Box>
  );
}

