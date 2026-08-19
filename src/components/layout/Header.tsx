import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Container,
  Group,
  Text,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import { Link } from 'react-router';

import { zIndex } from '../../styles/constants';
import { fontWeight } from '../../styles/fonts';
import { iconSize, layout } from '../../styles/layouts';

/**
 * The brand mark. Three stacked lanes with the top one lit — a block of lots
 * moving through the lane, which is what the app is. Drawn inline rather than
 * pulled from an icon package: it is eight lines, and this app has no other
 * need for an icon dependency.
 */
function BlockMark() {
  return (
    <Box
      component="svg"
      width={iconSize.brand}
      height={iconSize.brand}
      viewBox="0 0 24 24"
      aria-hidden
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect x="2" y="4" width="20" height="4.5" rx="1.5" fill="currentColor" />
      <rect x="2" y="10.5" width="20" height="4.5" rx="1.5" fill="currentColor" opacity={0.55} />
      <rect x="2" y="17" width="20" height="4.5" rx="1.5" fill="currentColor" opacity={0.25} />
    </Box>
  );
}

/** Sun and moon share a box so the toggle does not jump between states. */
function SchemeIcon({ dark }: { dark: boolean }) {
  return (
    <Box component="svg" width={iconSize.md} height={iconSize.md} viewBox="0 0 24 24" aria-hidden>
      {dark ? (
        <path
          d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      ) : (
        <g fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7" />
        </g>
      )}
    </Box>
  );
}

/**
 * Persistent app chrome. Deliberately thin: brand, a scheme toggle, and nothing
 * else. Search belongs to the inventory page, not the shell — putting it here
 * would make every other route render a control it does not own.
 */
export function Header() {
  const { setColorScheme } = useMantineColorScheme();
  const scheme = useComputedColorScheme('light');
  const next = scheme === 'dark' ? 'light' : 'dark';

  return (
    <Box
      component="header"
      pos="sticky"
      top={0}
      py={layout.headerPaddingY}
      style={{
        zIndex: zIndex.header,
        backgroundColor: 'var(--app-page-background)',
        borderBottom: 'var(--app-border-width) solid var(--app-border)',
      }}
    >
      <Container>
        <Group justify="space-between" align="center" wrap="nowrap">
          <Anchor component={Link} to="/" underline="never" aria-label="The Block, home">
            <Group gap="xs" align="center" wrap="nowrap">
              <Box c="var(--app-brand)" style={{ display: 'flex' }}>
                <BlockMark />
              </Box>
              <Text fz="h3" fw={fontWeight.bold} c="var(--app-text-primary)" lh={1}>
                The Block
              </Text>
            </Group>
          </Anchor>

          <Group gap="xs" wrap="nowrap">
            {/* Neutral on purpose: `signal` is reserved for auction state, and
                a build label is chrome. */}
            <Badge variant="default" visibleFrom="xs">
              Prototype
            </Badge>
            <Tooltip label={`Switch to ${next} mode`} withArrow>
              <ActionIcon
                variant="default"
                size="lg"
                aria-label={`Switch to ${next} mode`}
                onClick={() => setColorScheme(next)}
              >
                <SchemeIcon dark={scheme === 'dark'} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Container>
    </Box>
  );
}


