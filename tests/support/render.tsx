import type { ReactElement, ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { cssVariablesResolver, theme } from '../../src/theme';

/**
 * The same providers `main.tsx` mounts, minus the notification host.
 *
 * A component rendered bare throws the moment it touches a Mantine primitive,
 * and one rendered under a default theme is not the component the app ships —
 * the theme is where our tokens become Mantine's scale keys.
 *
 * The router is here because a `<Link>` outside one throws, and the vehicle
 * card is a stretched link. Nothing under test drives navigation, so
 * `MemoryRouter` at its default entry is enough.
 */
function Providers({ children }: { children: ReactNode }) {
  return (
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      defaultColorScheme="light"
    >
      <MemoryRouter>{children}</MemoryRouter>
    </MantineProvider>
  );
}

/** Use in place of Testing Library's `render`. Same signature and return. */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
): RenderResult {
  return render(ui, { wrapper: Providers, ...options });
}

export * from '@testing-library/react';
