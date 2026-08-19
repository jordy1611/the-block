# The Block — buyer-side vehicle auction prototype

Frontend-only prototype. A buyer browses auction inventory, opens a vehicle,
and places bids. 200 vehicles, static dataset, no backend.

## Workflow

- One branch per phase, named for the work itself (`data-layer`, `inventory`,
  `bid-flow`), merged into `main` when the phase is done. **No pull requests** —
  merge locally. Fast-forward merges are fine; do not use `--no-ff`.
- **Git is the author's job.** Do not run `git commit`, `git merge`, `git branch`,
  `git checkout`, or `git push`. Leave finished work in the working tree and report
  what changed so he can stage and commit it himself.

## Commands

- `npm install`
- `npm run dev` — Vite dev server on **:8080** (pinned, `strictPort`)
- `npm run build`
- `npm run typecheck` — `tsc -b`
- `npm run lint` — oxlint (not eslint; that is what the Vite template ships now)

## Stack

React 19 + Vite 8 + TypeScript 6 · Mantine 9 (UI primitives) · React Router 8

## Structure

```
src/
  main.tsx              providers only — MantineProvider + Notifications
  App.tsx               app shell and routing
  theme.ts              maps styles/ tokens onto Mantine — holds no values itself
  index.css             base layer only — no colours, no sizes

  assets/               images and icons

  styles/               design tokens — the source of truth for every visual value
    colors.ts           palette (the only hex codes in the app) + light/dark roles
    fonts.ts            families, sizes, weights, line heights
    layouts.ts          spacing scale, radii, borders, named measurements
    constants.ts        motion, elevation, z-index, aspect ratios

  components/           shared across pages only
    common/             domain-agnostic — Money, EmptyState, SpecList
    layout/             AppLayout (Outlet host), Header, Footer, PageContainer
    vehicle/            shared domain — ConditionGrade, TitleBadge

  hooks/                shared React hooks
    useAsync.ts         runs a promise, returns { data, loading, error }

  pages/                one folder per route (the detail route is a modal)
    inventory/
      InventoryPage.tsx
      useVehicleSearch.ts   page-scoped hook — the RxJS search pipeline
      intersection.ts   shared observer registry for the grid
      components/       page-scoped — VehicleCard, SearchBar, VehiclePhotos,
                        VehicleImage, LoadMoreTrigger
    vehicle-detail/
      VehicleDetailModal.tsx   nested route — renders over the inventory grid
      components/       page-scoped — BidPanel, PhotoGallery
    not-found/
      NotFoundPage.tsx

  services/             anything that talks to the outside world
    http.ts             CRUD over fetch: latency, error flag, !res.ok, aborts
    vehicles.ts         loadVehicles(), loadVehicleById(), searchVehicles()

  store/                global client state
    bidStore.ts         observable store + useBids hook (Phase 4)

  types/                pure type declarations, no runtime code
    vehicle.ts          the Vehicle interface

  utils/                pure functions, no React, no I/O
    currency.ts         CAD formatting
    date.ts             auction date formatting
    odometer.ts         km formatting
    bidding.ts          displayBid(), minimumNextBid() — domain rules
    search.ts           inventory text matching

public/
  data/vehicles.json    the dataset, served and fetched at runtime
```

Where things go:

- **Colocate first.** A component used by one page lives in that page's
  `components/` folder — and so does a hook only that page uses. Promote to
  `src/components/` or `src/hooks/` only when a second page needs it. Do not
  pre-promote.
- `components/common/` is domain-agnostic — if it mentions a vehicle, it belongs
  in `components/vehicle/`.
- `types/` holds declarations only. If a file in `types/` emits JavaScript, it is
  in the wrong folder.
- `utils/` is pure functions. Anything touching fetch, storage, or React state is
  a service or a store, not a util.
- Components are `PascalCase.tsx`. Everything else is `camelCase.ts`. Any file
  containing JSX must be `.tsx`, not `.ts`.

**The vehicle card uses a stretched link, not an anchor wrapper.** The card is a
`div`; the vehicle name is the `Link`, and its `::after` covers the whole card so a
click anywhere navigates. Wrapping the card in an anchor would put the photo-carousel
buttons inside a link — invalid HTML, and confusing for keyboard and screen-reader
users. Anything that must stay clickable sits above it at `zIndex.cardControl`.

**Routing.** `App.tsx` holds `BrowserRouter` + `Routes`; `main.tsx` stays providers
only. Every route renders inside the `AppLayout` layout route, so the header mounts
once. Routes: `/` inventory, `/vehicle/:id` detail, `*` not-found. No data router —
loading goes through services and `useAsync`, so loaders would buy nothing.

