import { Box } from '@mantine/core';
import { Outlet } from 'react-router';

import { Footer } from './Footer';
import { Header } from './Header';

/**
 * The shell every route renders inside. Held as a layout route so the header
 * mounts once and survives navigation — no remount, no flash between pages.
 */
export function AppLayout() {
  return (
    <Box mih="100%" display="flex" style={{ flexDirection: 'column' }}>
      <Header />
      <Box component="main" style={{ flex: 1 }}>
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
}

