import { useEffect, useRef, useState } from 'react';
import { Box, Center, Text } from '@mantine/core';

import { aspectRatio } from '../../../styles/constants';
import { observeOnce, supportsIntersectionObserver } from '../intersection';

/**
 * Lazy image loading for the inventory grid.
 *
 * 200 cards, 3-6 external photos each, ~0.7s per request. Requesting all of
 * them on mount saturates the connection with images nobody has scrolled to.
 *
 * The request starts 300px before the card enters the viewport, so the image
 * has usually landed by the time it is actually on screen. Lazy loading that is
 * visible to the user is just slow loading.
 */
const ROOT_MARGIN = '300px';

interface VehicleImageProps {
  src: string | undefined;
  alt: string;
}

export function VehicleImage({ src, alt }: VehicleImageProps) {
  const frame = useRef<HTMLDivElement>(null);
  // Environments without IntersectionObserver (older browsers, test runners)
  // load immediately rather than never.
  const [requested, setRequested] = useState(
    () => !supportsIntersectionObserver(),
  );
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = frame.current;
    if (!element || requested) return;

    return observeOnce(element, ROOT_MARGIN, () => setRequested(true));
  }, [requested]);

  return (
    <Box
      ref={frame}
      pos="relative"
      style={{
        aspectRatio: aspectRatio.photo,
        overflow: 'hidden',
        backgroundColor: 'var(--app-surface-sunken)',
      }}
    >
      {requested && src && !failed && (
        <Box
          component="img"
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          w="100%"
          h="100%"
          style={{
            objectFit: 'cover',
            // Fade in on load so a card never flashes from empty to image.
            opacity: loaded ? 1 : 0,
            transition: 'opacity var(--app-duration-base) var(--app-easing)',
          }}
        />
      )}

      {(failed || !src) && (
        <Center pos="absolute" inset={0}>
          <Text c="dimmed" fz="xs">
            Photo unavailable
          </Text>
        </Center>
      )}
    </Box>
  );
}




