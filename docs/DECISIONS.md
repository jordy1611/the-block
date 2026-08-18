# Decisions

A running log. One entry per decision, appended when it is made — not reconstructed later.
Feeds the README's "Notable Decisions" section and the walkthrough.

---

**Frontend-only, no backend.** The challenge states it is acceptable and the timebox is
3-4 hours. A backend would consume the budget without touching anything they said they grade.

**React + Vite + TypeScript.** Suggested in the brief, fastest path to a running app, and
types pay for themselves against a 29-field record with several nullable numeric fields.

**App scaffolded at repo root** rather than a `web/` subfolder. Keeps README run
instructions to a single path with no nested `cd`.

**Mantine over shadcn/ui and MUI.** shadcn copies component source into the repo, which is
a liability in a walkthrough where any file is fair game to explain — Mantine stays a clear
dependency in `node_modules`. MUI would make the app look like Material, and visual intent
is graded. Mantine also ships `Skeleton`, `useForm`, and notifications, which map directly
onto the loading states, bid validation, and bid confirmation this app needs.

**The theme file is written before any feature code.** Stock component libraries read as
stock. Primary color, font stack, radius, and spacing set up front is the difference between
"used a library" and "built a product."

**Data is fetched, not imported.** `fetch('/data/vehicles.json')` from `public/`, even
though the data is local. Three reasons: a static import would bundle 288KB of JSON into the
JS; a real request produces a real Network entry and a real `!res.ok` error path; and
swapping to a live API later becomes a one-file change.

**Artificial latency is ~300ms and the error path is flag-triggered, not random.** A mock
that fails on a percentage will eventually fail during someone else's evaluation session,
and they will not know it was intentional.

**Async idiom follows the shape of the problem, not a desire to show range.** `async/await`
is the house style; `IntersectionObserver` handles image lazy-loading because it is genuinely
the right tool for 200 cards of external images; the bid store is observable because "updated
visible state" across two views is exactly what an observable solves. Mixing idioms for
demonstration would read as having no house style.

**Bid state uses `useSyncExternalStore`.** React's built-in API for subscribing to an
external store. It makes the graded requirement — a bid placed on the detail view showing on
the list card — fall out of the architecture instead of needing to be wired up per view.

**Two component tiers.** Primitives come from Mantine and are never hand-rolled. Domain
components (`VehicleCard`, `BidPanel`, `ConditionGrade`, `TitleBadge`, `SpecList`, `Money`)
are ours and are the layer where consistency actually shows.

**Bids persist to localStorage.** Cheap, and it stops a stray refresh from wiping the state
mid-demo.

**The dataset was moved to `public/data/`, not copied there.** Serving it requires it to
live under `public/`, and keeping the original at `data/` would mean committing the same
288KB payload twice. One source of truth is worth more than preserving the challenge repo's
original file placement.

**Brand palette is two scales with separate jobs.** `lane` (deep petrol teal) is the primary
and carries ordinary chrome; `signal` (amber) is reserved exclusively for auction state —
live bids, high-bidder confirmation, reserve indicators. Keeping the accent scarce is what
makes it read as meaningful rather than decorative.

**Monospace is a domain choice, not a style one.** VINs, lot numbers, and odometer readings
are scan-and-compare data, so the theme sets a monospace family for them and digits align
down a column.

**Auction timestamps were regenerated rather than displayed stale.** Reading
`scripts/generate_vehicles.mjs` shows `auction_start` is produced 1-7 days from whenever the
script runs — it is not fixed data. The committed file was generated around 2026-03-30, so
by the time the challenge was opened every auction read five months in the past. The brief
explicitly permits normalizing these timestamps ("synthetic scheduling data... it's fine to
normalize them relative to 'now'"), so the provided generator was re-run. Only `id` and
`auction_start` differ; all 200 vehicles, prices, bids, and conditions are byte-identical.
The script's output path was updated to `public/data/` in the same change so it cannot
silently write to the old location.

**Countdowns are in scope because the dates now support them.** With auctions 17 hours to
7 days out, a countdown carries real information for a buyer deciding what to watch. It is
built with a single app-level ticker rather than an interval per card, and cards render
coarse granularity while only the detail view counts seconds — 200 cards updating every
second would be waste, not polish.

**No bid history and no auction end time.** Neither exists in the dataset, so both would be
invented rather than read. Out of scope.
