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

**Services expose Promises, not Observables — RxJS is scoped to where it wins.** The data
layer was first built on RxJS and then deliberately reverted. For a single cached GET of a
static file, `fromFetch` + `shareReplay` bought nothing that `async/await` + a cached promise
does not, and RxJS is a minority choice in React that would need defending on every file it
touched. It stays installed for the two cases where it genuinely beats hand-rolled code:
`debounceTime` + `switchMap` for search, where the promise version means a timer ref and a
stale-response guard written by hand, and a `BehaviorSubject` for the bid store.

**The inventory promise is cached, not the result.** Concurrent callers during the first load
await the same request rather than each firing their own. A rejection nulls the cache so the
retry action actually retries instead of replaying the same failure.

**The shared inventory request takes no AbortSignal.** Aborting it from one unmounting
component would cancel the load for every other consumer. `useAsync` discards late results
with a `cancelled` flag instead — cancellation at the component's own scope, not the shared
resource's. `http` still accepts a signal for any request that is not shared.

**`useAsync` stores the key alongside the result.** When the key changes, the stored entry no
longer matches and the hook reports pending until the new result lands. This avoids briefly
rendering the previous record's data, and keeps every state transition inside the resolve
handlers — no setState during render, none synchronously inside the effect.

**No bid history and no auction end time.** Neither exists in the dataset, so both would be
invented rather than read. Out of scope.
