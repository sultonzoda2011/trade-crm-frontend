# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Authoritative reference

`AGENTS.md` (project root) is the detailed engineering guide — stack table, full 27-route table, RBAC surfaces, store patterns, conventions tables, component/lib/type catalogues. Read it for anything beyond the quick reference below; on any conflict **AGENTS.md wins**. This file intentionally does not duplicate it, and deliberately keeps no "where AGENTS.md is stale" section: AGENTS.md was audited against the code on 2026-08-09, so re-verify against source rather than trusting a drift list here.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server + HMR at `http://localhost:5173` |
| `npm run dev:fresh` | Clears `.vite` cache then `dev` — fixes stale-HMR weirdness |
| `npm run build` | `react-router build` → production build |
| `npm run typecheck` | `react-router typegen && tsc` — **the only automated gate**; run after non-trivial changes |
| `npm run start` | Serve a production build |
| `npx prettier --write .` | Format, including Tailwind class sorting via `prettier-plugin-tailwindcss` |

**No test framework, no linter, no eslint/biome.** Typecheck + build are the only safety nets. There is no `npm test`; do not invent one.

React Router 7 runs in **SPA mode** (`react-router.config.ts` → `ssr: false`). All routing/data is client-side. `clientLoader` guards exist in exactly four files: `app/root.tsx`, `(auth)/login/route.tsx`, `(crm)/layout.tsx` (the auth+RBAC gate for every protected page) and `(crm)/index.tsx` (role-based redirect off `/`).

## Big-picture architecture

- **Path alias**: `~/* → ./app/*` (tsconfig `paths` + `vite-tsconfig-paths`). Always use `~/` — never relative `../../`.
- **Manual routing** in `app/routes.ts` using `layout()`/`route()`/`index()` helpers (not file-system routing, despite `@react-router/fs-routes` being installed). Two layouts: `(auth)/` (login) and `(crm)/` (sidebar+header, protected).
- **Data path**: components → `useQuery`/`useMutation` → `app/api/*` modules → single Axios instance `app/lib/client.ts`. Never call axios/fetch directly.
- **Auth is cookie-based — nothing attaches a Bearer header.** The backend sets httpOnly `accessToken`/`refreshToken` plus a readable `user` cookie; the browser sends them via `withCredentials`. On 401 the response interceptor calls `tryRefreshToken()` (single-flight) and **retries the original request**, only SPA-navigating to `/login` if the refresh itself fails. Identity on the client comes from `getClientUser()` reading the `user` cookie — not from `jwt-decode`.
- **State**: Zustand *factories*, not ad-hoc stores. `createTableStore()` and `createModalStore<T>()` live in `app/store/`. Each table route gets its own scoped store at `app/routes/(crm)/<entity>/store.ts`. Detail pages do **not** have their own store — there are no `id/store.ts` files in the codebase.

## Things that are easy to get wrong

- **A gated feature touches four surfaces**, not two: `app/routes.ts`, `ROUTE_PERMISSIONS` (`app/config/permissions.ts`), `ACTION_PERMISSIONS` (`app/config/actions.ts`) and `API_ROUTE_ACTIONS` (`app/lib/client.ts`). Unlisted routes silently allow all roles; endpoints missing from `API_ROUTE_ACTIONS` are silently allowed, while a wrong entry blocks a legitimate call in the browser before it reaches the network.
- **Sidebar URLs must match `routes.ts` exactly.** `navigation.ts` is not typed against the route table, so a stale path just falls through to the `*` catch-all. Gate an item by `roles` rather than `action` when the action is broader than the route (e.g. `/my-market` is Owner-only while `MARKETS_VIEW_BY_ID` is Admin+Owner).
- **Adding an action** (a new CUD button): add it to `Action` enum and `ACTION_PERMISSIONS` in `app/config/actions.ts`, then gate the UI with `useCan().can(Action.X)` — never string-compare roles.
- **UI primitives are `@base-ui/react`, NOT Radix.** `app/components/ui/*` (shadcn) uses the `render` prop pattern (`<Trigger render={<button/>}>`), not Radix's `asChild`. Don't copy Radix API patterns.
- **Invalidate by prefix only**: `queryClient.invalidateQueries({ queryKey: ['users'] })` — never the full compound key `['users', page, search, filters]`.
- **Dates**: parse everything through `toDayjs()`/`toDate()` in `app/lib/date.ts`. Raw `dayjs('11-06-2026')` silently parses day-first as month-first.
- **Forms**: use the `useForm` wrapper from `app/hooks/useForm.ts` (re-validates on language change), not raw RHF. Zod schemas are i18n-aware factories `createXxxSchema(t)`, memoized on `t`.
- **Modals**: always mounted, visibility driven by the modal store's `isOpen`. Never `{isOpen && <Modal/>}` — breaks exit animations. Use `ConfirmDialog` for deletes.
- **Stores**: subscribe to individual slices (`useStore(s => s.field)`), never the whole store. Pass `isFetching` to `<DataTable>` so rows dim during background refetch.
- **Tailwind colors**: use semantic tokens (`text-success`, `bg-warning/15`, `--chart-1`). Never hardcode hex/oklch; never call `useTheme()` in route components — use `dark:` variants.

- **i18n**: three locales in `public/locales/{ru,en,tg}/`, `ru` is `fallbackLng` — a key missing from `ru` renders as the raw key string in every language. Add new keys to all three files in the same commit.

## Backend

NestJS + Prisma + PostgreSQL. API at `VITE_API_URL` (default `http://localhost:4000`, plus `/api`). Swagger at `/api/docs`. Roles `ADMIN`/`OWNER`/`SELLER`. Image uploads use `multipart/form-data` — pass `headers: { 'Content-Type': 'multipart/form-data' }` explicitly in the `api/*` module (the axios instance defaults to JSON) and build the body with `appendToFormData` from `~/lib/form-data`. API response envelopes are inconsistent across endpoints — verify the actual payload shape before typing.
