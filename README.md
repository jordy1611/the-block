# The Block

**A buyer-side vehicle auction prototype.** Browse 200 live and scheduled lots,
open one, read its condition and specs, and place a bid against a mock auction API.

Frontend-only: no backend, no database, no accounts, no environment variables.
Built for OPENLANE's coding challenge — the original brief is preserved verbatim
in [`docs/CHALLENGE.md`](docs/CHALLENGE.md).

---

## Run it

### What you need

| | Version | Notes |
|---|---|---|
| **Node.js** | **22.22 or newer** | 24 LTS recommended. Developed on 24.15.0. |
| **npm** | 10 or newer | Ships with Node. Developed on 11.12.1. |
| Anything else | — | Nothing. No database, no API keys, no `.env`, no global CLI. |

The 22.22 floor is not arbitrary: React Router 8 declares `engines.node >= 22.22.0`,
and Vite 8 declares `^20.19.0 || >=22.12.0`. The higher of the two wins. On an
older Node the install will warn and the dev server will fail in ways that look
like application bugs but are not.

Check yours before anything else:

```bash
node --version
```

### Three commands

```bash
git clone https://github.com/jordy1611/the-block.git
```

```bash
cd the-block && npm install
```

```bash
npm run dev
```

Then open **<http://localhost:8080>**.

That is the whole setup. `npm install` reads `package-lock.json`, pulls roughly
180 packages into `node_modules/`, and takes about 10-20 seconds on a warm cache.
Nothing is installed globally and nothing is written outside the project folder.

**The port is pinned.** `vite.config.ts` sets `strictPort: true`, so if 8080 is
already in use Vite exits with `Port 8080 is already in use` instead of quietly
moving to 8081. That is deliberate — a predictable URL matters more here than a
server that always starts. Free the port and run it again.

### What actually gets installed

Eight direct runtime dependencies. Everything else in `node_modules` is
transitive or build tooling.

| Package | Why it is here |
|---|---|
| `react`, `react-dom` | v19. The UI. |
| `react-router` | v8. Three routes, one of which renders as a modal over another. |
| `@mantine/core` | v9. UI primitives — buttons, inputs, modals, badges, skeletons. Themed, never hand-rolled. |
| `@mantine/hooks` | `useClipboard`, `useDisclosure`, and friends. |
| `@mantine/form` | The bid form's validation and uncontrolled-input mode. |
| `@mantine/notifications` | Mantine's notification host, mounted in `main.tsx`. |
| `rxjs` | Scoped to exactly one place: the debounced inventory search pipeline. |

Dev tooling: Vite 8, TypeScript 6, oxlint, Vitest 4 + Testing Library + jsdom,
PostCSS (Mantine requires `postcss.config.cjs` at the root — do not delete it).

### Every command in the project

| Command | What it does |
|---|---|
| `npm install` | Install dependencies. Run once. |
| `npm run dev` | Vite dev server on **:8080**, with the mock API attached. Runs until you stop it. |
| `npm run build` | Typecheck, then production build into `dist/`. |
| `npm run preview` | Serve the production build on **:8080**, mock API still attached. |
| `npm run typecheck` | `tsc -b` across `src/`, `vite.config.ts`, and `tests/`. |
| `npm run lint` | oxlint. Not eslint — that is what the Vite template ships now. |
| `npm test` | Vitest once, with a coverage table. |
| `npm run test:watch` | Vitest in watch mode, no coverage. |

---

## Running it as an agent

Everything above works headlessly, with three things worth knowing up front.

**1. `npm run dev` never exits.** It is a long-running server, not a task. Start
it detached and poll for readiness rather than waiting on the process:

```bash
npm ci && (npm run dev &) && until curl -sf -o /dev/null http://localhost:8080/; do sleep 1; done && echo READY
```

`npm ci` over `npm install`: it installs the lockfile exactly and fails instead
of silently resolving a newer version.

**2. Port 8080 is strict.** If the server exits immediately, check whether the
port is already held before assuming a build failure:

```bash
curl -sf -o /dev/null -w '%{http_code}\n' http://localhost:8080/ || echo "nothing listening"
```

**3. The app is verifiable without a browser.** The dataset is a served static
asset and the bid endpoints are real dev-server middleware, so `curl` exercises
the same paths the UI does:

```bash
curl -s http://localhost:8080/data/vehicles.json | head -c 200
```

