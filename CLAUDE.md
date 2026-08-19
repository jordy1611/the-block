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
- `npm test` — Vitest once, with a coverage table
- `npm run test:watch` — Vitest in watch mode, no coverage

## Stack

React 19 + Vite 8 + TypeScript 6 · Mantine 9 (UI primitives) · React Router 8

## Structure

```
src/
  main.tsx              providers only — MantineProvider + Notifications
  App.tsx               app shell and routing
  theme.ts              maps styles/ tokens onto Mantine — holds no values itself
  index.css             base layer only — no colours, no sizes

  assets/               Vite template leftovers, unreferenced — safe to delete

  styles/               design tokens — the source of truth for every visual value
    colors.ts           palette (the only hex codes in the app) + light/dark roles
    fonts.ts            families, sizes, weights, line heights
    layouts.ts          spacing scale, radii, borders, named measurements
    constants.ts        motion, elevation, z-index, aspect ratios

  components/           shared across features only
    common/             Money, EmptyState, SpecList, FieldLabel, CopyText,
                        ConditionGrade, TitleBadge
    layout/             AppLayout (Outlet host), Header, Footer, PageContainer

  hooks/                shared React hooks
    useAsync.ts         runs a promise, returns { data, loading, error }

  features/             one folder per feature; each owns its route
    inventory/
      InventoryPage.tsx
      useVehicleSearch.ts   feature-scoped hook — the RxJS search pipeline
      intersection.ts   shared observer registry for the grid
      components/       feature-scoped — VehicleCard, SearchBar, VehiclePhotos,
                        VehicleImage, LoadMoreTrigger
    vehicle-detail/
      VehicleDetailModal.tsx   nested route — renders over the inventory grid
      components/       feature-scoped — VehicleDetailBody, PhotoGallery,
                        VehicleFacts, BidBar, BidModal, BidServices,
                        PaymentMethodField, BuyoutModal
    not-found/
      NotFoundPage.tsx

  services/             anything that talks to the outside world
    http.ts             CRUD over fetch: latency, error flag, !res.ok, aborts
    vehicles.ts         loadVehicles(), loadVehicleById(), searchVehicles()
    bidding.ts          placeBid(), loadPaymentMethods()

  store/                global client state — empty until the bid store lands

  types/                pure type declarations, no runtime code
    vehicle.ts          the Vehicle interface
    bid.ts              BidRequest, BidReceipt, BidService, PaymentMethod,
                        BidUpdate (declared for the update feed, unused)

  utils/                pure functions, no React, no I/O
    currency.ts         CAD formatting
    date.ts             auction date formatting
    odometer.ts         km formatting
    bidding.ts          displayBid(), minimumNextBid(), the fee schedule —
                        domain rules
    search.ts           inventory text matching

public/
  data/vehicles.json    the dataset, served and fetched at runtime

tests/                  the test tree — mirrors src/, see Testing below
  support/              setup, render helper, vehicle fixture factory
  components/           happy-path component tests

vite.config.ts          also holds the mock API — see Data below
vitest.config.ts        test config, separate on purpose — see Testing below
tsconfig.test.json      third project reference, so tests typecheck too
```

Where things go:

- **Colocate first.** A component used by one feature lives in that feature's
  `components/` folder — and so does a hook only that feature uses. Promote to
  `src/components/` or `src/hooks/` only when a second feature needs it. Do not
  pre-promote.
- **`features/`, not `pages/`.** A folder here owns a slice of the product, not a
  URL: `vehicle-detail` renders as a modal over the inventory grid rather than as
  a page of its own, and `inventory` owns a hook, an observer registry, and six
  components besides its route. Naming the folder after the route was already
  inaccurate.
