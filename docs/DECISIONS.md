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

**Countdowns were scoped in, then dropped.** With auctions days out rather than minutes,
a countdown says nothing an absolute time does not — "Starts Aug 28, 4:00pm" is what a
buyer puts in their calendar. Building one properly needs an app-level ticker to avoid
200 intervals, an elapsed case, and a guard against rendering negative time: real work
for no added information. The card and modal show the timestamp instead, and
`isBiddingActive` covers the only state that changes behaviour.

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

**Routing landed with the shell, not with the detail page.** The router, the layout
route, and both page stubs were built in the same pass as the inventory grid. Adding
routing later would have meant building the header twice — once inside the inventory
page and once again when a second route needed it — and the card is not really a card
until it links somewhere real.

**No Mantine `AppShell`.** It manages a collapsible navbar, an aside, and the padding
interactions between them. This app has a header and a page. `Box` plus `Container`
plus a layout route is less machinery, and every line of it is explainable.

**Search belongs to the inventory page, not the header.** A search field in the app
chrome would render on the detail page and the not-found page, where it filters
nothing. Chrome holds what is true on every route; this is true on one.

**`searchVehicles()` is async even though the filtering is synchronous.** Keeping it
behind a Promise is what makes `switchMap` honest rather than decorative — keystrokes
during the initial 300ms load produce genuinely concurrent, cancellable searches. It
also means pointing search at a real endpoint later is a one-function change.

**RxJS is used for search and nothing else in this phase.** `debounceTime`,
`distinctUntilChanged`, and `switchMap` replace, respectively, a timer ref cleared on
every keystroke and unmount, a "last query I actually ran" ref, and a hand-written
stale-response guard. That is three pieces of bookkeeping deleted, which is the bar
the library has to clear to be worth importing.

**Typing never returns the page to a loading state.** After the first load the dataset
is in memory, so a filtered result comes back within a microtask. Showing skeletons for
that would be a flash, not feedback. Only the initial load and an explicit retry show
the loading state.

**VIN matching requires at least six characters.** A VIN is 17 effectively random
characters, so short queries collide with it — "cx5" was returning a Ram 1500 whose VIN
contains CX5 alongside the ten Mazda CX-5s. To a buyer that is indistinguishable from a
broken search. Buyers who search by VIN paste a whole one or its tail, so the floor
costs them nothing.

**Punctuation is stripped from both the query and the index.** "cx-5", "cx5", and
"CX 5" are the same search, and so are "A-0042" and "a0042". Buyers do not know how the
dataset punctuates a model name and should not have to.

**The whole card is the link.** A "View details" button inside a card is a second
target for the same destination, and on a phone it is the smaller of the two.

**The card's bid label switches between "Current bid" and "Starting bid".** Over half
the inventory has no bids. Labelling a starting price as a current bid tells the buyer
something untrue about demand on that lot — it is the same `displayBid` fallback, but
said accurately.

**"Clean title" is shown, not just salvage and rebuilt.** The absence of a warning is
ambiguous — it could equally mean the app has nothing to say. A stated clean title is a
positive signal and costs one badge.

**One IntersectionObserver for the whole grid, not one per card.** Same reasoning as the
countdown ticker would have needed: 200 cards would mean 200 observers, and the observer API is built to
watch many targets at once. Images are requested 300px before entering the viewport —
lazy loading the user can see happening is just slow loading.

**Cards render in batches of 24, not all 200.** Lazy images were only half the
problem. Mounting all 200 cards produced a 235ms long task — measured, not guessed —
which is a visible freeze every time the full list renders, most obviously when
clearing a search. Batching took the initial grid from 5,272 DOM nodes to 699 and the
worst long task from 235ms to 53ms.

**Progressive rendering, not windowing.** A windowing library would hold the DOM
constant, but it costs a dependency, breaks Ctrl-F on rendered rows, and takes over
scroll handling. Appending batches from a sentinel reuses the IntersectionObserver
already in the page, is about thirty lines, and leaves scrolling to the browser. The
tradeoff it accepts: Ctrl-F only finds what has been rendered so far, which is true of
every infinite list.

**The batch counter carries the result set it counts against.** Same shape as the key
inside `useAsync`: `{ of: vehicles, count: n }`. A new result set is therefore back at
one batch by construction, with no reset effect and no frame where the previous count
is applied to the new list.