**The detail view is a modal, not a page** — matching how OPENLANE presents a vehicle.
It is still a route: `/vehicle/:id` is nested *under* `/`, so `InventoryPage` renders
it through an `<Outlet />` and the grid stays mounted underneath. That is what makes
all of this fall out for free rather than needing to be wired:

- the card keeps a plain `<Link>`; nothing on it knows a modal exists
- a vehicle URL is shareable and deep-loads straight into the open modal
- Escape, the overlay, and the browser back button all close it
- closing returns to the same scroll position with the same batches rendered

Anything that would have been a page-level back action is the modal's close instead.

Mantine needs `postcss.config.cjs` at the root. Do not delete it.

## Data

- The dataset lives **only** at `public/data/vehicles.json`. The challenge shipped it
  at `data/vehicles.json`; it was moved rather than copied so there is one source of
  truth instead of two identical 288KB files.
- Loaded async via `fetch('/data/vehicles.json')` in `src/services/vehicles.ts`.
  **Never static-import the JSON.** It is a 288KB asset deliberately kept out of
  the bundle, and the async boundary is what gives us real loading/error states.
- `current_bid` is null on 112 of 200 vehicles. Always read bids through
  `displayBid()` (`current_bid ?? starting_bid`). Never render `current_bid` directly.
- `buy_now_price` and `reserve_price` are frequently null — conditional render only.
- `damage_notes` can be an empty array — render "No damage reported".
- **Auction dates are authored, not generated.** `auction_start` on all 200 lots was
  randomized across **2026-08-16 to 2026-09-04**, hours drawn from the generator's
  own 09:00-20:00 window. The range deliberately straddles today so some lots are
  live and most are scheduled — `isBiddingActive` has nothing to show otherwise.
- **Do not re-run `scripts/generate_vehicles.mjs` to refresh dates.** It only emits
  dates 1-7 days in the *future*, so it would erase every live lot. Re-randomize
  the existing file instead, keeping part of the range in the past. The brief
  explicitly allows normalizing these timestamps.
- `auction_start` carries no timezone (`2026-08-19T09:00:00`), so `new Date()`
  parses it as **local** time. Keep it that way; do not append `Z`.

## Async conventions

- `async/await` is the house style. **Services return Promises, not Observables.**
- Components never call `fetch` or a service directly — they go through
  `useAsync(factory, key)`, which owns the loading/error/success state.
- `loadVehicles()` caches the promise, so the 288KB dataset is fetched once for
  the whole app. A rejection clears the cache so a retry actually retries.
- That shared promise takes **no AbortSignal** on purpose: one component
  unmounting must not cancel the load for everyone else. `useAsync` discards the
  result via a `cancelled` flag instead. `http` still accepts a signal for any
  request that is not shared.
- Artificial latency is ~300ms, in one place. The error path is triggered by an
  explicit flag (`?simulateError`) — never a random failure rate.
- `IntersectionObserver` does two jobs in the inventory grid: image lazy-loading
  and progressive card rendering (24 at a time). One observer per rootMargin
  watches every target — `pages/inventory/intersection.ts` — never one per card.

**RxJS is scoped to the two places it beats hand-rolled code.** Inventory search
uses `debounceTime` + `distinctUntilChanged` + `switchMap` in
`pages/inventory/useVehicleSearch.ts`; the bid store will use a
`BehaviorSubject` (Phase 4). Do not reach for it anywhere else — a single cached
GET gains nothing from it. `searchVehicles()` returns a Promise like every other
service; the pipeline wraps it, the service does not know RxJS exists.

## Styling

`src/styles/` is the source of truth for every visual value in the app. Nothing
else in the repo holds a literal colour, size, or measurement.

The chain runs one direction only:

```
styles/*.ts  →  theme.ts  →  Mantine CSS variables  →  components
```

- **`styles/`** holds the values and nothing else — no React, no logic.
  `colors.ts` splits into two layers: `palette` (hex codes named for appearance,
  `offWhite`, `graphite`) and `lightColors`/`darkColors` (roles named for the job,
  `surface`, `textSecondary`, `gradeHigh`). Roles are typed so both schemes must
  define every one.
- **`theme.ts`** is the only file that imports `styles/`. It maps tokens onto
  Mantine's theme — colours, `fontSizes`, `headings`, `spacing`, `radius`,
  component defaults — and invents nothing. A value that appears in `theme.ts`
  and not in `styles/` is a bug.