- `components/common/` holds everything shared across features, domain or not.
  There was a `components/vehicle/` tier for shared domain components; it never
  held more than two files, and "is this domain enough" is a question with no
  useful answer at this size. One shared folder, one rule: used by one feature it
  colocates, used by two it moves to `common/`.
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
- **Bids do not come from the dataset. They go to a mock API in `vite.config.ts`.**
  `GET /api/payment-methods` and `POST /api/bids`, served as dev-server middleware
  (and preview-server middleware, so `npm run preview` works too). It exists
  because inventory is a static asset a GET happens to work against, while a POST
  to a static path is a 404 — and the alternative, a service that fakes its own
  response, would leave the app's one write path as the only one never exercising
  `http.ts`. The middleware is stateless and deliberately dumb: it checks the
  shape of the body and returns a receipt. Every domain rule stays client-side in
  `utils/bidding.ts` where it can be read and tested.
- **`http.ts` discards the mock API's error bodies.** It throws
  `HttpError(status, url, "POST /api/bids failed with 400")`, so a specific server
  message like "Unknown payment method" never reaches the buyer. Fixing it means
  parsing the JSON body in `http.ts`'s `!response.ok` branch, which changes error
  copy everywhere — worth doing, not worth doing quietly.

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
  watches every target — `features/inventory/intersection.ts` — never one per card.

**Bidding is two channels, not one.** `placeBid` is a POST and stays one once the
feed lands. They are different things: the POST is this buyer asking the auction
to take an amount, and it needs a request/response pair — an acknowledgement, a
receipt id, an error the form can render beside the field that caused it. A push
channel has nowhere to put any of that; submitting over it would turn every
validation failure into a message that arrives, if it arrives, with no way to tie
it to the submit that caused it. So `BidReceipt.status` is `accepted` and never
"winning": whether a bid still stands is a broadcast every watcher of the lot
sees, and reading it out of one buyer's POST response would give them a different
answer to everyone else's. The rest of Phase 4 adds `GET /api/bids/stream` (SSE) to the mock
API and `subscribeToBidUpdates` to `services/bidding.ts` — a callback and an
unsubscribe, because that is what a `BehaviorSubject` in `store/bidStore.ts`
wants to be fed by. The store owns the RxJS, the service owns the `EventSource`,
and neither needs to know about the other's.

**RxJS is scoped to the two places it beats hand-rolled code.** Inventory search
uses `debounceTime` + `distinctUntilChanged` + `switchMap` in
`features/inventory/useVehicleSearch.ts`; the bid store will use a
`BehaviorSubject`. Do not reach for it anywhere else — a single cached
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
- **Domain components are ours.** Feature-scoped ones colocate under that feature;
  shared ones (`ConditionGrade`, `TitleBadge`, `Money`) live in
  `components/common/`.
- Never format a number inline — money and odometer go through `utils/`, and
  every dollar figure renders through `<Money />`.
- Never hardcode a colour, size, or spacing value — see **Styling** above.
  Component-level CSS belongs in a colocated `*.module.css`, using
  `var(--mantine-*)` rather than literals.
- Page width comes from the theme's `Container` default, which comes from
  `layout.containerMaxWidth`. Pages do not set it.
- **`cursorType: 'pointer'` is set app-wide in `theme.ts`.** Mantine ships
  checkboxes, radios, and switches with the default arrow, which makes a tick box
  read as static text. Disabled ones still get `not-allowed`, which Mantine
  handles on its own.

## State

Bid state will be the only global state. It goes in `store/bidStore.ts` as a plain
observable — a `Set` of listeners, `subscribe`, `getSnapshot`, `placeBid` —
consumed through React's built-in `useSyncExternalStore`.

No Redux, no Zustand. One slice of state does not justify a state library, and a
hand-rolled store is ~40 lines we can explain line by line. Server data is not
global state: it is fetched per feature through `services/`.

## Domain rules

- Minimum next bid = current bid + $100.
- **A bid must also land on the increment.** Every bid in the dataset is already a
  multiple of $100, so a $14,650 bid is not a rounding artefact — it is someone
  typing over the field. `isValidBid` checks the floor and `isOnIncrement` checks
  the step; the form reports them separately because "too low" and "not a round
  step" are different mistakes with different fixes.
- **The max bid is optional and may equal the bid.** Only a maximum *below* the
  bid is rejected — it asks the auction to proxy up to less than what was just
  offered. Leaving it blank and setting it equal to the bid mean the same thing.