```bash
curl -s http://localhost:8080/api/payment-methods
```

```bash
curl -s -X POST http://localhost:8080/api/bids -H 'Content-Type: application/json' -d '{"vehicleId":"d24341b6-2fb4-45dd-9b06-ce0077c783c4","amount":5100,"maxAmount":null,"notes":"","services":[],"paymentMethodId":"pm_visa_4242"}'
```

Expect, in order: a JSON array of 200 vehicles (~288KB), three saved payment
methods, and a `201` receipt with `"status":"accepted"`. A bad `paymentMethodId`
returns `400` — that is the mock API validating the body shape, not domain logic.
Every real auction rule lives client-side in `src/utils/bidding.ts`.

**Checks that exit on their own**, with meaningful exit codes and no server
needed — prefer these when the goal is verification rather than a demo:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

**Stop the server** when finished — it holds port 8080 until it exits. Kill the
process you started if you still have its handle; otherwise kill by port, which
is targeted rather than killing every Node process on the machine:

```bash
pkill -f "vite"
```

```powershell
Get-NetTCPConnection -LocalPort 8080 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

**Repo context for agents:** [`CLAUDE.md`](CLAUDE.md) is the committed context
file — structure, conventions, domain rules, and the reasoning behind each. It is
loaded automatically by Claude Code and is the single best file to read before
changing anything. [`docs/DECISIONS.md`](docs/DECISIONS.md) is the append-only log
of why things are the way they are.

---

## A three-minute tour

Once it is running, this is the path through the product:

1. **The grid.** 200 lots, rendered 24 at a time as you scroll, with photos
   requested 300px before they enter the viewport. The count above it is the
   match count, not the rendered count.
2. **Search.** Try `mazda cx-5`, `2023 ford`, or a lot number like `A-0043`.
   Every token has to match — it narrows, never widens. Punctuation is ignored,
   so `cx-5`, `cx5`, and `CX 5` are one query. VIN matching needs six characters
   or more, because a 17-character random string collides with everything shorter.
3. **Live versus scheduled.** Lots whose start time has passed are open for
   bidding and carry a slowly breathing brand-coloured border; 25 of the 200 are
   open as of writing, and more cross their start as the window passes. Scheduled
   lots show "Starts Aug 28, 4:00pm" and their bid buttons are disabled with the
   same caption.
4. **A vehicle.** Click any card. The detail view is a modal over the grid at
   `/vehicle/:id` — a real, shareable route, so Escape, the overlay, and the back
   button all close it and return you to the exact scroll position. Photo gallery
   on the left, above a collapsed accordion of specifications, condition, and
   damage notes; odometer, location, timing, seller, lot, and a click-to-copy VIN
   run down the narrower right column, ending in the money and the buttons.
5. **The bid flow.** This lot is live and has a buy-now price, so both buttons
   are enabled: **<http://localhost:8080/vehicle/d24341b6-2fb4-45dd-9b06-ce0077c783c4>**
   (2016 Kia Forte, lot A-0043). "Place bid" opens a form prefilled to the
   minimum next bid, with an optional proxy maximum, optional buyer services that
   price off the lot, a payment method, and a running total. Try `5150` to see
   the increment rule reject it separately from the floor rule. On success the
   form is replaced by a receipt with a reference id.
6. **The error path.** Append `?simulateError` to any URL to make the HTTP layer
   fail. Every load has a real error state with a retry. It is a flag, never a
   random failure rate — a mock that fails on a percentage eventually fails
   during someone else's evaluation, and they will not know it was intentional.
7. **Dark mode and mobile.** Toggle in the header; both schemes are token-defined
   and typechecked for parity. The layout is built at 375px, 768px, and 1280px.

---

## What I built

- **Inventory browsing** — a responsive card grid, 1 to 4 columns, with skeletons
  that mirror the card's layout so nothing reflows when data lands, a real error
  state with retry, a hand-rolled photo carousel per card, and an empty state.
- **Search** — debounced, tokenised, matching year, make, model, trim, lot, and
  VIN, with a live match count.
- **Vehicle detail** — a modal route with a photo gallery, full spec sheet,
  condition report and damage notes, title status, selling dealership,
  click-to-copy VIN and lot, auction timing, and reserve status.
- **A bid flow** — floor and increment validation, an optional proxy maximum,
  priced buyer services with a dependency rule, payment method selection off a
  fetched list, a running total, and a receipt.
- **A mock API** — `GET /api/payment-methods` and `POST /api/bids`, served as
  dev-server and preview-server middleware from `vite.config.ts`.
- **A design token system** — `src/styles/` is the single source of every colour,
  size, and measurement in the app, mapped onto Mantine's theme in one file.
- **Tests** — 22 happy-path component tests under `tests/`, typechecked with the
  rest of the project.

## Stack

**React 19 + Vite 8 + TypeScript 6.** Suggested in the brief, fastest path to a
running app, and types pay for themselves against a 29-field record with several
nullable numeric fields.

**Mantine 9** over shadcn/ui and MUI. shadcn copies component source into the
repo, which is a liability in a walkthrough where any file is fair game to
explain — Mantine stays a clear dependency. MUI would make the app look like
Material, and visual intent is graded. Mantine also ships the skeletons, form
validation, and modals this app actually needs.

**React Router 8**, `BrowserRouter` rather than the data router: loading goes
through services and a hook, so loaders would buy nothing.

**RxJS**, installed but scoped to one file. See the decisions below.

## Architecture

```
src/
  features/     one folder per product slice, each owning its route
  components/   common/ (shared across features) and layout/
  services/     everything that talks to the outside world
  utils/        pure functions — formatters and domain rules
  styles/       design tokens: the source of truth for every visual value
  theme.ts      the only file that imports styles/, maps them onto Mantine
