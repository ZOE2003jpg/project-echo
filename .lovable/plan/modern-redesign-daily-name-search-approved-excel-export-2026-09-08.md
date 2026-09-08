# Modern redesign + daily name search + Approved Excel export

Three pieces of work, keeping the existing Pitch Capital red/gold brand colours exactly as they are.

## 1. Modern, professional look across the whole app

Refresh the visual language everywhere — the public loan application form, the admin pages, and the front desk / marketer / operations dashboards — so it reads as a polished fintech product rather than a plain HTML page. No feature behaviour changes.

What changes:
- A refined design foundation: better type scale and weights, consistent spacing rhythm, softer corners, layered shadows, subtle brand-tinted surfaces and gradients built from the existing red and gold.
- Public application form: a strong branded header, a clear step/section rhythm with numbered section cards, better grouped fields, larger touch targets, friendlier validation and a confident submit state.
- Staff shell: cleaner sidebar with clearer active state, a tidy top bar with page title and user menu, calmer page headers.
- Lists and tables: stronger headers, zebra-free quiet rows with hover states, better aligned money columns, refined status pills, nicer empty and loading states.
- Stat cards, badges, buttons and inputs get consistent polished variants.
- Mobile: tables become readable stacked cards on small screens.
- Dark mode stays working since all colours remain semantic tokens.

## 2. Search applicants by name on every daily queue

Add a name search box to the front desk, marketer and operations queues (the admin Applications and Position Management pages already have one; those get the same refreshed treatment and matching behaviour).

- Matches on first name, surname, application ID and email, case-insensitive, updating as they type.
- The search sits alongside the existing day grouping/filters, so staff can pick a day and then find a person within it.
- The search term is kept in the page address so going into an application and coming back keeps the same results.
- Result count and a clear "no matches" message.

## 3. Export approved applicants to Excel

On the Approved tab of Position Management, add an "Export to Excel" button with a date-range picker (from / to).

- Staff choose a start and end date; the export covers approved applications finalised in that range. Defaults to the current month, with quick presets (Today, This week, This month).
- A preview count shows how many records will be exported before downloading.
- The file is a real `.xlsx` spreadsheet with one row per approved applicant and these columns: Name, Loan Amount (requested), Bank, Account Number, Approved Amount. Plus a header row styled bold, sensible column widths, and amounts formatted as Naira numbers so they can be summed in Excel.
- Filename includes the range, e.g. `pitchcapital-approved-2026-09-01-to-2026-09-08.xlsx`.
- If no records fall in the range, the button explains that instead of downloading an empty file.

## Technical notes

- Design tokens updated in `src/styles.css` (existing `--brand`, `--gold`, `--primary` values unchanged); new tokens for elevation, gradients and surfaces. Component polish via shadcn variants in `src/components/ui/*` and `src/components/admin/*` — no hardcoded colour classes.
- Search added to `_dashboard.frontdesk.tsx`, `_dashboard.marketer.tsx`, `_dashboard.operations.tsx` using each route's `validateSearch` for a `q` param, mirroring the existing pattern in `admin.applications.tsx`.
- Export implemented client-side with the `xlsx` package (new dependency), reading `firstName/surname`, `amountRequested/amount_requested`, `bank`, `accountNo/account_no`, `approvedAmount/approved_amount` from the already-loaded application list. Range filtering uses the same `reviewedAt/reviewed_at` date the Approved tab sorts by.
- Shared export helper in `src/lib/export-approved.ts` so it can be reused later.
- No backend or API changes; the app keeps reading from the live pitchcapital.ng API.