- **The fee schedule is derived, not fetched** (`utils/bidding.ts`). The dataset
  has no fee fields, so every number is invented either way; inventing it as a
  pure function of the bid and the province means two buyers looking at the same
  lot are quoted the same thing, and there is one file to point at when someone
  asks where $145 came from. The guarantee is banded by price rather than a
  percentage — arbitrating a claim costs about the same on a $9,000 hatchback as
  a $40,000 truck. Transport is quoted per province: 30-odd cities with no
  coordinates would be 30 invented numbers pretending to be a distance
  calculation. A real quote endpoint replaces three functions and nothing above
  them changes.
- **A service with `requires` cannot be selected without its parent**, and
  unticking the parent takes it with it. Enforced in `BidServices`, not in the
  form, so no caller can produce a selection the schedule prices and the auction
  would refuse.
- `condition_grade` is a 5-point scale — render as "3.8 / 5" wherever there is room.
  The one exception is the chip over the card photo, which drops the denominator
  (`showScale={false}`) because the colour band carries the comparison there and
  the space does not allow more. The detail view always shows the full form.
- **The reserve price is never rendered.** `reserveStatus()` returns met / not-met /
  none; the figure is the seller's private floor, and publishing it tells every buyer
  exactly what to bid. `reserve_price` is null on 60 of 200, which is its own state.
- `salvage` and `rebuilt` titles are visually flagged by `TitleBadge`. Buyer trust
  signal, keep it — it lives on the detail view, having been taken off the card to
  keep that surface to one glance's worth of information.
- **`isBiddingActive(vehicle)`** (`utils/bidding.ts`) decides whether a lot is open
  or scheduled, from `auction_start` against now. Evaluated per render, not on a
  ticker — a lot crossing its start time with the page open waits for the next
  navigation. Distinct from `hasBids`: a lot can be open with nobody having bid.
- **There are no countdowns.** Auction timing renders as an absolute local time
  ("Starts Aug 28, 4:00pm" on the card, with the weekday in the modal). A live
  countdown was considered and dropped: it needs one app-level ticker to avoid 200
  intervals, an elapsed case, and a negative-time guard — real work that tells a
  buyer nothing the timestamp does not. If it comes back, one shared ticker, never
  one interval per card. Same rule as the observers.
