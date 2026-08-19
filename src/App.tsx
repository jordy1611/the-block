import { BrowserRouter, Route, Routes } from 'react-router';

import { AppLayout } from './components/layout/AppLayout';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { NotFoundPage } from './pages/not-found/NotFoundPage';
import { VehicleDetailModal } from './pages/vehicle-detail/VehicleDetailModal';

/**
 * App shell and routing. One page, a nested modal route, and a catch-all.
 *
 * Everything hangs off a single layout route so the header is mounted once for
 * the life of the app rather than re-rendered per page. `BrowserRouter` over
 * `createBrowserRouter`: there are no loaders or actions to declare here — data
 * loading goes through services and `useAsync` — so the data router's extra API
 * would buy nothing.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          {/* The detail view is a nested route, so it renders *inside* the
              inventory page as a modal rather than replacing it. The grid stays
              mounted underneath, keeping its scroll position and rendered
              batches, and a vehicle URL stays shareable. */}
          <Route path="/" element={<InventoryPage />}>
            <Route path="vehicle/:id" element={<VehicleDetailModal />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