```

Three ideas carry most of the weight:

**The data boundary is genuinely async.** `public/data/vehicles.json` is fetched,
never imported. A static import would bundle 288KB of JSON into the JS; a real
request produces a real network entry and a real `!res.ok` error path; and
pointing at a live API later is a one-file change. Components never call `fetch`
— they go through `useAsync(factory, key)`, which owns loading, error, and
success state.

**The styling chain runs one direction.** `styles/*.ts` → `theme.ts` → Mantine
CSS variables → components. No hex code exists outside `styles/colors.ts`, and no
literal `px` value exists in a component. Both colour schemes are typed against
each other, so adding a role to one and forgetting the other is a compile error.

**The detail view is a modal that is still a route.** `/vehicle/:id` is nested
under `/`, so the inventory page renders it through an `<Outlet />` and the grid
stays mounted underneath. Shareable URLs, back-button close, and an unchanged
scroll position all fall out of that rather than needing to be wired.

Full conventions and the reasoning behind them are in [`CLAUDE.md`](CLAUDE.md).

## Notable decisions

The complete log is [`docs/DECISIONS.md`](docs/DECISIONS.md), written as decisions
were made rather than reconstructed afterwards. The ones worth reading first:

- **The reserve price is never rendered — only its status.** "Reserve met" is the
  part that changes a buyer's decision; the figure is the seller's private floor,
  and printing it tells every buyer exactly what to bid. Null on 60 of 200 lots is
  a third state, not a missing value.
- **"Current bid" versus "Starting bid" turns on whether the lane is open, not on
  whether anyone has bid.** Over half the inventory has no bids. Labelling a
  starting price as a current bid says something untrue about demand. How
  contested a lot is rides on the bid count beside it.
- **Auction timestamps were re-randomized across a window straddling today.** The
  committed dataset was generated around 2026-03-30 with dates 1-7 days out, so
  every lot read months in the past. The brief explicitly permits normalizing
  them. The straddle is the point: with every lot in the future, the live state is
  unreachable in a demo.
- **Cards render 24 at a time.** Mounting all 200 produced a measured 235ms long
  task — a visible freeze every time the list re-rendered. Progressive rendering
  off the observer already in the page, not a windowing library: thirty lines, no
  dependency, and scrolling stays the browser's.
- **The card is a stretched link, not an anchor wrapper.** The photo arrows are
  real buttons; nesting buttons inside an anchor is invalid HTML and behaves badly
  for keyboard and screen-reader users.
- **RxJS was adopted, reverted, then scoped.** The data layer was built on it and
  taken back off: for a single cached GET, `fromFetch` + `shareReplay` bought
  nothing that `async/await` and a cached promise do not. It stays for search,
  where `debounceTime` + `distinctUntilChanged` + `switchMap` delete three pieces
  of hand-written bookkeeping.
- **The fee schedule is derived, not fetched.** The dataset has no fee fields, so
  any number is invented either way. Inventing it as a pure function of the bid
  and the province means two buyers see the same quote and there is one file to
  point at when someone asks where $145 came from.
- **Countdowns were scoped in and dropped.** With auctions days out, a countdown
  says nothing an absolute time does not, and doing it properly needs an app-level
  ticker, an elapsed case, and a negative-time guard.

## Testing

```bash
npm test
```

Vitest 4 + Testing Library in jsdom, 22 tests across 8 files, with a coverage
table printed on every run and an HTML report in `coverage/`.

Tests live in [`tests/`](tests), outside `src/`, mirroring the source tree.
`tsconfig.test.json` is a project reference off the root tsconfig, so
`npm run typecheck` covers tests as well as the app.

**Scope is deliberately narrow: happy-path component rendering.** No page tests,
no service tests, no UI regression suite. What these cover is that a component
still renders the right thing from the right props — the bid label switching on
whether a lane is open, buyout appearing only where there is a buy-now price, the
reserve rendering as a status and never as a figure. Those are the domain rules
most likely to be quietly broken by a refactor. Coverage sits around 26% and there
is no threshold configured; a gate would only invite tests written for the metric.

## Assumptions and scope

Taken from the brief: this is a prototype, authentication is not required, a
frontend-only implementation is acceptable, seller workflows and checkout and
payments are out of scope, and auction timestamps may be normalized.

**Deliberately not built**, so nothing here reads as an unfinished bug:

- **No auth, seller tooling, checkout, or payments.** Explicitly out of scope.
- **The heart on a card is inert.** A watchlist needs somewhere to persist and a
  place to read it back; neither is in scope.
- **"Add a payment method" is inert**, and says so in its tooltip. Adding one
  means collecting a card number, and there is no backend to send it to.
- **The Buyout button inside the buyout dialog is inert.** Taking a lot at its
  buy-now price ends the auction for everyone watching it, so it needs what a bid
  needs — a POST, a receipt, and a channel to tell other bidders the lot is gone.
  Wiring it to merely close the dialog would read as a purchase that went through.
- **A placed bid does not change the lot behind the modal.** This is the one place
  the prototype stops short of the brief's "updated visible state", and it is a
  considered stop rather than an omission. `placeBid` returns an acknowledgement,
  not a bid state: `status` is `accepted`, never "winning". Whether a bid still
  stands is a broadcast every watcher of the lot sees, and reading it out of one
  buyer's POST response would give that buyer a different answer to everyone
  else's. The honest version is a push channel — `GET /api/bids/stream` as SSE
  feeding a `BehaviorSubject` in `store/bidStore.ts` — and the seams for it are in
  place: `BidUpdate` is declared in `types/bid.ts`, and `services/bidding.ts`
  documents the exact signature `subscribeToBidUpdates` will take. It is the first
  thing I would build next.
- **No bid history and no auction end time.** Neither exists in the dataset, so
  both would be invented rather than read.

## Time spent

<!-- TODO: fill in before submitting -->

## How I used AI

Claude Code, throughout, as a pair rather than an autocomplete. Two artefacts in
this repo are the evidence:

- **[`CLAUDE.md`](CLAUDE.md)** — a committed context file describing structure,
  conventions, and domain rules, maintained as the app was built rather than
  written at the end. It is what kept generated code consistent with decisions
  made three phases earlier.
- **[`docs/DECISIONS.md`](docs/DECISIONS.md)** — an append-only log, one entry per
  decision, written when the decision was made.

Work ran in phases on their own branches — data layer, inventory, detail, bid
flow — each merged when it was done. Every architectural call in this README was
mine; the assistant's job was to argue with it, write the code, and keep the
context files honest.

## The data

200 synthetic vehicles at [`public/data/vehicles.json`](public/data/vehicles.json),
fetched at runtime. It lives under `public/` rather than at the challenge's
original `data/` path because serving it requires that, and it was **moved rather
than copied** — one source of truth beats two identical 288KB files.

Three fields are frequently null, and all three are real states rather than
missing data: `current_bid` on 112 of 200 (nobody has bid — read bids through
`displayBid()`, never directly), `reserve_price` on 60 of 200 (no reserve at all),
and `buy_now_price` on 161 of 200 (buyout not offered). `damage_notes` can be an
empty array, which renders as "No damage reported".

The full field reference is in [`docs/CHALLENGE.md`](docs/CHALLENGE.md).