- **Label case in the bid form: bold labels are Title Case, dimmed ones are not.**
  Field labels and section headings ("Bid Amount", "Payment Method", "Total if
  You Win") take Title Case; the small uppercase `FieldLabel` and every dimmed
  helper line keep sentence case. Two registers, one rule each.
- **"Current bid" vs "Starting bid" turns on `isBiddingActive`, never on
  `hasBids`.** Once a lane is open the starting bid *is* the current bid — it is
  the number a buyer has to beat right now — so a live lot with no bids still
  reads "Current bid". Before it opens there is no current bid to speak of, and
  the label says "Starting bid". The value is always `displayBid()`.

  One rule, three surfaces: `VehicleCard`, `BidBar`, and the bid form's headline
  (which is unconditionally "Current Bid", being reachable only on a live lot).
  How contested a lot is rides on the bid count instead — "Current bid" over
  "No bids yet" says both things without either one lying. That is what `hasBids`
  is still for.
- **Buyout is gated exactly like bidding.** The `Buy now` button renders only
  where `buy_now_price` is non-null (39 of 200) and is disabled whenever
  `isBiddingActive` is false, sharing the "Opens …" caption with `Place bid`.
  Real auctions often open buy-now *before* the lane does, but no rule in the
  brief or the dataset says so, and inventing a second timing rule to sit beside
  `isBiddingActive` is not something to do quietly. Bidding keeps the filled
  button and buyout takes the default variant: it is the way out of the auction,
  not the way through it.
- **The grid renders 24 cards at a time.** All 200 at once is a 235ms long task.
  The count in the page description is the match count, not the rendered count.

## Testing

Vitest + Testing Library, jsdom environment. Config is `vitest.config.ts` at the
root — **not** `vite.config.ts`, which carries the mock API plugin; a unit test
should never start a server. CSS is left unprocessed, so a `*.module.css` import
resolves to a proxy and a PostCSS pass per file is skipped.

```
tests/
  support/
    setup.ts      matchMedia + ResizeObserver polyfills, jest-dom matchers
    render.tsx    renderWithProviders — MantineProvider + MemoryRouter
    vehicle.ts    makeVehicle() factory, LIVE_/SCHEDULED_AUCTION_START
  components/     mirrors src — common/, inventory/, vehicle-detail/
```

- **Tests live outside `src/`**, in `tests/`, mirroring the source tree. The
  colocation rule in **Structure** governs the app; tests are their own tree so
  the shipped folders stay exactly what ships.
- **`tests/` is typechecked.** `tsconfig.test.json` is a third project reference
  off the root tsconfig, so `npm run typecheck` covers tests as well as `src`
  and `vite.config.ts`. A test that does not compile fails the same command a
  component that does not compile fails.
- **Scope is deliberate and narrow: happy-path component rendering.** No page
  tests, no service tests, no UI regression suite — the app was verified in the
  browser, and a prototype does not earn a second verification layer. What these
  cover is that a component still renders the right thing from the right props:
  the bid label switching on `isBiddingActive`, buyout appearing only where
  `buy_now_price` is non-null, the reserve rendering as a status and never as a
  figure. Those are the domain rules most likely to be broken by a refactor.
- **Never write a literal `auction_start` in a fixture.** `isBiddingActive`
  compares it against `new Date()`, so a hardcoded date silently changes meaning
  as the calendar moves. Use `LIVE_AUCTION_START` / `SCHEDULED_AUCTION_START`
  from `tests/support/vehicle.ts`, which are offsets from now in the dataset's
  own zoneless local format.
- **Render through `renderWithProviders`**, not Testing Library's `render`. A
  Mantine primitive throws without its provider, and a component under a default
  theme is not the component that ships — `theme.ts` is where our tokens become
  Mantine's scale keys.
- **`IntersectionObserver` is deliberately not polyfilled.** `VehicleImage`
  treats its absence as "load immediately", which is the fallback path real old
  browsers get; stubbing it would leave every card in a test showing an empty
  frame, because nothing in jsdom ever intersects.
- Assert on text and roles, never on class names or styling. The styling chain
  is tokens through theme through CSS variables, and none of it survives into a
  jsdom assertion worth writing.
- Coverage is v8, reported as a text table plus `coverage/index.html`
  (gitignored). The number is low by design and is not a gate — there is no
  threshold configured, and adding one would only invite tests written for the
  metric.
- `.oxlintrc.json` turns `react/only-export-components` off under `tests/`. The
  rule exists to protect Vite fast refresh, which does not apply to a test
  helper that exports a wrapper component beside a render function.

## Deliberately not built

No auth, seller workflows, checkout, payments, or backend.

Visible in the UI but deliberately inert, so nobody mistakes them for bugs:

- **The heart on a vehicle card.** A watchlist needs somewhere to persist and a
  place to read it back; neither is in scope. It is a visual affordance only.
- **Live countdowns.** See the domain rules above.
- **"Add new payment method"** in the bid form. Adding one means collecting a
  card number, and there is no backend to send it to and no reason to hold it.
  The line is present so the section matches the real product; it is plainly not
  a control, and its tooltip says why.
- **The bid you just placed changing the page behind it.** `placeBid` returns an
  acknowledgement, not a bid state. Where the lot stands afterwards arrives on the
  update channel, which is the rest of Phase 4 — see **Async conventions** above.
- **The Buyout button inside `BuyoutModal`.** The dialog is a shell: Cancel
  closes, Buyout does nothing. Taking a lot at its buy-now price ends the auction
  for everyone watching it, so it needs what a bid needs — a POST, a receipt, and
  the update channel to tell the other bidders the lot is gone. Wiring it to
  merely close the dialog would be worse than leaving it inert, because a dialog
  that dismisses itself reads as a purchase that went through.
