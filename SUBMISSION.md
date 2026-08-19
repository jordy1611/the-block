# The Block — buyer-side vehicle auction prototype

A buyer browses auction inventory, opens a vehicle, and places bids. 200 vehicles, static dataset, frontend only.

Full run instructions, architecture notes, and the decision log live in [README.md](README.md) and [docs/DECISIONS.md](docs/DECISIONS.md). This document is the summary.

## How to Run

Requires **Node 22.22 or newer** (React Router 8 declares `engines.node >= 22.22.0`, which is the highest floor in the tree).

```bash
node --version
npm install
npm run dev
```

Open **http://localhost:8080**.

The port is pinned with `strictPort: true`, so if 8080 is already in use the server fails rather than quietly moving to 8081. That is intentional — the dev and preview servers, the launch config, and the docs all name the same port.

| Command | |
|---|---|
| `npm run dev` | Vite dev server on :8080, with the mock bid API |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc -b` — covers `src`, `tests`, and `vite.config.ts` |
| `npm run lint` | oxlint (the Vite template ships oxlint, not eslint) |
| `npm test` | Vitest once, with a coverage table |
| `npm run test:watch` | Vitest in watch mode |

README.md carries a separate set of instructions for running the app headlessly as an agent — `npm ci`, a readiness poll, and curl calls that exercise the dataset and the bid endpoint.

## Time Spent

- **~1 hour planning**, approached like feature planning
- **~4 hours building**
    - Broke the story down like a feature
    - Didn't use points, but broke down expected time similar to agile

## Assumptions and Scope

**Included**

- Inventory browsing, search, and a responsive card grid over all 200 vehicles
- A vehicle detail experience, presented as a modal over the grid — matching how OPENLANE presents a vehicle
- A bid flow with validation, a derived fee schedule, and a real POST to a mock API
- Desktop and mobile layouts

**Deliberately skipped**

- No auth, seller workflows, checkout, payments, or backend — all named as out of scope in the brief
- No filtering beyond text search
- No countdown timers
- No localStorage persistence

**Simplified or assumed**

- **Auction timestamps were normalized.** The dataset's generator produces dates relative to when it runs, so the shipped file was five months stale and every lot read as past. They were re-randomized across 2026-08-16 → 2026-09-04, using the generator's own 09:00–20:00 hour window, so some lots are live and most are scheduled. The brief explicitly allows this.
- **The fee schedule is invented, because the dataset has no fee fields.** It is a pure function of the bid and the province rather than a random number, so the same lot quotes the same thing to every buyer.
- **`isBiddingActive` is evaluated per render, not on a ticker.** A lot crossing its start time with the page open waits for the next navigation.
- **The reserve price is never displayed** — only whether it has been met. The figure is the seller's private floor.

**Live bid state**

- **A placed bid moves the lot everywhere it appears** — the inventory card, the detail modal, and the bid form's own receipt — and so does a bid by anyone else. The figure comes back on a server-sent event feed, not out of the POST response, which is what the two-channel design below is for. The mock API runs a rival bidder while a client is listening, so "Outbid" is reachable without a second browser.
- **Global state is one overlay keyed by vehicle id**, not a copy of the inventory. It holds only what the dataset cannot know, and `useLiveLot` merges it over the lot at the point of use, so every existing bidding rule applies unchanged.

Several affordances are visible but intentionally inert, so they are not mistaken for bugs: the heart on a vehicle card, "Add new payment method", and the Buyout button inside its confirm dialog. Each is documented in `CLAUDE.md` with the reason.

## Stack

- **Frontend:** React 19 · Vite 8 · TypeScript 6 · Mantine 9 (UI primitives) · React Router 8 · RxJS (scoped to two places)
- **Backend:** None. A mock API for bids and payment methods runs as Vite dev/preview middleware in `vite.config.ts`
- **Database:** None. A static 288KB JSON dataset served from `public/` and fetched at runtime

## What I Built

A buyer-side auction prototype: browse and search 200 lots, open one for the full detail view, and place a bid or take a buyout.

**Approach**

- **Cooperation with Claude Code**
    - Review and breakdown of expectations
    - Came up with plan based on expectation breakdown, with benefit analysis of tools and processes
    - Broke out plan just like stories in a feature
    - Broke these "phases" into smaller steps
- **Architecture and documentation**
    - Set up initial file structure, documentation and context for AI to follow
    - Initially manual
- **Approached each step as a story, with multiple steps**
    - MVP per section/phase
    - Refine at phase level

The documentation is part of the deliverable, not a byproduct. `CLAUDE.md` is written to be prescriptive rather than descriptive — the test applied to every line was "would this stop a well-meaning refactor?" It is committed, so it doubles as the record of how AI tooling was used.

## Notable Decisions

Primarily influenced by time constraints, followed by data structure and process.

- **The detail view is a modal, but still a route.** `/vehicle/:id` is nested under `/`, so the grid stays mounted underneath. Deep links, Escape, the back button, and scroll position all work without being wired individually.
- **Bidding is two channels, not one.** The form submit stays a POST because it needs a request/response pair — a receipt id, and an error the form can render beside the field that caused it. Where the lot *stands* is a broadcast every watcher sees, so the receipt says `accepted` and never "winning". Reading bid state out of one buyer's POST response would give them a different answer to everyone else's.
- **No state library for one slice of state.** Bid state is a `BehaviorSubject` — RxJS was already a dependency, and a subject is a current value plus a multicast and nothing more. React's built-in `useSyncExternalStore` bridges it to components, and that is the same primitive Zustand is built on, so a state library would have added a wrapper and no capability.
- **Bid state is an overlay keyed by vehicle id, not a copy of the vehicle.** The dataset is already cached app-wide, so holding vehicle records would make two things true about the same lot. `useLiveLot` merges the overlay at the point of use and returns a plain `Vehicle`, so `displayBid`, `minimumNextBid` and `reserveStatus` apply unchanged — which is why one frame off the feed updates the card, the detail modal, and the bid form at once.
- **Real async over a static import.** The 288KB dataset is fetched, not bundled, which keeps it out of the JS payload and gives genuine loading and error states. Faking async around a static import would have been theatre.
- **Progressive card rendering, after measuring.** All 200 cards at once cost a 235ms long task that froze the search input. Rendering 24 at a time cut it to 53ms. This reversed an earlier decision that had already been written down.
- **One IntersectionObserver per root margin, never one per card.** The same registry serves image lazy-loading and the render batching.
- **Design tokens are the single source of truth.** Every colour, size, and spacing value lives in `src/styles/` and reaches components through the theme. No hex codes outside one file; light and dark are typed so a role defined in one scheme and forgotten in the other is a compile error.
- **Mantine over shadcn/ui.** shadcn copies component source into the repo, which means several hundred lines of vendored code committed under my name in a review where I am expected to explain any part of the codebase. A dependency is easier to be honest about.
- **RxJS was scoped down, not adopted wholesale.** It was built into the data layer first and then reverted — it bought nothing over async/await for a single cached GET. It stays where it wins: debounced search with cancellation, and the bid store.
- **The reserve price is never rendered.** Publishing the seller's floor tells every buyer exactly what to bid.

## Testing

- **During development, approached it with integration/UI testing**, done separately by myself and Claude
- **Unit testing represents the start of the process**, not thorough coverage — a deliberate call under the time constraint, and expanded on in the section below
- **25 tests across 8 files**, Vitest + Testing Library, with coverage reported but not gated
- **Scope is deliberately happy-path component rendering** — it targets the domain rules most likely to be broken by a refactor: the bid label switching on `isBiddingActive`, buyout appearing only where a buy-now price exists, the reserve rendering as a status and never as a figure
- **Tests are typechecked by the same command the app is**
- **Every feature was verified in a real browser as it was built** — loading and error paths, both colour schemes, and 375 / 768 / 1280 widths

## What I'd Do With More Time

- **Legal info**
    - There's a lot of legal info regarding auction, buying, financing etc.
    - Needs to be spelled out explicitly
- **Filtering in the search bar**
    - This is pretty standard functionality so decided not to spend much time on it
    - Filter by any make, also use icon/images along top for easier filtering
    - Additional filtering based on timeframe
- **Buyout logic**
    - The confirm dialog exists but the button is inert — taking a lot ends the auction for everyone watching it
    - Needs its own POST, a receipt, and a frame on the update feed
- **Webhooks**
    - Auctions are live
    - Realistically would be an entirely different process for getting active bid info
- **Thorough app design**
    - Use something like Figma to design app with consistent patterns and design library
    - Component and constant library designed in Figma
- **Countdown timers**
    - Especially day of auctions
- **Accessibility**
    - Screen reader
    - Color blind
- **Significantly more thorough testing**
    - More unit testing, focus on sad path
    - E2E (with at least mock data, ideally snapshot)
    - Integration testing
    - Visual testing
    - Accessibility
    - Performance
- **API**
    - Would have liked to create simple API to connect to locally
    - Primarily to demonstrate multi layered filter query to database