**`filterVehicles` always returns a new array, including for an empty query.** Every
search then yields a result set identifiable by reference, which is what lets the grid
detect a new one. It also means the cached inventory array is never handed out to a
caller that might sort or mutate it in place.

**Skeletons mirror the card's layout, not just its footprint.** Blocks sit where the
real content will sit and the grid uses the same column steps in both states, so
nothing reflows when the data lands.

**A colour-scheme toggle in the header.** The theme was already built for both schemes;
the toggle makes that visible and forces both to be checked continuously rather than
discovered as broken during the final polish pass.

**Cards sit on their own surface, set once as a `Card` theme default.** Dark mode
already had this — Mantine's `--mantine-color-default` is one step above the body — but
light mode was a white card on a white page, leaving the border to carry the whole
separation. `gray-1` rather than `gray-0`: at 2% off white, `gray-0` was invisible
against the page in practice, which is a change that costs a line and buys nothing.

**The scheme swap uses CSS `light-dark()`, not two hardcoded values.** One declaration
in `theme.ts`, both halves theme tokens, and it applies to every `Card` in the app —
including the loading skeletons, which is precisely why it belongs in the theme rather
than in the card's own stylesheet.

**Design tokens live in `src/styles/`, split into two layers.** `palette` holds raw
hex values named for what they look like (`offWhite`, `graphite`); `lightColors` and
`darkColors` hold roles named for the job (`surface`, `textSecondary`, `gradeHigh`).
A role can be repointed without touching a component, and a component never learns a
hex code — which matters because a component holding a literal renders the same colour
in both schemes.

**Both colour schemes are type-checked for parity.** `ColorScheme` is
`Record<keyof typeof lightColors, string>`, so adding a role to light mode and
forgetting dark mode is a compile error rather than an unstyled element found later.

**Tokens are `.ts`, not `.css`.** `theme.ts` has to consume them to generate Mantine's
CSS variables, Mantine style props take JS values, and TypeScript gives autocomplete
plus the parity check above. CSS modules still get the values — as the
`var(--mantine-*)` variables the theme emits — so nothing has to import a hex.

**Token values were read out of the running page, not invented.** Every colour, size,
and measurement in `src/styles/` is what the app renders today, so adopting them is a
refactor with no visual diff. Two inconsistencies were found in the process and left
visible rather than silently fixed: there are three font weights in use (600, 650, 700
— 650 is an unchosen Mantine default), and the heading size (18.8px) is smaller than
the bid amount size (20px).

**The styling chain is documented as one-directional: `styles/` → `theme.ts` →
Mantine CSS variables → components.** Only `theme.ts` imports the tokens, and it
invents nothing of its own. The rule that makes it hold is the one about components:
they consume Mantine props and CSS variables, never the palette, because a Mantine
scale key is already a token reference once the scale is generated from ours. Without
a stated direction, a token folder becomes a second place to look rather than the
only place.

**Tokens reach CSS through `cssVariablesResolver`, not a second stylesheet.** A
`*.module.css` cannot import TypeScript, which is the usual reason token systems end
up with values written twice. Mantine's resolver emits the semantic roles as `--app-*`
variables per colour scheme, so the card's hover stylesheet and the card component read
the same source.

**The resolver also repoints Mantine's own variables at our roles.**
`--mantine-color-body`, `-text`, `-dimmed`, and `-default-border` now resolve to
`pageBackground`, `textPrimary`, `textSecondary`, and `border`. That is what keeps
`c="dimmed"` and `withBorder` honest — built-in Mantine components pick up our tokens
without every call site being rewritten to a custom variable.

**Two deliberate visual changes came out of the token adoption.** Headings moved from
weight 650 to 700 and card titles from 650 to 600, because 650 was an unchosen Mantine
default and the scale is now three weights by definition. The clean-title badge in dark
mode moved up one step (`gunmetal`) so it stays visible against the card surface, which
the old Mantine `variant="default"` was handling with a border. Everything else renders
byte-identical to before the refactor — verified by reading computed styles in both
schemes.

**The condition grade sits on the photo, not under it.** It is the first thing a buyer
filters on, and the photo is the only part of a card that is already being looked at.
Moving it there also frees the meta row, which was carrying two badges competing for
the same glance.

