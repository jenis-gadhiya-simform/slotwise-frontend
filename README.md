# SlotWise web app

React 19 · Vite · TypeScript · Tailwind v4 · shadcn/ui · TanStack Router / Query / Form · Zod.

Covers what the API ships today: F00 (error envelope), F01 (tenancy, onboarding, public page), F02 (auth incl. Google/Microsoft), F04 (team & calendars), with F03's RBAC role map mirrored in the UI.

## Run

```sh
cp .env.example .env   # VITE_API_URL=http://localhost:3000
npm install
npm run dev            # http://localhost:5173 — must match the API's APP_URL (CORS + emailed links)
```

Emailed links (invites, resets, magic links) land in Mailpit: http://localhost:8025.

## Routes

| Path | Who | What |
| --- | --- | --- |
| `/login`, `/forgot-password`, `/reset-password`, `/account-setup` | staff | sign in, reset, accept invite |
| `/customer/login`, `/customer/reset-password`, `/magic-link`, `/auth/social/callback` | customers | password, email link, Google/Microsoft |
| `/admin/tenants`, `/admin/tenants/:id` | platform admin | create businesses, manage pending Owners |
| `/app/:slug` (+ `/team`, `/calendars`, `/settings`) | business members | overview, team, calendars, profile (role-gated) |
| `/account`, `/account/sign-in-methods` | customers | profile, password, connected accounts |
| `/b/:slug` | anyone | public booking page |

## Structure

```
src/
  lib/          api client + ApiError, session (in-memory access token), types, validation, permissions
  features/     per-domain API: query keys, queryOptions, mutation hooks (+ feature components)
  components/   form kit (useAppForm), layout shells, shared UI; ui/ is shadcn-generated
  routes/       file-based routes (TanStack Router); routeTree.gen.ts is generated
```

Conventions:

- **Auth**: the access token lives in memory only; the refresh token is the API's httpOnly `sw_refresh` cookie. A reload restores the session with `POST /auth/refresh` (single-flight, serialized across tabs with a Web Lock, because the API revokes the token family on reuse). Guards run in `beforeLoad`.
- **Data**: route loaders `ensureQueryData`, components `useSuspenseQuery`. Query keys for business data include `tenantId`, and the business comes from the URL slug, so switching business never shows stale data.
- **Forms**: `useAppForm` + Zod schemas that mirror the API's; validate on blur, then on change after the first submit. API errors appear inline via `<FormError>`; row actions use toasts.
- **Permissions**: `lib/permissions.ts` mirrors the API's role rules so the UI hides actions that would 403. The API is still the authority.
- **Dates**: the API is UTC-only; formatting to local time happens in `lib/format.ts`.

Note: the shadcn CLI may fail behind a TLS-intercepting proxy. Use `NODE_OPTIONS=--use-system-ca npx shadcn@latest add <component>`.
