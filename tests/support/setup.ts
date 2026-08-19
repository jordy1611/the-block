import '@testing-library/jest-dom/vitest';

/**
 * jsdom ships neither of these, and Mantine uses both — `useMediaQuery` behind
 * its responsive props, and ResizeObserver inside ScrollArea and Popover. Left
 * out, every component test that touches a Mantine primitive fails on the
 * environment rather than on the component.
 *
 * `matchMedia` always answers "no match", which pins tests to the base
 * breakpoint. That is the widest-reaching layout and the one worth asserting on.
 */
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})) as typeof window.matchMedia;

window.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

/**
 * IntersectionObserver is deliberately *not* stubbed. jsdom does not implement
 * it, and `VehicleImage` treats its absence as "load the photo immediately" —
 * the same fallback older browsers get. Stubbing it would leave every card in
 * a test rendering an empty frame, since nothing in jsdom ever intersects.
 */
