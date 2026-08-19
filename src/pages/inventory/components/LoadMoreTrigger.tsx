import { useEffect, useRef } from 'react';
import { Box } from '@mantine/core';

import { layout } from '../../../styles/layouts';
import { observeOnce, supportsIntersectionObserver } from '../intersection';

/**
 * Appends the next batch of cards well before the user reaches the end, so the
 * grid never shows its own bottom edge.
 */
const ROOT_MARGIN = '800px';

interface LoadMoreTriggerProps {
  /** How many cards are currently rendered. Moving it re-arms the trigger. */
  cursor: number;
  onReach: () => void;
}

/**
 * A one-pixel sentinel below the grid.
 *
 * `observeOnce` stops watching after it fires, so the trigger re-arms itself
 * whenever `cursor` changes — which is precisely when a new batch has been
 * rendered and the sentinel has moved down the page. If the new batch does not
 * push it off screen (a tall viewport, a short batch), it fires again straight
 * away and keeps filling.
 */
export function LoadMoreTrigger({ cursor, onReach }: LoadMoreTriggerProps) {
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = sentinel.current;
    if (!element) return;

    // No observer support: render everything rather than stranding the user
    // partway down the list with no way to reach the rest.
    if (!supportsIntersectionObserver()) {
      onReach();
      return;
    }

    return observeOnce(element, ROOT_MARGIN, onReach);
  }, [cursor, onReach]);

  return <Box ref={sentinel} h={layout.sentinelHeight} aria-hidden />;
}