**The chip drops the "/ 5" and keeps the colour.** Everywhere else the denominator is
mandatory — a bare "4.0" means nothing to someone who does not know the scale — but a
chip has no room for it, and the three-bucket colour band is doing the comparing at
that size. The detail view still renders the full "3.8 / 5".

**`gradeColor()` lives in its own file, not as an export from `ConditionGrade.tsx`.**
The overlay chip needs the mapping without needing the component, and a component file
that also exports a function breaks React Fast Refresh — oxlint flags it.

**The overlay scrim is the one colour that does not flip with the scheme.** It sits on
photography, and a photo is a photo in either mode. Measured 6.25:1 against the
dataset's images, which are uniformly dark; genuinely bright vehicle photography would
want a solid chip background rather than a translucent one.

**`isBiddingActive` is derived from `auction_start`, not from bid activity.** They are
different questions — a lot can be open with nobody having bid — and the dataset has no
status field, so the date is the only honest source. It is evaluated per render rather
than on a ticker: a lot crossing its start time while the page sits open is not worth a
subscription in a prototype, and the next navigation picks it up.

**The card's chip label switches on it — "Bidding Starts" or "Bidding Open".** Every
lot in the current dataset is scheduled, so the open branch is verified by calling the
function directly rather than by looking at the grid.

**The card lost its title badge and gained a buyout figure.** A card is one glance's
worth of information, and title status is a decision-stage fact rather than a
scanning-stage one — it stays on the detail view where a buyer is already reading
condition. Buyout earns the space instead: it is the only number on the card that
changes what a buyer can do right now, and it is present on 39 of 200 lots, so it is
conditionally rendered.

**The identity line moved up a size and the second line switched to engine and
drivetrain.** Trim and body style are already implied by the name and the photo; engine
and drivetrain are what a buyer filters on and cannot see in a thumbnail.

**"Current bid" now requires the lot to be live, not just to have a bid count.** Before
a lot opens, the figure is what bidding will start at regardless of what the dataset
carries in `current_bid`. Calling it a current bid on a lot nobody can bid on yet is the
same category of lie as calling a starting price a current bid.

**The bid count is hidden entirely on a scheduled lot.** "0 bids" on a lot that has not
opened reads as no interest rather than as not yet possible, and the count carries no
information until bidding is live.

**A live lot gets a 3px border in the brand colour, breathing against the card's
ordinary border.** Red was tried first and rejected: red is the app's damage-and-error
colour (it is what flags a salvage title), and spending it on "this lot is open" would
teach two meanings for one colour. The border reuses the colour a card already borrows
on hover, so live and interactive speak one language. A hard on/off blink across a grid
of 24 is a distraction; a slow 2s fade reads as a state. Disabled under
`prefers-reduced-motion`, where the border stays solid — still unmistakably live, just
not moving.

**Auction dates were randomized across a window that straddles today.** All 200
`auction_start` values were redrawn across 2026-08-16 to 2026-09-04, using the hours
the generator itself uses (09:00-20:00 on the hour) so the data still looks like it
came from one source. The point is the straddle: with every lot in the future,
`isBiddingActive` is always false and the live state is unreachable in a demo. The
result is 23 live and 177 scheduled.

**This puts the dataset beyond what the generator can produce.** `generate_vehicles.mjs`
only emits future dates, so re-running it to refresh timestamps would silently erase
every live lot. Noted in `CLAUDE.md` next to the regeneration instructions, since that
is where someone would go looking.

**The card photo carousel is hand-rolled, not `@mantine/carousel`.** That package pulls
in Embla for drag physics, snap points, and autoplay — none of which a 4:3 thumbnail
with two arrows needs. The arrows themselves are Mantine `ActionIcon`s, so the primitive
is still the library's; only the index state is ours.

**The card became a stretched link to make room for those arrows.** Buttons nested
inside an anchor are invalid HTML and behave badly for keyboard and screen-reader
users. So the card is now a plain element, the vehicle name carries the `Link`, and
that link's `::after` covers the whole card — the click target is unchanged, the markup
is valid, and the arrows sit above it on their own z-index. The focus ring moved from
`:focus-visible` on the card to `:focus-within`, since the focusable element is now
inside.

**Neighbouring photos prefetch only after the first arrow press.** Prefetching on mount
would mean 200 cards requesting images nobody asked to see. Fire-and-forget with no
await, because nothing on the page depends on the result — one of the few places a
bare `.then()`-style side effect is the right shape.

