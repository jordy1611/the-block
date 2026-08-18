# The Block — buyer-side vehicle auction prototype

Frontend-only prototype. A buyer browses auction inventory, opens a vehicle,
and places bids. 200 vehicles, static dataset, no backend.

## Workflow

- One branch per phase, named for the work itself (`data-layer`, `inventory`,
  `bid-flow`), merged into `main` when the phase is done. **No pull requests** —
  merge locally.
- Merge with `--no-ff` so each phase stays a visible unit in the history. The repo
  gets screen-shared during the walkthrough; a readable log is part of the deliverable.
- Never commit feature work directly to `main`.

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
  main.tsx     providers only — MantineProvider + Notifications
  theme.ts     brand palette, typography, component defaults
  App.tsx      app shell
  index.css    base layer only — no colors live here
public/
  data/vehicles.json   the dataset, served and fetched at runtime
```

Mantine needs `postcss.config.cjs` at the root. Do not delete it.

## Data

- The dataset lives **only** at `public/data/vehicles.json`. The challenge shipped it
  at `data/vehicles.json`; it was moved rather than copied so there is one source of
  truth instead of two identical 288KB files.
- Loaded async via `fetch('/data/vehicles.json')` in `src/api/vehicles.ts`.
  **Never static-import the JSON.** It is a 288KB asset deliberately kept out of
  the bundle, and the async boundary is what gives us real loading/error states.
- `current_bid` is null on 112 of 200 vehicles. Always read bids through
  `displayBid()` (`current_bid ?? starting_bid`). Never render `current_bid` directly.
- `buy_now_price` and `reserve_price` are frequently null — conditional render only.
- `damage_notes` can be an empty array — render "No damage reported".

## Async conventions

- `async/await` is the house style.
- `IntersectionObserver` for image lazy-loading in the inventory grid.
- Bid state lives in an observable store consumed via `useSyncExternalStore`, so a
  bid updates the detail view and the list card at once.
- Artificial latency is ~300ms, in one place. The error path is triggered by an
  explicit flag — never a random failure rate.

## Components

- **Primitives come from Mantine.** Do not hand-roll buttons, inputs, modals,
  badges, or skeletons.
- **Domain components are ours:** `VehicleCard`, `BidPanel`, `ConditionGrade`,
  `TitleBadge`, `SpecList`, `Money`.
- Never format a number inline — money and odometer go through their formatter.
- Never hardcode a color — use theme tokens from `src/theme.ts`.

## Domain rules

- Minimum next bid = current bid + $100.
- `condition_grade` is a 5-point scale — render as "3.8 / 5", never bare.
- `salvage` and `rebuilt` titles are visually flagged. Buyer trust signal, keep it.

## Deliberately not built

No auth, seller workflows, checkout, payments, or backend.

No countdowns or live auction state — every `auction_start` in the dataset is in
the past, so a countdown would read "ENDED" on all 200 lots. Show the date only.
Do not add one.
