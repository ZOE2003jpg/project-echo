# Import Pitch Capital project from GitHub

## Goal
Copy the Pitch Capital loan app (cloned from github.com/ZOE2003jpg/Pitchcapital-3-8-2026) into this Lovable project so it runs in the preview, then wait for the user's next instruction.

## What the repo contains
- Vite + React 19 + TanStack Router (plain SPA, not TanStack Start) + Tailwind v4 + shadcn ui components
- Pages: loan application form (`/`), admin login + dashboard (applications, application detail, position management, reports, profile), staff logins + dashboards (frontdesk, marketer, operations)
- `old.*` route files — legacy duplicates kept in the repo
- API client (`src/lib/api-client.ts`) calling `/api` (dev-proxied to https://pitchcapital.ng), auth token in localStorage
- Assets: `src/logo.jpg`

## Key adaptation: SPA → TanStack Start
This Lovable project uses TanStack Start (SSR, file routes in `src/routes`, router via `src/router.tsx`). The repo is a plain Vite SPA with its own `main.tsx`, `index.html`, and `base: "/loan/"`. The port will:

1. **Copy source folders**: `src/components/**`, `src/lib/**`, `src/hooks/**`, `src/logo.jpg` into this project (overwrite template stubs where they collide, e.g. `lib/utils.ts`, `hooks/use-mobile.tsx`, `lib/lovable-error-reporting.ts`).
2. **Routes**: copy all route files, renaming for TanStack Start conventions:
   - `1.admin.application.$id.tsx` → `admin.application.$id.tsx` (numeric-prefix file is a duplicate; the repo already has `admin.application.$id.tsx` — verify which is newer, keep one)
   - Drop all `old.*` / `oldmarketer.tsx` legacy routes (dead duplicates)
   - Keep: `index.tsx` (loan form — replaces template placeholder), `admin.tsx` + `admin.*.tsx`, `_dashboard.tsx` + `_dashboard.*.tsx`, `login.*.tsx`
   - `__root.tsx`: merge — keep this project's Start root shell (HeadContent/Scripts, stylesheet link) and port the repo's NotFound/Error components and head metadata
3. **Remove SPA-only pieces**: do not copy `main.tsx`, `index.html`, `routeTree.gen.ts` (regenerates automatically), or the `/loan` basepath / vite `base` config. Delete `src/lib/old.admin-auth.ts`.
4. **API calls**: the app fetches `/api/*`, which the repo dev-proxied to `https://pitchcapital.ng`. In Start there's no vite proxy for the published app, so point `VITE_API_BASE_URL`-less default at `https://pitchcapital.ng/api` directly (CORS permitting) — verify in preview; fall back to a tiny `/api/proxy` server route if CORS blocks browser calls.
5. **Dependencies**: install anything missing in this project (most deps already present: radix, tanstack router/query, tailwind, sonner, recharts, etc.; add any gaps found during build).
6. **Config**: keep this project's `vite.config.ts` (TanStack Start). Only add `vite-tsconfig-paths`-equivalent alias if missing (`@` alias likely already configured — verify).
7. **Head metadata**: each route already ships its own `head()`; ensure index has title/description/og tags per SEO rules.
8. **Verify**: build passes, preview shows the loan application form at `/`, admin login at `/admin/login`, staff logins at `/login/frontdesk` etc.

## Out of scope (until your next instruction)
- Any design or feature changes
- Backend/database changes (the app talks to the existing pitchcapital.ng API)

## Technical notes
- routeTree.gen.ts is auto-generated; never edited by hand
- localStorage-based auth (`pc_admin_session_token`) is client-only — ensure it's read after hydration to avoid SSR mismatch