**The vehicle detail view is a modal, not a page — and still a route.** OPENLANE
presents a vehicle in a modal, so the prototype follows. `/vehicle/:id` is nested under
`/`, which means `InventoryPage` renders it through an `<Outlet />` with the grid still
mounted behind it. Holding it in component state instead would have cost the shareable
URL, the back-button close, and the card's plain `<Link>`.

**Keeping the grid mounted is the real win.** A separate page unmounts the inventory, so
returning to it re-fetches nothing but does reset scroll position and drop back to the
first batch of 24 cards. With a modal the buyer closes it and is exactly where they
were — which matters most in Phase 4, where a bid placed in the modal has to show on the
card behind it.

**Condition grade and title status appear once, in the condition report's header.**
They were also in the facts column, which meant a buyer reading top to bottom met the
same grade twice and had to work out whether the two were saying different things. The
accordion header is where they belong: the grade and the title are both answers to
"what shape is this in", and they sit next to the report that explains them.

**The detail modal splits gallery-and-detail from facts-and-action.** Photos and the
long-form accordion sit in the wider left column; odometer, location, timing,
drivetrain, seller, lot, and VIN run down the narrower right column, with the bid box
closing it out. The right column ends up reading as one argument — here is the vehicle,
here is where and when it sells, here is the money, here is the button — while the left
column is for looking and then digging.

**Long-form sections all start collapsed, and more than one can be open.** The modal
opens at roughly one screen, so the photo, the money, and the at-a-glance facts are what
a buyer lands on; which detail they read first is their choice rather than ours.
Mantine's Accordion is single-open by default, which meant opening the spec sheet
collapsed the condition report — the two answer different questions, so `multiple` is
correct here.

**The reserve is shown as a status, never as a figure.** "Reserve met" is the part that
changes a buyer's decision; the number itself is the seller's private floor, and
printing it tells every buyer exactly what to bid. `reserve_price` being null is a third
state — no reserve at all — not a missing value.

**The bid box ends the facts column rather than sitting under the photo.** In a narrow
column the figures wrap onto two rows and the button spans the full width, which makes
the action the last thing in the read instead of a control competing with the gallery
for the same horizontal band.

**The bid modal is component state, not a route.** Unlike the vehicle itself, a
half-filled bid form is not something anyone should be able to link to, and it has
nothing worth restoring on reload.

**Stacking two modals needed the lower one to stop listening.** With both open, one
Escape closed both and navigated back to the grid, because each modal handles the key
independently. `closeOnEscape`/`closeOnClickOutside` on the detail modal are gated on
the bid modal being closed, so dismissal unwinds one layer at a time.

**The modal's gallery loads eagerly while the grid's images stay lazy.** Everything in
the modal is the reason it was opened; deferring it behind an IntersectionObserver would
only delay the one image the buyer asked for. That is why `PhotoGallery` does not reuse
the grid's `VehicleImage` — different loading semantics, not duplicated logic.

**`components/vehicle/` was folded into `components/common/`.** The two-tier split —
domain-agnostic in `common/`, shared domain components in `vehicle/` — never held more
than two files, and it forced a judgment call ("is this domain enough?") on every new
shared component without changing where anyone would look for one. One shared folder
with one rule is easier to follow: used by one page it colocates, used by two it moves
to `common/`.

**`gradeColor` went back inside `ConditionGrade.tsx` as a private function.** It was
split out when the card's overlay chip looked like it would need the mapping directly;
the chip ended up rendering `<ConditionGrade>` instead, so the export existed for a
caller that never arrived. Unexported, it also does not trip the Fast Refresh lint rule
that caused the split in the first place.

**`src/pages/` was renamed to `src/features/`.** A folder in there owns a slice of the
product, not a URL. `vehicle-detail` renders as a modal over the inventory grid rather
than as a page of its own, and `inventory` holds a search hook, a shared observer
registry, and six components alongside its route — none of which "page" describes.
Nothing about the structure changed, only the name that was already inaccurate.

**`CopyText` inherits its typography rather than setting it.** VINs and lot numbers
exist to be pasted elsewhere, and selecting seventeen monospace characters by hand is a
small repeated annoyance. Mantine's `UnstyledButton` re-asserts the medium font size, so
the value rendered a step larger than the field beside it until the component was told
to inherit font and colour — the affordance should not change the typography it is
dropped into.