- **Components** consume the result through Mantine props (`c="dimmed"`, `p="md"`,
  `fz="sm"`) and `var(--mantine-*)` in CSS modules. A Mantine scale key *is* a
  token reference, because the scale is generated from ours.
- Import from `styles/` directly only for what Mantine's theme cannot express —
  `layout.cardPadding`, `aspectRatio.photo`, `zIndex.header`, `iconSize.md`.
  **Never import `palette` into a component**: a component holding a hex renders
  the same colour in both schemes, which is the bug the two-layer split exists to
  prevent.
- **`--app-*` variables are how tokens reach CSS.** A `*.module.css` cannot import
  TypeScript, so `cssVariablesResolver` in `theme.ts` emits the semantic roles —
  `--app-surface`, `--app-brand`, `--app-duration-fast`, `--app-hover-lift` — and
  swaps them per colour scheme. It also repoints Mantine's own
  `--mantine-color-body`, `-text`, `-dimmed`, and `-default-border` at our roles,
  so `c="dimmed"` and a bordered `Card` resolve to tokens with no component
  changes. Add a variable there rather than a literal in a stylesheet.

Rules:

- No hex code outside `styles/colors.ts`.
- No literal `px`/`rem` in a component or a `*.module.css`. If a measurement is
  missing, add it to `styles/layouts.ts` and use it from there.
- No ad-hoc font size or weight. Every size is a `fontSize` role; there are three
  weights (`regular`, `semibold`, `bold`) and no fourth.
- Behaviour tuning is not a style token. `IntersectionObserver` root margins and
  the batch size live with the code that owns them, not in `styles/`.
- **Prefer the role to the scale.** `layout.cardPadding` says why the value is 16px;
  `space.md` only says how big it is. Reach for `space` when composing something
  new, the named role when one exists.
- Palette names describe appearance, role names describe the job. If a name in
  `colors.ts` layer 2 mentions a colour, it is in the wrong layer.

## Components

- **Primitives come from Mantine.** Do not hand-roll buttons, inputs, modals,
  badges, or skeletons. `components/common/` is for composing them, not replacing them.
- **Domain components are ours.** Page-scoped ones colocate under that page;
  shared ones (`ConditionGrade`, `TitleBadge`) live in `components/vehicle/`.
- Never format a number inline — money and odometer go through `utils/`, and
  every dollar figure renders through `<Money />`.
- Never hardcode a colour, size, or spacing value — see **Styling** above.
  Component-level CSS belongs in a colocated `*.module.css`, using
  `var(--mantine-*)` rather than literals.
- Page width comes from the theme's `Container` default, which comes from
  `layout.containerMaxWidth`. Pages do not set it.

## State

Bid state is the only global state. It lives in `store/bidStore.ts` as a plain
observable — a `Set` of listeners, `subscribe`, `getSnapshot`, `placeBid` —
consumed through React's built-in `useSyncExternalStore`.

No Redux, no Zustand. One slice of state does not justify a state library, and a
hand-rolled store is ~40 lines we can explain line by line. Server data is not
global state: it is fetched per page through `services/`.

## Domain rules

- Minimum next bid = current bid + $100.
- `condition_grade` is a 5-point scale — render as "3.8 / 5" wherever there is room.
  The one exception is the chip over the card photo, which drops the denominator
  (`showScale={false}`) because the colour band carries the comparison there and
  the space does not allow more. The detail view always shows the full form.
- `salvage` and `rebuilt` titles are visually flagged by `TitleBadge`. Buyer trust
  signal, keep it — it lives on the detail view, having been taken off the card to
  keep that surface to one glance's worth of information.
- **`isBiddingActive(vehicle)`** (`utils/bidding.ts`) decides whether a lot is open
  or scheduled, from `auction_start` against now. Evaluated per render, not on a
  ticker — a lot crossing its start time with the page open waits for the next
  navigation. Distinct from `hasBids`: a lot can be open with nobody having bid.
- **Countdowns use one shared ticker** at the app level, never one interval per
  card — 200 cards means 200 intervals otherwise. Same rule for observers.
  Cards show coarse granularity (`3d 4h`); only the detail view counts seconds.
  Always handle the elapsed case; never render negative time.
- **The grid renders 24 cards at a time.** All 200 at once is a 235ms long task.
  The count in the page description is the match count, not the rendered count.

## Deliberately not built

No auth, seller workflows, checkout, payments, or backend.
