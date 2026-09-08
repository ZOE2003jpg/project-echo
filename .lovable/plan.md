# Search across all records + enterprise UI/UX uplift

## What I found in the current product

- Staff console: sidebar (role-based menu) + top bar, pages for Dashboard, Applications, Position Management, Reports, Profile, plus the Front Desk / Marketer / Operations queues and the single application detail page. Public loan form on `/`.
- Existing brand: deep red primary with gold accent, Plus Jakarta Sans headings + Inter body, logo in the sidebar. All colours already live as tokens in `src/styles.css`. None of this changes.
- Patterns already in place: card-wrapped tables, status pills, stat cards, tabs, skeleton loaders, URL-persisted filters, an applicant search helper.

### Problems worth fixing

1. **Search is scoped to the selected day.** On Applications, a name search only looks inside the currently selected date (defaults to Today), plus the status and product filters. Staff searching for a person who applied last month get "no results".
2. Inconsistent search: three different search implementations across pages; only Applications uses the narrow one.
3. Every page repeats the same table markup — no shared table shell, so hierarchy, empty states and mobile behaviour drift page to page.
4. Empty states are one grey sentence; no "clear filters" recovery. No error state at all when the data fetch fails — the page just shows an empty table.
5. Tables overflow sideways on phones with no readable fallback; filter rows wrap awkwardly.
6. Visual hierarchy is flat: page titles, card titles and table headers sit at similar weight; money columns aren't aligned; some hardcoded colours (emerald/red text) bypass the theme.

## 1. Fix the search (the functional ask)

Searching by name looks through **every** application record, not just the chosen day.

- The moment someone types in the search box on Applications, the day filter steps aside and results come from the whole set, newest first, with the applied-on date shown on each row.
- A clear line above the results says what's being searched: "Searching all dates — 14 matches" with a one-click way to go back to the day view.
- Status and product filters keep applying, since those are deliberate narrowing choices; a "clear filters" action sits in the no-results state.
- Same behaviour and same search component on Position Management, Front Desk, Marketer and Operations, so search means the same thing everywhere. Matches on first name, middle name, surname, application ID, email and phone.

## 2. UI/UX modernization (brand untouched)

Foundations, in `src/styles.css` only — no new colours, no new fonts:
- Tighter type scale with real steps for page title / section / card title / body / label / metadata.
- One spacing and radius rhythm, restrained borders, two elevation levels instead of ad-hoc shadows.
- Remove decorative gradients where they add noise (keeping the brand gradient for logo and primary emphasis only).
- Visible, consistent focus rings; motion kept to ~150ms and disabled under reduced-motion.

Shared components (new or consolidated):
- `DataTableShell` — one table pattern: sticky styled header, quiet rows with hover, right-aligned tabular-figure money columns, row actions, and on small screens each row becomes a readable stacked card.
- `PageHeader` — title, supporting line, and a slot for page actions.
- `FilterBar` — consistent alignment of date controls, search, tabs and selects; collapses into a filter sheet on mobile.
- `EmptyState` / `ErrorState` — explain what happened, why, and the next action (clear filters, retry, go back).
- Buttons, inputs, selects, badges and status pills unified through their existing variants; hardcoded colour classes replaced with tokens.

Page-level work:
- Applications, Position Management and the three role queues rebuilt on the shared shell — same data, same columns, same actions, better hierarchy and states.
- Dashboard: stat cards calmed down, clearer grouping.
- Application detail: sectioned layout with clearer field labels and a sticky action area.
- Public loan form: clearer section rhythm, better labels, required markers, inline validation and a confident submit state.
- Sidebar/top bar: clearer active state, better collapse behaviour, working mobile navigation. Every existing destination stays.

## Explicitly unchanged

Brand colours, logo, fonts, routes, navigation destinations, roles and permissions, API calls, business logic, the Excel export, and the spreadsheet link.

## Technical notes

- Search: drop the inline matcher in `admin.applications.tsx` in favour of `matchesApplicant` from `src/lib/search.ts`; when `q` is non-empty, skip the `activeDate` predicate and sort newest-first. Same swap on the queue pages.
- New shared components under `src/components/admin/`; token updates in `src/styles.css`; shadcn variants extended rather than replaced. No new dependencies.
