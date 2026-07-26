# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Authoritative reference

`AGENTS.md` (project root) is the detailed engineering guide — stack table, route structure, RBAC flow, store patterns, conventions tables, full component/lib/type catalogues. Read it for anything beyond the quick reference below. This file intentionally does not duplicate it; it captures the load-bearing facts and the spots where AGENTS.md has drifted from the current code.

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

React Router 7 runs in **SPA mode** (`react-router.config.ts` → `ssr: false`). All routing/data is client-side; only the login auth flow uses `clientLoader` guards.

## Big-picture architecture

- **Path alias**: `~/* → ./app/*` (tsconfig `paths` + `vite-tsconfig-paths`). Always use `~/` — never relative `../../`.
- **Manual routing** in `app/routes.ts` using `layout()`/`route()`/`index()` helpers (not file-system routing, despite `@react-router/fs-routes` being installed). Two layouts: `(auth)/` (login) and `(crm)/` (sidebar+header, protected).
- **Data path**: components → `useQuery`/`useMutation` → `app/api/*` modules → single Axios instance `app/lib/client.ts` (interceptors attach JWT from `token` cookie, handle 401 → redirect to `/login`, toast errors). Never call axios/fetch directly.
- **State**: Zustand *factories*, not ad-hoc stores. `createTableStore()` and `createModalStore<T>()` live in `app/store/`. Each table route gets its own scoped store at `app/routes/(crm)/<entity>/store.ts`; detail pages get their own `id/store.ts` — never share with the list.

## Things that are easy to get wrong

- **Adding a route requires two edits**: register it in `app/routes.ts` AND add it to `ROUTE_PERMISSIONS` in `app/config/permissions.ts`. Unlisted routes silently allow all roles.
- **Adding an action** (a new CUD button): add it to `Action` enum and `ACTION_PERMISSIONS` in `app/config/actions.ts`, then gate the UI with `useCan().can(Action.X)` — never string-compare roles.
- **UI primitives are `@base-ui/react`, NOT Radix.** `app/components/ui/*` (shadcn) uses the `render` prop pattern (`<Trigger render={<button/>}>`), not Radix's `asChild`. Don't copy Radix API patterns.
- **Invalidate by prefix only**: `queryClient.invalidateQueries({ queryKey: ['users'] })` — never the full compound key `['users', page, search, filters]`.
- **Dates**: parse everything through `toDayjs()`/`toDate()` in `app/lib/date.ts`. Raw `dayjs('11-06-2026')` silently parses day-first as month-first.
- **Forms**: use the `useForm` wrapper from `app/hooks/useForm.ts` (re-validates on language change), not raw RHF. Zod schemas are i18n-aware factories `createXxxSchema(t)`, memoized on `t`.
- **Modals**: always mounted, visibility driven by the modal store's `isOpen`. Never `{isOpen && <Modal/>}` — breaks exit animations. Use `ConfirmDialog` for deletes.
- **Stores**: subscribe to individual slices (`useStore(s => s.field)`), never the whole store. Pass `isFetching` to `<DataTable>` so rows dim during background refetch.
- **Tailwind colors**: use semantic tokens (`text-success`, `bg-warning/15`, `--chart-1`). Never hardcode hex/oklch; never call `useTheme()` in route components — use `dark:` variants.

## Where AGENTS.md is stale

- **Action enum is larger** than AGENTS.md's truncated list. Current set adds `CATEGORIES_MANAGE`, `MARKETS_VIEW_BY_ID`, `TRANSACTIONS_CREATE_SALE`, `TRANSACTIONS_REFUND`, plus full `SELLERS_*` and `DEBTORS_*`. Always read `app/config/actions.ts` for the truth.
- **Products use full-page routes, not modals.** `routes.ts` defines `/products/create`, `/products/:id`, `/products/:id/edit` as pages. The old `CreateProductModal`/`EditProductModal` are deleted (see git status). Other entities (users, markets, sellers, debtors) are still modal-based.
- **Products route permissions are split** — Seller can view `/products` and `/products/:id` but not create/edit, which is admin+owner. Check `permissions.ts` rather than assuming.
- AGENTS.md's `getSidebarConfig` notes only Dashboard + Users; the live `navigation.ts` reflects more entries now.

## Backend

NestJS + Prisma + PostgreSQL. API at `VITE_API_URL` (default `http://localhost:4000`, plus `/api`). Swagger at `/api/docs`. Roles `ADMIN`/`OWNER`/`SELLER`. Image uploads use `multipart/form-data` (use `appendToFormData` from `~/lib/form-data`). API response envelopes are inconsistent across endpoints — verify the actual payload shape before typing.
