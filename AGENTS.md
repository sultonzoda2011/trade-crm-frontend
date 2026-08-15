# TradeCRM Frontend — AGENTS.md

## Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Framework | **React Router 7** (SPA mode, `ssr: false`) | `react-router.config.ts` — CSR only, no SSR |
| View | React 19 + TypeScript 5.9 + Vite 7 | HMR via Vite at port 5173 |
| Styling | TailwindCSS 4 + `tw-animate-css` | Classes sorted by `prettier-plugin-tailwindcss` |
| Theme | `next-themes` (`attribute="class"`) | Light/dark/system; tokens in `global.css` |
| UI primitives | shadcn/ui (base-nova) **on `@base-ui/react`** | **NOT** Radix — different APIs |
| State | Zustand (vanilla) | `createTableStore()`, `createModalStore()` factories |
| Data | `@tanstack/react-query` v5 | Global `keepPreviousData` + `staleTime: 60s` |
| HTTP | axios | `~/lib/client.ts` — interceptors for auth + errors |
| Dates | dayjs + `customParseFormat` plugin | Always via `toDayjs`/`toDate` from `~/lib/date.ts` |
| i18n | react-i18next + i18next-http-backend | Locales: `public/locales/{ru,en,tg}/` |
| Icons | lucide-react | Import by name |
| Forms | react-hook-form + `@hookform/resolvers/zod` | Zod schemas with i18n messages |
| Auth | httpOnly `accessToken` cookie; non-httpOnly `user` JSON cookie | RBAC reads the `user` cookie via `getClientUser()` — **not** `jwt-decode` |
| Charts | recharts | Via `~/components/ui/chart.tsx`; used by `app/components/dashboard/` |
| Toasts | sonner | `<Toaster>` in `root.tsx`; flips to `top-center` on mobile |
| Font | Manrope (Google Fonts) | `200..800` weight range |
| Navigation | NProgress (top bar) | Triggered by `useNavigation().state` |
| Overlays | flatpickr (date pickers), cmdk (command palette) | Themed via CSS variables |
| Formatting | prettier + `prettier-plugin-tailwindcss` | Config at `.prettierrc.mjs`. **No** eslint, no biome, no prettier npm script, no test runner |

### Installed but unused — do not reach for these

`radix-ui` is in `package.json` but **nothing in `app/` imports it** — the UI layer is `@base-ui/react`. Also unused: `@tanstack/react-virtual`, `@fontsource-variable/geist` (app uses Manrope from Google Fonts), `@react-router/serve`, `@react-router/node`, `isbot`, `i18next-fs-backend` (SSR-era leftovers), `@tanstack/devtools-vite` (not registered in `vite.config.ts`).

---

## Path alias

```
~/*  →  ./app/*
```

Configured in `tsconfig.json` `paths` + resolved by `vite-tsconfig-paths`. Every import in the app uses `~` — never relative `../../` paths.

---

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR at `http://localhost:5173` |
| `npm run dev:fresh` | `rimraf node_modules/.vite && react-router dev` (fixes HMR issues) |
| `npm run build` | `react-router build` — production build to `build/` |
| `npm run typecheck` | `react-router typegen && tsc` — **must run both** (typegen generates route types from `routes.ts`) |
| `npm run start` | `vite preview --port 3000` — serves the production build |
| `npx prettier --write .` | Format all files (Tailwind class sorting via `prettier-plugin-tailwindcss`) |
| `docker build -t trade-crm . && docker run -p 3000:3000 trade-crm` | Containerised production |

---

## Architecture

### Route structure

Routes are defined **manually** in `app/routes.ts` (no file-system routing despite `@react-router/fs-routes` being installed):

| Path | File |
|---|---|
| *(layout)* | `app/routes/(auth)/layout.tsx` |
| `/login` | `app/routes/(auth)/login/route.tsx` |
| *(layout)* | `app/routes/(crm)/layout.tsx` |
| `/` (index) | `app/routes/(crm)/index.tsx` — **redirect only** |
| `/dashboard` | `app/routes/(crm)/dashboard/route.tsx` |
| `/sellers-report` | `app/routes/(crm)/dashboard/sellers-report.tsx` |
| `/profile` | `app/routes/(crm)/profile/route.tsx` |
| `/users`, `/users/:id` | `app/routes/(crm)/users/route.tsx`, `users/id/route.tsx` |
| `/markets`, `/markets/:id` | `app/routes/(crm)/markets/route.tsx`, `markets/id/route.tsx` |
| `/my-market` | `app/routes/(crm)/my-market/route.tsx` |
| `/sellers`, `/sellers/:id` | `app/routes/(crm)/sellers/route.tsx`, `sellers/id/route.tsx` |
| `/products`, `/products/create`, `/products/:id`, `/products/:id/edit` | `app/routes/(crm)/products/…` |
| `/categories`, `/categories/:id` | `app/routes/(crm)/categories/route.tsx`, `categories/id/route.tsx` |
| `/debtors`, `/debtors/:id` | `app/routes/(crm)/debtors/route.tsx`, `debtors/id/route.tsx` |
| `/transactions`, `/transactions/create`, `/transactions/:id` | `app/routes/(crm)/transactions/…` |
| `/403` | `app/routes/(crm)/forbidden/route.tsx` |
| `*` | `app/routes/(crm)/notfound/route.tsx` |

- **`/` is not the dashboard.** `(crm)/index.tsx` renders `null`; its `clientLoader` redirects `Role.Seller` → `/transactions`, everyone else → `/dashboard`.
- `/sellers-report` is registered **flat**, but its file lives under `dashboard/`. The nested-looking file path is not the URL — link to `/sellers-report`, never `/dashboard/sellers-report`.
- **AuthLayout** (`app/routes/(auth)/layout.tsx`): `min-h-screen grid lg:grid-cols-2`, left panel has branding + quote, right panel has `<Outlet />`. Includes `LanguageSwitcher` + `ModeToggle`.
- **CrmLayout** (`app/routes/(crm)/layout.tsx`): calls `getClientUser()` then `canAccess(user.role, pathname)` in `clientLoader` — it does **not** call `requireAuth` (in SPA mode `request.headers` carries no Cookie). Denied access redirects to **`/403`**.

```
<SidebarProvider className="bg-sidebar h-dvh">
  <AppSidebar />
  <div className="m-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm">
    <Header />
    <ScrollArea className="bg-background min-h-0 flex-1">
      <div className="p-3 md:p-6"><Outlet /></div>
    </ScrollArea>
  </div>
</SidebarProvider>
```

Scrolling lives in `~/components/ui/scroll-area` — there is no `<main className="scrollbar-hide">` and no `key={pathname}` remount wrapper.

**When adding a new route**, you now need **four** edits: `app/routes.ts`, `app/config/permissions.ts` (`ROUTE_PERMISSIONS`), `app/config/actions.ts` (`ACTION_PERMISSIONS`, if it has gated UI), and `API_ROUTE_ACTIONS` in `app/lib/client.ts` for any new endpoint.

### Route folder convention

There is **no `components/` subfolder** in any route folder:

```
app/routes/(crm)/<entity>/
  route.tsx              ← list page (default export)
  store.ts               ← createTableStore + createModalStore for this entity
  configs/
    columns.tsx          ← getColumns({ t, ... }) via createColumnHelper
    filters.ts           ← get<Entity>Filters(t, ...dynamicOptions) → FilterConfig[]
  id/route.tsx           ← detail page
  create/route.tsx       ← full-page create form (only where CUD is page-based)
  id/edit/route.tsx      ← full-page edit form (products only)
```

Modals go in `app/components/modals/`, chart/widget components in `app/components/dashboard/`, anything reusable in `app/components/shared/`.

**Page-based vs modal-based CUD**: products are fully page-based; transactions use a create page plus a pay modal and delete confirm; everything else is modal-based. This drives which keys a `store.ts` declares.

### Auth & RBAC

There are **three** permission surfaces. A new gated feature usually needs all three.

| Concept | Implementation | Location |
|---------|---------------|----------|
| Credential | httpOnly `accessToken` cookie (15 min), set by the backend | — |
| Client identity | non-httpOnly `user` cookie: URL-encoded JSON `UserInfo`, written by `setUserCookie()` on login | `~/lib/auth-utils.ts` |
| Read identity | `getClientUser()` — parses the `user` cookie, validates the role | `~/lib/auth-utils.ts` |
| Route guard | `getClientUser()` + `canAccess(role, pathname)` in `(crm)/layout.tsx` `clientLoader` | `~/config/permissions.ts` |
| Action map | `ACTION_PERMISSIONS` — `Action` → `Role[]` | `~/config/actions.ts` |
| API pre-flight | `API_ROUTE_ACTIONS` — checked in the axios **request** interceptor | `~/lib/client.ts` |
| UI gate | `useCan()` → `can(Action.X)` or `can(Role.X)` | `~/hooks/useCan.ts` |
| Role enum | `Admin`, `Owner`, `Seller` | `~/types/common.ts` |

**Session flow**: login → backend sets 2 cookies (`accessToken`, `user`) → `setUserCookie()` → role-aware redirect via `getRedirectPath`. On a 401, `~/lib/client.ts` surfaces the error and calls `navigateTo('/login')` — an SPA navigation through the `setNavigate`-injected router callback, not a page reload.

**`canAccess(role, pathname)`** collects *all* patterns matching `matchPath({ path, end: true })`, sorts by descending pattern length, and checks the longest. Unmatched routes still return `true` (open to every authenticated role).

`auth-utils.ts` deliberately contains **no** header-reading or token-expiry helpers: in SPA mode `request.headers` carries no Cookie, and `accessToken` is httpOnly so its expiry cannot be inspected from JS. Expiry is handled reactively — a 401 triggers  in `~/lib/client.ts`. Do not reintroduce a `requireAuth(request)` or `isTokenExpired(token)` helper; they cannot work here.

**How `useCan` works** (`app/hooks/useCan.ts`):

- Reads `getClientUser()` (the `user` cookie) — no API call, no JWT decode
- `can(Action.USERS_CREATE)` → looks up `ACTION_PERMISSIONS[Action.USERS_CREATE]` → checks if the user's role is in the allowed list
- `can(Role.Admin)` → direct role comparison
- `can([Action.USERS_VIEW, Action.USERS_EDIT])` → checks if ANY match
- Returns `{ can, canAny, role, user }`; also exports `type Permission = Role | Role[] | Action | Action[]`

### Client-side API RBAC pre-flight

The axios **request** interceptor checks the outgoing URL against `API_ROUTE_ACTIONS` and rejects locally with `new Error('Access denied: <ACTION>')` plus a toast, before any network call. It does **not** attach an `Authorization` header — the instance uses `withCredentials: true` and the browser sends the cookie.

Consequences worth knowing: a new endpoint with no row in `API_ROUTE_ACTIONS` is silently **allowed**, and a mismatched row **blocks a legitimate call** before it leaves the browser.

### Data fetching

**Every** HTTP call goes through `app/lib/client.ts` — an Axios instance:

```
apiClient = axios.create({ baseURL: VITE_API_URL + '/api', withCredentials: true })
```

- **Request interceptor**: performs the client-side RBAC pre-flight against `API_ROUTE_ACTIONS` (see Auth & RBAC). It does **not** set an `Authorization` header — auth rides on the httpOnly cookie.
- **Response interceptor**:
  
  - **Network error** → toast `errors.noConnection`
  - **4xx/5xx** → toast mapped i18n key (`errors.badRequest`, `errors.forbidden`, etc.) or server message
  - **Silent URLs** (`/auth/login`) → no toast, error is just passed through

API modules live in `app/api/`. Shared list signature for `users`, `markets`, `products`, `sellers`, `debtors`, `transactions`, `categories`:

```ts
getAll(page = 1, limit = 20,
       options: { search?, dateFrom?, dateTo?, sortBy?, sortOrder?: 'asc' | 'desc' } = {},
       filters: ActiveFilter[] = [])
```

Query params are assembled as `{ page, limit, ...options, ...filtersToParams(filters) }`.

| File | Export | Endpoints | Body |
|------|--------|-----------|------|
| `api/auth.ts` | `authApi` | `login(payload)` → POST `/auth/login`; `logout()` → POST `/auth/logout` | JSON |
| `api/users.ts` | `usersApi` | `getAll`, `getById(id)`, `create(formData)`, `update({formData, id})`, `delete(id)` → `/users` | multipart |
| `api/markets.ts` | `marketsApi` | same five → `/markets` | multipart |
| `api/products.ts` | `productsApi` | same five → `/products` | multipart |
| `api/categories.ts` | `categoriesApi` | same five → `/categories` | multipart |
| `api/sellers.ts` | `sellersApi` | same five → `/sellers` | multipart |
| `api/debtors.ts` | `debtorsApi` | `getAll`, `getById`, `create(request)`, `update({request, id})`, `delete` → `/debtors` | JSON |
| `api/transactions.ts` | `transactionsApi` | the five, plus `pay({request, id})` → PATCH `/transactions/:id/pay` and `refund(id)` → POST `/transactions/:id/refund` | JSON |
| `api/dashboard.ts` | `dashboardApi`, `DashboardParams` | `get(params?)` → `/dashboard`; `getSellersReport(params?)` → `/dashboard/sellers-report`. Params `{ period?, sellerId?, dateFrom?, dateTo? }` | — |
| `api/profile.ts` | `profileApi` | `getProfile()` → GET `/profile`; `updateProfile(formData)` → PATCH `/profile` (multipart); `updatePassword(payload)` → PATCH `/profile/password` | mixed |

Convention: **image-bearing entities take `FormData`; pure-data entities take typed request objects.**

**TanStack Query** is configured in `~/lib/query-client.ts`:

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,       // 1 minute global
      placeholderData: keepPreviousData,  // pagination stays on screen
    },
  },
})
```

- Use `staleTime: 30_000` for list queries that change frequently
- Always pass `isFetching` to `<DataTable>` (it dims current rows during background refetch)
- Invalidate by **prefix** only: `queryClient.invalidateQueries({ queryKey: ['users'] })` — never the full key with page/search/filters

### State management

#### Table store (`createTableStore`)

Factory in `~/store/useTableStore.ts`. Creates a Zustand store with:

```ts
{ page, limit, search, filters: ActiveFilter[], activeFiltersCount }
{ setPage, setLimit, setSearch, setFilter, removeFilter, setFilters, resetFilters }
```

**Every table page must have its own scoped store** in a `store.ts` file inside the route folder:

```ts
// app/routes/(crm)/users/store.ts
import { createTableStore } from '~/store/useTableStore';
export const useUsersStore = createTableStore();
```

Config: `createTableStore({ initiallimit: 12 })` — use when default page size (10) doesn't match design.

**Behavior**: `setLimit`, `setSearch`, `setFilter`, `setFilters` and `resetFilters` all reset `page` to 1. `removeFilter` does not.

Eight `store.ts` files exist today, each in its route folder, exporting a table store and/or a modal store from the same file:

| File | Exports |
|---|---|
| `users/store.ts` | `useUsersStore`, `useUsersModals` — `{delete: string, create: null, edit: User}` |
| `markets/store.ts` | `useMarketsStore`, `useMarketsModals` — `{delete, create, edit: Market}` |
| `sellers/store.ts` | `useSellersStore`, `useSellersModals` — `{delete, create, edit: Seller}` |
| `debtors/store.ts` | `useDebtorsStore`, `useDebtorsModals` — `{delete, create, edit: Debtor}` |
| `categories/store.ts` | `useCategoriesStore`, `useCategoriesModals` — `{delete, create, edit: CategoryDetail}` |
| `products/store.ts` | `useProductsStore`, `useProductsModals` — `{delete: string}` only (create/edit are pages) |
| `transactions/store.ts` | `useTransactionsStore`, `useTransactionsModals` — `{delete: string, pay: Transaction}` |
| `profile/store.ts` | `useProfileModals` only — `{edit: Profile, password: null}` (no table) |

Two conventions this encodes: the modal-key set **tracks whether CUD is modal-based or page-based**, and a `store.ts` may contain a modal store with no table store at all.

#### Modal store (`createModalStore`)

Factory in `~/store/createModalStore.ts`. Creates a Zustand store from a typed map:

```ts
type UsersModals = {
  delete: string;    // deleteModal gets a string id
  create: null;      // createModal gets nothing
  edit: User;        // editModal gets full User object
};
export const useUsersModals = createModalStore<UsersModals>(['delete', 'create', 'edit']);
```

Each key produces `{ isOpen: boolean, data: T | null, open(data?: T) => void, close() => void }`.

**Always subscribe to individual slices** — never the whole store:

```ts
const deleteModal = useUsersModals((s) => s.delete);  // ✓
const modals = useUsersModals();                       // ✗ re-renders on every modal change
```

#### Detail and satellite pages reuse the list store

No `id/store.ts` files exist. Detail pages import the list store directly — `users/id/route.tsx` uses `useUsersModals`, and `my-market/route.tsx` imports `useMarketsModals` from `~/routes/(crm)/markets/store`. Cross-route store reuse is the established convention for satellite pages.

### i18n

- **Languages**: `ru` (default/fallback), `en`, `tg`
- **Namespaces** (12, listed explicitly in `i18nConfig.ns`): `common`, `auth`, `validation`, `users`, `sellers`, `products`, `debtors`, `transactions`, `dashboard`, `markets`, `categories`, `profile`. `fallbackNS: 'common'`.
- **Storage**: language saved in `lng` cookie (365 days), read in `root.tsx` `clientLoader` and written to `<html lang>`
- **Detection**: `entry.client.tsx` configures `detection: { order: ['htmlTag'], caches: [] }` with `i18next-http-backend` loading `/locales/{{lng}}/{{ns}}.json`, and `ns: getInitialNamespaces()` from `remix-i18next/client`
- **Usage**: `useTranslation(['users', 'common'])` inside entity routes; `useTranslation('common')` for shared UI
- **Error messages**: schema factories take `t: TFunction` and embed `t('errorKey', { ns: 'validation' })`

All 12 files exist in all 3 languages and are currently **key-for-key in sync** (verified 2026-08-10). Keep them that way: `ru` is `fallbackLng`, so a key missing from `ru` has **no fallback** and renders as a raw key string in every language. Add new keys to all three files in the same commit.

### Theme

**Semantic color tokens** defined in `app/styles/global.css` with light + dark values:

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--success` | oklch green | lighter green | `text-success`, `bg-success/15` |
| `--warning` | oklch amber | lighter amber | `text-warning`, `bg-warning/15` |
| `--destructive` | oklch red | same red | `text-destructive`, `bg-destructive/15` |
| `--chart-1..5` | blue/green/amber/red/violet | same hues | Recharts `fill`/`color` via `var(--chart-1)` |

- Never hardcode hex/oklch for status colors
- Use `dark:` variant exclusively — don't use `useTheme()` hook in route components
- `ThemeProvider` is in `~/components/theme-provider.tsx` (wraps `next-themes` with `attribute="class"`, `defaultTheme="system"`)
- `ModeToggle` in `~/components/layout/ModeToggle.tsx` — renders in sidebar + UserNav dropdown

### Layout

```
<SidebarProvider>                      ← base-ui, collapsible
  <AppSidebar />                       ← getSidebarConfig → getVisibleNavigation → NavMain
  <div className="m-2 rounded-2xl border shadow-sm">
    <Header />                         ← SidebarTrigger + CommandPalette + ModeToggle + UserNav
    <main className="scrollbar-hide">
      <div key={pathname} className="animate-page-enter">
        <Outlet />
      </div>
    </main>
  </div>
</SidebarProvider>
```

- The `key` on the animated wrapper equals `location.pathname` (or `/dashboard` for all dashboard child routes) — forces re-mount + re-animate on route change
- `SidebarTrigger` is from `~/components/ui/sidebar.tsx` (base-ui based)
- `Header` mounts the `CommandPalette` (Ctrl+K), reads `t('palette.trigger')` for the label

### Motion

| Class | What | Duration |
|-------|------|----------|
| `.animate-shimmer` | Skeleton loading shimmer | 1.6s linear infinite |

`prefers-reduced-motion` is handled globally in `global.css` — do NOT add per-component overrides.

`.animate-page-enter`, `.animate-card-enter` and `--stagger-index` are still defined in `global.css` but are **referenced nowhere in `app/`** — the route-transition wrapper was dropped from `(crm)/layout.tsx` during the ScrollArea refactor. Treat them as dead CSS until someone confirms the intent.

Also in `global.css` and worth knowing: `--text-2xs: 0.6875rem` (what makes the `text-2xs` convention work), `--font-sans`, two utilities `@utility scrollbar-hide` and `@utility scrollbar-thin`, the `l7-1`/`l7-2` keyframes, and the splash-screen styles (`#app-splash`, `.splash-content`, `.splash-logo`, `.splash-loader`, `.splash-hint`). A second stylesheet, `app/styles/nprogress.css`, is imported from `root.tsx`.

Note on chart tokens: `--chart-2/3/4` are **aliases** of `--success`/`--warning`/`--destructive`, so only `--chart-1` and `--chart-5` differ between light and dark.

### Providers (`root.tsx`)

```
<Splash locale={locale} />
<QueryClientProvider client={getQueryClient()}>
  <ThemeProvider>
    <NavigationProgress />          ← NProgress on useNavigation().state
    <TooltipProvider>{children}</TooltipProvider>
    <ToasterProvider />             ← sonner, theme-aware, mobile-aware position
  </ThemeProvider>
  {import.meta.env.DEV && <DevTools />}   ← lazy ReactQueryDevtools
</QueryClientProvider>
<ScrollRestoration /> <Scripts />
```

`root.tsx` also runs a `useEffect` calling `setNavigate(navigate)` to wire `~/lib/navigation`, and its `ErrorBoundary` delegates to `~/components/shared/ErrorPage`.

### UI primitives

**Critical**: shadcn components in `app/components/ui/` are built on **`@base-ui/react`**, not `@radix-ui/react-*`. The two packages have completely different APIs:

| Concept | Radix | Base UI |
|---------|-------|---------|
| Portal | `<Portal>` | `<Portal>` (same, but import paths differ) |
| Trigger | `<DropdownMenuTrigger asChild>` | `<DropdownMenuTrigger render={<button/>}>` |
| Content | direct children | `render` prop pattern |
| Combobox | separate package | built into base-ui |

**Button + `render` prop**: When using `render={<Link>}` on a Button, `nativeButton` is handled automatically by `button.tsx` — no manual override needed.

**Available UI components** (29): avatar, badge, bread-crumb, button, card, chart, collapsible, combobox, command, dialog, dropdown-menu, input-group, input, label, pagination, popover, progress, **radio-group**, scroll-area, select, separator, sheet, sidebar, skeleton, switch, table, **tabs**, textarea, tooltip.

- `tabs.tsx` exports `Tabs, TabsList, TabsTrigger, TabsContent`.
- `radio-group.tsx` exports `RadioGroup, Radio` — note `Radio`, not `RadioGroupItem` (base-ui naming).
- `avatar.tsx` also exports `AvatarGroup, AvatarGroupCount, AvatarBadge` (used in `my-market/route.tsx`).

---

## Hooks Reference

| Hook | Location | Signature | Purpose |
|------|----------|-----------|---------|
| `useDataTable` | `~/hooks/useDataTable` | `({ columns, data, storageKey?, initialVisibility?, rowSelection?, onRowSelectionChange?, getRowId? })` → `{ table }` | Wraps `useReactTable`; column visibility persisted to `localStorage[storageKey]`. Also supports row selection and custom row ids |
| `useForm` | `~/hooks/useForm` | `(options: UseFormProps<T>)` → RHF return | i18n-aware wrapper — `form.trigger()` on `i18n.language` change, but only if `formState.isSubmitted` |
| `useDebounce` | `~/hooks/useDebounce` | `(value: T, delay = 300)` → `debouncedValue` | Standard debounce, used for search inputs before sending to API |
| `useCan` | `~/hooks/useCan` | `()` → `{ can, canAny, role, user }` | Reads `getClientUser()` (the `user` cookie), checks `Action`/`Role` against `ACTION_PERMISSIONS` |
| `useFilterParams` | `~/hooks/useFilterParams` | `({ page, limit, search, filters, setPage, setLimit, setSearch, setFilters, filterConfigs })` | Two-way sync between a table store and URL search params — hydrates from the URL once on mount, then writes back with `{ replace: true }`. Omits `page` when 1 and `limit` when 10 |
| `useFlatpickr` | `~/hooks/useFlatpickr` | `(options: Partial<Options>)` → `{ inputRef, fpRef }` | Shared flatpickr lifecycle (init once, destroy on unmount); backs the date field components |
| `useIsMobile` | `~/hooks/use-mobile` | `(breakpoint = 767)` → `boolean` | `matchMedia` listener, used for responsive toaster position + layout |

`useUser` does **not** exist — there is no `/me` query hook.

**Page-size trap**: three places encode a default page size — `createTableStore` defaults `limit` to 10, every `api.getAll` defaults `limit` to 20, and `useFilterParams` treats 10 as "default" when deciding to omit `limit` from the URL.

---

## Store Patterns (with code)

### Pattern: Table store + page

```ts
// 1. app/routes/(crm)/users/store.ts — create scoped store
export const useUsersStore = createTableStore();

// 2. In the page component
const { page, limit, search, filters, setPage, setLimit, setSearch, setFilters, resetFilters } = useUsersStore();
const debouncedSearch = useDebounce(search);

// 3. Merge debounced search into filter array
const queryFilters = useMemo(
  () => (debouncedSearch ? [{ key: 'Name', value: debouncedSearch }, ...filters] : filters),
  [debouncedSearch, filters],
);

// 4. Fetch with TanStack Query
const { data, isLoading, isFetching } = useQuery({
  queryKey: ['users', page, limit, debouncedSearch, filters],
  queryFn: () => usersApi.getAll(page, limit, queryFilters),
  staleTime: 30_000,
});

// 5. useDataTable
const { table } = useDataTable({
  columns: useMemo(() => getColumns({ t }), [t]),
  data: users,
  storageKey: 'users-table-columns',
});

// 6. Render
<DataTable table={table} isLoading={isLoading} isFetching={isFetching} page={page} limit={limit}
  totalPages={totalPages} onPageChange={setPage} onLimitChange={setLimit} />
```

### Pattern: Modal store + modals

```ts
// 1. Store setup (same store.ts)
type UsersModals = {
  delete: string;     // delete → passes id
  create: null;       // create → no data
  edit: User;         // edit → passes full User
};
export const useUsersModals = createModalStore<UsersModals>(['delete', 'create', 'edit']);

// 2. Trigger (in action cell)
const editModal = useUsersModals((s) => s.edit);
const deleteModal = useUsersModals((s) => s.delete);
// ...
onClick={() => editModal.open(row)}       // row is full User
onClick={() => deleteModal.open(row.id)}  // row.id is string

// 3. Consume (modal component)
const editModal = useUsersModals((s) => s.edit);
<Modal open={editModal.isOpen} onClose={editModal.close}>
  // use editModal.data — typed as User | null
</Modal>

// 4. ConfirmDialog for delete
<ConfirmDialog open={deleteModal.isOpen}
  onOpenChange={(open) => !open && deleteModal.close()}
  onConfirm={() => deleteModal.data != null && deleteUser(deleteModal.data)}
  isLoading={isDeletePending} type="danger" title="..." description="..." />

// 5. Mutation in modal
const { mutate, isPending } = useMutation({
  mutationFn: (data: CreateUserSchema) => usersApi.create({ request: data as never }),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: ['users'] });
    toast.success(t('createSuccess'));
    createModal.close();
    reset();
  },
  onError: () => toast.error(t('createError')),
});
```

### Pattern: Dynamic filter options

Filter factories accept optional option arrays and push select filters only when those arrays are non-empty — e.g. `getTransactionFilters(t, debtorOptions?, categoryOptions?, productOptions?)`. The page feeds them from `useQuery` calls keyed like `['debtors', 'list']` with `staleTime: 60_000`, mapped through `mapToOptions`.

### Pattern: Cross-page filter handoff via router state

Detail pages deep-link into a pre-filtered list by passing router `state`. The list page reads it once in a `useRef`-guarded effect, calls `setFilter(...)`, then clears it:

```ts
window.history.replaceState({}, document.title);
```

`transactions/route.tsx` does this for `location.state.fromDebtorId` and `fromSellerId`.

---

## Shared Components Catalog

| Component | Path | Description |
|-----------|------|-------------|
| `ByIdSkeleton` | `~/components/shared/ByIdSkeleton` | Full-page shimmer skeleton (breadcrumb + 2 panels) for detail pages |
| `ColumnToggle` | `~/components/shared/ColumnToggle` | Dropdown to show/hide table columns with switches; supports Show All, Hide All, Reset |
| `CommandPalette` | `~/components/shared/CommandPalette` | Global Ctrl+K search — 3 tiers: quick actions (RBAC-filtered), pages (from sidebar), entity search (API queries) |
| `ConfirmDialog` | `~/components/shared/ConfirmDialog` | Confirmation modal; types: `danger`/`warning`/`success`/`info`; loading spinner |
| `CustomInput` | `~/components/shared/CustomInput` | `<InputGroup>` with optional `startIcon`/`endIcon` |
| `CustomSelect` | `~/components/shared/CustomSelect` | Combo-box select (base-ui Combobox); supports single/multi, chips, search, clearable |
| `DataTable` | `~/components/shared/DataTable` | Full-featured tanstack-table wrapper; handles loading skeletons, empty state, error state, pagination, dimmed rows during isFetching, sticky pinned columns |
| `DateInputField` | `~/components/shared/DateInputField` | Flatpickr date picker with ru/en/tg locale; emits `YYYY-MM-DD` |
| `EmptyState` | `~/components/shared/EmptyState` | Centered "no data" display with Inbox icon + message (falls back to `t('table.noData')`) |
| `FileInputField` | `~/components/shared/FileInputField` | File/image upload; variants: `dropzone` (drag & drop + preview) and `simple` (button + filename); `compact` size for modals |
| `FilterField` | `~/components/shared/FilterField` | Renders a single filter input based on `FilterConfig` type discriminator |
| `FilterSheet` | `~/components/shared/FilterSheet` | Slide-over sheet with filter form; handles flatpickr portal interaction; reset + apply buttons |
| `FormSection` | `~/components/shared/FormSection` | Section wrapper with icon + title + divider for form pages |
| `InfoItem` | `~/components/shared/InfoItem` | Label-value display pair (uppercase label, bold value) for detail pages |
| `Modal` | `~/components/shared/Modal` | Base modal using shadcn `Dialog` with `modal={false}` (fixes base-ui ComboBox portal inside dialog) |
| `UniversalImage` | `~/components/shared/UniversalImage` | Image component with loading/error/empty states; custom fallback render function; fades in on load |
| `UserAvatar` | `~/components/shared/UserAvatar` | Avatar with fallback initials + optional subtitle |
| `ActiveFilterPills` | `~/components/shared/ActiveFilterPills` | Removable chips for applied filters; resolves human labels from `FilterConfig[]` |
| `DetailHeader` | `~/components/shared/DetailHeader` | Detail-page hero: image, name, subtitle, badge row, action slot |
| `EntityCard` | `~/components/shared/EntityCard` | Compact entity card with image, sub-info and a "view" link carrying router `state` |
| `ErrorPage` | `~/components/shared/ErrorPage` | Full-page error display (code, icon, i18n title/description, back-home link). **Default export**, used by `root.tsx` ErrorBoundary |
| `InfoLink` | `~/components/shared/InfoLink` | Inline `<Link>` styled for detail-panel values; forwards `state` |
| `ListLink` | `~/components/shared/ListLink` | `<Link>` preset for list rows; `ComponentProps<typeof Link>` passthrough |
| `ListPageToolbar` | `~/components/shared/ListPageToolbar` | Standard list-page header bar: search input, filter sheet trigger, column toggle, action slot |
| `MarketEntityTabs` | `~/components/shared/MarketEntityTabs` | Tabbed panel (products / sellers / transactions) for market and my-market pages; built on `ui/tabs` |
| `NotFoundBlock` | `~/components/shared/NotFoundBlock` | In-page "entity not found" block with a back button, for detail routes |
| `PanelViewAll` | `~/components/shared/PanelViewAll` | "View all (n)" footer link for dashboard/detail panels |
| `QuickActions` | `~/components/shared/QuickActions` | Titled grid of icon action buttons for detail pages |
| `RowActionsCell` | `~/components/shared/RowActionsCell` | Exports **two**: `RowActionsCell` (table action-cell wrapper) and `IconActionButton` (icon button with tooltip label; `danger`/`outline`/`disabled` variants) |
| `SkeletonList` | `~/components/shared/SkeletonList` | `count` × `height` skeleton rows for list/panel loading states |
| `StatCard` | `~/components/shared/StatCard` | KPI card: icon, label, value, optional link + `state` |
| `TransactionRow` | `~/components/shared/TransactionRow` | One transaction as a `ListLink` row: amount, status badge, optional debtor; takes `t` directly |
| `TransactionStatusBadge` | `~/components/shared/TransactionStatusBadge` | Badge for `TransactionStatus`, styled from `TRANSACTION_STATUS_BADGE` |

`DateRangePicker` and `MonthPicker` were **deleted** — do not reference them.

**Other component folders:**

- `app/components/layout/` — `Header`, `LanguageSwitcher`, `ModeToggle`, `NavMain`, `Panel`, `Sidebar`, `UserNav`. `Panel` (props `children`, `className`, `title`, `actions`) is the standard card wrapper. `Header` composes `SidebarTrigger`, the palette trigger button, `LanguageSwitcher`, `ModeToggle`, `UserNav`, and now **owns `CommandPalette` state** (`<CommandPalette open onOpenChange>`).
- `app/components/dashboard/` — `DebtorRiskBadge`, `OverdueAlertCard`, `PaymentDistributionChart`, `RevenueTrendChart`.
- `app/components/modals/` — 13 modals: `ChangePasswordModal`, `CreateCategoryModal`, `CreateDebtorModal`, `CreateMarketModal`, `CreatePaymentModal`, `CreateSellerModal`, `CreateUserModal`, `EditCategoryModal`, `EditDebtorModal`, `EditMarketModal`, `EditProfileModal`, `EditSellerModal`, `EditUserModal`. There are **no product modals** — products are full-page routes.

**Form components** (`~/components/ui/form/`): `FormInput`, `FormCustomSelect`, `FormDateInput`, `FormFileInput`, `FormTextarea` — all `<Controller>` wrappers that accept `control` from react-hook-form and render label + input + error message.

---

## Config Reference

### `~/config/actions.ts`

29 members (enum values are string-identical to their keys):

```
DASHBOARDS_VIEW
USERS_VIEW USERS_CREATE USERS_EDIT USERS_DELETE
MARKETS_VIEW MARKETS_VIEW_BY_ID MARKETS_CREATE MARKETS_EDIT MARKETS_DELETE
PRODUCTS_VIEW PRODUCTS_CREATE PRODUCTS_EDIT PRODUCTS_DELETE
CATEGORIES_MANAGE
TRANSACTIONS_VIEW TRANSACTIONS_CREATE TRANSACTIONS_CREATE_SALE TRANSACTIONS_EDIT TRANSACTIONS_DELETE TRANSACTIONS_REFUND
SELLERS_VIEW SELLERS_CREATE SELLERS_EDIT SELLERS_DELETE
DEBTORS_VIEW DEBTORS_CREATE DEBTORS_EDIT DEBTORS_DELETE
```

`ACTION_PERMISSIONS` has **no summarizable rule** — read the table, don't infer:

| Action | Roles |
|---|---|
| `DASHBOARDS_VIEW` | Admin, Owner |
| `USERS_VIEW/CREATE/EDIT/DELETE` | **Admin only** |
| `MARKETS_VIEW` | **Admin only** |
| `MARKETS_VIEW_BY_ID` | Admin, Owner |
| `MARKETS_CREATE` | **Admin only** |
| `MARKETS_EDIT` | Admin, Owner |
| `MARKETS_DELETE` | **Admin only** |
| `PRODUCTS_VIEW/CREATE/EDIT/DELETE` | Admin, Owner |
| `CATEGORIES_MANAGE` | Admin, Owner |
| `TRANSACTIONS_VIEW` | Admin, Owner, **Seller** |
| `TRANSACTIONS_CREATE` | Admin, Owner, **Seller** |
| `TRANSACTIONS_CREATE_SALE` | Admin, Owner |
| `TRANSACTIONS_EDIT/DELETE/REFUND` | Admin, Owner |
| `SELLERS_VIEW/CREATE/EDIT/DELETE` | Admin, Owner |
| `DEBTORS_VIEW/CREATE/EDIT` | Admin, Owner, **Seller** |
| `DEBTORS_DELETE` | Admin, Owner |

Note the split inside transactions: a Seller may create a transaction but only a `DEBT` one — `TRANSACTIONS_CREATE_SALE` gates the SALE option (the backend enforces the same rule).

### `~/config/permissions.ts`

`ROUTE_PERMISSIONS` — 20 entries:

```
'/dashboard'            [Admin, Owner]        '/products/create'      [Admin, Owner]
'/sellers-report'       [Admin, Owner]        '/products/:id'         [Admin, Owner, Seller]
'/profile'              [Admin, Owner, Seller]'/products/:id/edit'    [Admin, Owner]
'/users'                [Admin]               '/products'             [Admin, Owner, Seller]
'/users/:id'            [Admin]               '/transactions/create'  [Admin, Owner, Seller]
'/markets'              [Admin]               '/transactions/:id'     [Admin, Owner, Seller]
'/markets/:id'          [Admin, Owner]        '/transactions'         [Admin, Owner, Seller]
'/my-market'            [Owner]  ← Owner ONLY '/categories'           [Admin, Owner]
'/sellers'              [Admin, Owner]        '/categories/:id'       [Admin, Owner]
'/sellers/:id'          [Admin, Owner]        '/403'                  [Admin, Owner, Seller]
```

`canAccess(role, pathname)`: collects every `matchPath({ path, end: true })` hit, sorts by descending pattern length, checks the longest. No match → `true`.

**`/debtors` and `/debtors/:id` are guarded for all three roles** (`[Admin, Owner, Seller]`), matching `DEBTORS_VIEW`. Note the failure mode this closes: `canAccess` returns `true` when *no* pattern matches, so an unlisted route is open to every authenticated role.

### `~/config/navigation.ts`

```ts
getSidebarConfig(t): NavItem[]       // sidebar menu items with icons and action bindings
getVisibleNavigation(items, can): NavItem[]  // filters items recursively by RBAC
```

Ten items, none commented out:

| Title key | url | icon | action |
|---|---|---|---|
| `navigation.dashboard` | `/` | `LayoutDashboard` | `DASHBOARDS_VIEW` |
| `navigation.users` | `/users` | `Users` | `USERS_VIEW` |
| `navigation.markets` | `/markets` | `StoreIcon` | `MARKETS_VIEW` |
| `navigation.myMarket` | `/my-market` | `StoreIcon` | gated by `roles: [Role.Owner]`, not by an action — `MARKETS_VIEW_BY_ID` is broader (Admin + Owner) than the route |
| `navigation.sellers` | `/sellers` | `Store` | `SELLERS_VIEW` |
| `navigation.products` | `/products` | `Package` | `PRODUCTS_VIEW` |
| `navigation.categories` | `/categories` | `Tag` | `CATEGORIES_MANAGE` |
| `navigation.debtors` | `/debtors` | `Store` | `DEBTORS_VIEW` |
| `navigation.transactions` | `/transactions` | `ReceiptText` | `TRANSACTIONS_VIEW` |
| `navigation.sellersReport` | `/sellers-report` | `BarChart3` | `SELLERS_VIEW` |

`NavItem` supports: `title`, `url`, `icon`, `action`, `roles`, `items` (nested), `comingSoon` (renders disabled with badge).

**Every `url` here must be a path registered in `routes.ts`, and its `action` must gate the same roles as that route's `ROUTE_PERMISSIONS` entry.** Both invariants have been violated before: the sellers-report link pointed at the non-existent `/dashboard/sellers-report`, and "My Market" was gated by `MARKETS_VIEW_BY_ID` (Admin + Owner) while `/my-market` is Owner-only, so an Admin saw the link and landed on `/403`. When adding a nav item, check the route table and the permission table together.

### `~/config/period.ts`

`Period = 'today' | 'week' | 'month' | 'year'`, `PERIOD_OPTIONS: ReadonlyArray<{ value: Period; labelKey: string }>` — dashboard period selector.

### `~/config/transactionBadges.ts`

`TRANSACTION_TYPE_BADGE: Record<TransactionType, string>` and `TRANSACTION_STATUS_BADGE: Record<TransactionStatus, string>` — Tailwind class strings per state.

Partial exception to the semantic-token rule: `PARTIAL` uses raw palette classes (`border-sky-500/30 bg-sky-500/15 text-sky-500`) because there is no `--info` token.

### `~/config/enumOptions.ts`

| Export | Type | Purpose |
|--------|------|---------|
| `STATUS_CONFIG` | `Record<Status, { label: (t) => string; className: string }>` | Badge styling for Active/Inactive/Completed — note `label` is a **function** |
| `ROLE_CONFIG` | `Record<Role, …>` | Badge styling per role |
| `getStatusOptions(t)` | `{value, label}[]` | Select options for Status filter |
| `getDayLabels(t)` | `string[]` | Mon-Sun day labels |
| `getDayOptions(t)` | `{value, label}[]` | Day-of-week select options (1=Mon..7=Sun) |
| `getRoleOptions(t)` | `{value, label}[]` | Role select options |
| `getRoleFilterOptions(t)` | `{value, label}[]` | Role options including the "all" filter entry |
| `getTransactionTypeOptions(t)` | `{value, label}[]` | DEBT/SALE/REFUND select options |
| `getPaymentTypeOptions(t)` | `{value, label}[]` | CASH/CARD/CREDIT select options |

---

## Lib Utilities

| File | Exports | Purpose |
|------|---------|---------|
| `~/lib/auth-utils` | `UserInfo`, `getUserFromCookie`, `setUserCookie`, `removeUserCookie`, `getClientUser` | `user` cookie ops only. **`getClientUser()` is the real guard primitive.** No `Request.headers` readers — SPA mode makes them impossible |
| `~/lib/client` | `apiClient` | Axios instance with RBAC pre-flight + error-toast interceptors |
| `~/lib/navigation` | `setNavigate(fn)`, `navigateTo(path)`, `redirectToLogin(redirectTo?)` | Module-level holder for the router `navigate`, injected once from `root.tsx` so non-React code (the axios interceptor) can navigate without a page reload |
| `~/lib/date` | `DateValue`, `toDayjs(value)`, `toDate(value)` | Parse dates in DD-MM-YYYY / DD.MM.YYYY / ISO / Date |
| `~/lib/filtersToParams` | `filtersToParams(filters)` | Convert `ActiveFilter[]` to flat query params |
| `~/lib/form-data` | `appendToFormData(data)` | Object → FormData (handles File, Date, null/undefined) |
| `~/lib/format` | `fmtTJS(v)`, `fmtTime(s)`, `formatDate(date, withTime?)` | TJS currency string (e.g. "1 234 TJS"), time slice, date formatter |
| `~/lib/i18n` | `defaultNS`, `fallbackLng`, `supportedLngs`, `SupportedLng`, `i18nConfig` | i18n configuration |
| `~/lib/mapToOptions` | `mapToOptions(data, valueKey, labelKey)` | Entity array → `{value, label}[]` for selects |
| `~/lib/query-client` | `makeQueryClient`, `getQueryClient` | QueryClient singleton with keepPreviousData |
| `~/lib/utils` | `cn(...inputs)` | `clsx` + `tailwind-merge` — always use for Tailwind class concatenation |

---

## Types

| File | Key Types |
|------|-----------|
| `~/types/common` | `Status` enum (Inactive/Active/Completed), `Role` enum (Admin/Owner/Seller), `ApiResponse<T>`, `PaginatedData<T>`, `PaginationMeta` |
| `~/types/auth` | `User`, `Login`, `LoginResponse` |
| `~/types/users` | `User`, `UserRequest`, `UserInfo`, `CreateUserRequest`, `UsersResponse`, `UserDetailResponse` |
| `~/types/filters` | `ActiveFilter`, `FilterConfig` — **six** variants: input/select/number-range/date/date-range/**boolean** |
| `~/types/markets` | `Market`, `MarketInfo`, `MarketCount`, `MarketsResponse`, `MarketDetailResponse` |
| `~/types/products` | `Product`, `ProductInfo`, `ProductCount`, `ProductUnit` (`'PCS'\|'KG'\|'L'\|'M'\|'BOX'`), `ProductsResponse`, `ProductDetailResponse`, plus **all category types** (`Category`, `CategoryDetail`, `CategoryInfo`, `CategoriesResponse`, `CategoryDetailResponse`, `CreateCategoryRequest`, `UpdateCategoryRequest`) — there is no `types/categories.ts` |
| `~/types/sellers` | `Seller`, `SellerRequest`, `SellersResponse`, `SellerDetailResponse` |
| `~/types/debtors` | `Debtor`, `DebtorInfo`, `DebtorCount`, `DebtorRequest`, `DebtorsResponse`, `DebtorDetailResponse` |
| `~/types/transactions` | `TransactionType` (`'DEBT'\|'SALE'\|'REFUND'`), `PaymentType` (`'CASH'\|'CARD'\|'CREDIT'`), `TransactionStatus` (`'ACTIVE'\|'PARTIAL'\|'PAID'\|'REFUNDED'`), `Transaction`, `TransactionItem`, `Payment`, `CreateTransactionRequest`, `CreateTransactionItemRequest`, `UpdateTransactionRequest`, `CreatePaymentRequest`, `TransactionsResponse`, `TransactionDetailResponse` |
| `~/types/dashboard` | `DashboardStats`, `DashboardData`, `DashboardResponse`, `DashboardRecentTransaction`, `DashboardTopDebtor`, `RevenueTrendData`, `PaymentTypeDistribution`, `SellerReportRow`, `SellersReportResponse` |
| `~/types/profile` | `Profile`, `ProfileResponse`, `UpdatePasswordRequest` |

**Paginated endpoint envelope**: `PaginatedData<T>` = `{ data: T[], meta: { page, limit, total, totalPages } }` wrapped in `ApiResponse<PaginatedData<T>>`.

**API responses are inconsistent**: some endpoints nest data one level deeper (`{ statusCode, data: { ... }, message }`). Always verify the actual response payload before typing — do not assume `{ data: T }` is always the top level.

---

## Code Conventions

### Stores & State

| ✓ DO | ✗ DON'T |
|------|---------|
| Create a scoped store per route: `app/routes/(crm)/entity/store.ts` | Import `createTableStore` directly in a page component |
| Subscribe to individual Zustand slices: `useStore((s) => s.field)` | Subscribe to the whole store object (`useStore()`) — causes unnecessary re-renders |
| Use `createModalStore<T>(['delete', 'create', 'edit'])` with a typed discriminated union | Use separate `useState` calls for modal open/close |
| Pass `createTableStore({ initiallimit: 12 })` when design requires non-default page size | Hardcode page size values in the component |

### Modals

| ✓ DO | ✗ DON'T |
|------|---------|
| Always mount modals — visibility controlled by store's `isOpen` | Conditionally render modals: `{isOpen && <Modal>}` — breaks exit animations |
| Use a single `onAction(action)` callback with discriminated union for column actions | Create separate `onDelete`, `onEdit`, `onView` props on column config |
| Use `ConfirmDialog` for all delete/confirm flows | Show raw `<Modal>` with manual confirm/cancel buttons |
| Reset form after successful create/update: `reset()` | Leave form dirty after modal closes |

### Columns & Tables

| ✓ DO | ✗ DON'T |
|------|---------|
| Use `createColumnHelper<T>()` from `@tanstack/react-table` | Use raw `ColumnDef<T>[]` arrays |
| Export `getColumns({ t, onAction })` factory function from `configs/columns.tsx` | Define columns inline in route component |
| Wrap `useCallback` around action handlers and include in `useMemo` deps | Close over stale state in column action handlers |
| Pass `storageKey` to `useDataTable()` for column visibility persistence | Manage column visibility manually |
| Pass `isFetching` to `<DataTable>` | Show skeleton loader on every page change |

### Filters

| ✓ DO | ✗ DON'T |
|------|---------|
| Use `FilterConfig` discriminated union with factory `getXxxFilters(t)` from `configs/filters.ts` | Invent custom filter data structures |
| Use `filtersToParams(filters)` to convert store filters → API params | Manually construct query params |
| Use `useDebounce(search)` before including in query key | Send raw `search` to API on every keystroke |
| Merge debounced search into filter array with `{ key: SEARCH_KEY, value }` | Keep search and filters in separate API params |

### Data Fetching

| ✓ DO | ✗ DON'T |
|------|---------|
| Use `apiClient` from `~/lib/client.ts` for every API call | Import axios directly or use raw `fetch()` |
| Configure `staleTime: 30_000` on list queries | Rely solely on the global 60s staleTime for lists |
| Invalidate by prefix: `queryClient.invalidateQueries({ queryKey: ['users'] })` | Invalidate with the full compound key `['users', page, search, filters]` |
| Use `useMutation` inline in the page/modal | Extract mutations into separate custom hook files |
| Chain: `invalidateQueries → toast.success → modal.close → reset()` | Forget to invalidate the list after a CUD operation |

### Forms & Validation

| ✓ DO | ✗ DON'T |
|------|---------|
| Use `useForm` from `~/hooks/useForm.ts` (i18n-aware wrapper) | Use raw `useForm` from `react-hook-form` |
| Define Zod schemas as factory: `createXxxSchema = (t: TFunction) => z.object({...})` | Embed raw string error messages in schemas |
| Memoize schema: `const schema = useMemo(() => createXxxSchema(t), [t])` | Create schema outside of `useMemo` |
| Use `zodResolver(schema)` from `@hookform/resolvers/zod` | Write custom validation |
| Use `appendToFormData(data)` to convert objects for multipart/form-data uploads | Manually construct FormData with `append` calls |
| Use `z.union([z.string(), z.number()])` for numeric `<input type="number">` fields | Use `z.number()` directly — HTML inputs yield strings |
| Use `'custom'` string literal for Zod custom issues | Use deprecated `z.ZodIssueCode.custom` |

Naming holds across `app/validations/` (`createXxxSchema(t)` / `updateXxxSchema(t)` + inferred types) with two deviations: `debtor.ts` exports `requestDebtorSchema`, and `date.ts` exports the helpers `optionalDate(t)` / `requiredDate(t)` rather than schemas.

`transactions.ts` sets the precedent for stateful validation: factories take a **second argument** `stockMap?: StockMap` (`Record<string, number>`) so validation can reject over-stock quantities. It also exports the predicate `isOverStock(quantity, available)` and **both** `z.infer` and `z.input` types (`CreateTransactionInput`, `CreateTransactionItemInput`), because the form's raw values differ from the parsed output.

### Dates

| ✓ DO | ✗ DON'T |
|------|---------|
| Parse ALL date values through `toDayjs(value)` / `toDate(value)` from `~/lib/date.ts` | Call `dayjs('11-06-2026')` directly — it silently parses day-first as month-first |
| Type date props as `Date \| string \| null` | Type date props as just `string` |
| Use `formatDate(date, withTime?)` from `~/lib/format.ts` for display | Use ad-hoc `dayjs().format()` calls spread across components |

### i18n

| ✓ DO | ✗ DON'T |
|------|---------|
| Use `useTranslation(['entity', 'common'])` in entity routes | Import `useTranslation` without specifying namespace |
| Pass `t` into config factories: `getColumns({ t })`, `getUserFilters(t)` | Access `useTranslation` inside factory functions |
| Define all user-visible strings in locale JSON files | Hardcode labels, titles, placeholders in JSX |

### RBAC

| ✓ DO | ✗ DON'T |
|------|---------|
| Use `can(Action.USERS_EDIT)` for UI gating | Compare roles as strings: `user.role === 'Admin'` |
| Register new routes in `ROUTE_PERMISSIONS` in `~/config/permissions.ts` | Assume unlisted routes are safe (they ARE open to all roles) |
| Register new actions in `ACTION_PERMISSIONS` in `~/config/actions.ts` when adding CUD buttons | Gate UI with inline role checks |

### Components

| ✓ DO | ✗ DON'T |
|------|---------|
| Use `Panel` as card wrapper for filter/action bars | Use raw `<div>` with manual Tailwind classes |
| Use `<ByIdSkeleton />` for detail page loading state | Use `isLoading ? <Skeleton /> : <div>` inline |
| Use `<BreadCrumbs />` on detail pages with `location.state.fromPath/fromName` from list page | Hardcode breadcrumb paths |
| Use `<InfoItem label={...} value={...} />` in detail info grids | Use `<div><span>{label}</span><span>{value}</span></div>` |
| Use `cn()` from `~/lib/utils.ts` for all Tailwind class merging | Use template literals or `clsx` directly |
| Use semantic color classes (`text-success`, `bg-warning/15`, `text-destructive`) | Hardcode hex colors |
| Use `text-2xs` (11px) as the minimum font size | Use `text-[9px]` or `text-[10px]` arbitrary values |
| Use `<Button render={<Link to={...} />}>` for link buttons | Use `<a>` or `<Link>` styled as button |
| Use `EmptyState` component for empty list views | Render conditional `if (!data.length) return <p>No data</p>` |

### Code Quality

| ✓ DO | ✗ DON'T |
|------|---------|
| Use `useMemo` / `useCallback` for column configs, filter configs, and query filter arrays | Recompute derived data on every render |
| Use `app/lib/query-client.ts`'s `getQueryClient()` singleton | Create a new `QueryClient` per component |
| Place entity type definitions in `app/types/entity.ts` | Inline type definitions in route files |
| Place validation schemas in `app/validations/entity.ts` | Define Zod schemas inside component files |

---

## Backend

| Property | Value |
|----------|-------|
| Framework | NestJS |
| ORM | Prisma |
| Database | PostgreSQL |
| API base | `http://localhost:4000/api/` (set via `VITE_API_URL` in `.env`) |
| Docs | `/api/docs` (Swagger, dev only) |
| Auth | Cookie-based. Backend sets httpOnly `accessToken` (15 min) + non-httpOnly `user` cookie. A Bearer header will **not** authenticate |
| Roles | `ADMIN`, `OWNER`, `SELLER` |
| 401 behavior | FE surfaces the error and navigates to `/login` |
| Rate limits | Global 100 req/60s per IP; login 5/60s |
| Multipart | Image upload endpoints accept `multipart/form-data` |
| Market scoping | OWNER is scoped to its own `marketId`; cross-market access returns **404, not 403** |
| Seller limits | A SELLER may only create `DEBT` transactions, never `SALE` |

See `backend/AGENTS.md` for the full endpoint map and domain rules.

---

## Quick File Map

| Purpose | Location |
|---------|----------|
| App entry (hydration) | `app/entry.client.tsx` |
| Root layout (providers) | `app/root.tsx` |
| Route config | `app/routes.ts` |
| Global styles | `app/styles/global.css` |
| CRM layout | `app/routes/(crm)/layout.tsx` |
| Auth layout | `app/routes/(auth)/layout.tsx` |
| Dashboard | `app/routes/(crm)/dashboard/route.tsx` |
| Users list | `app/routes/(crm)/users/route.tsx` |
| Users detail | `app/routes/(crm)/users/id/route.tsx` |
| Users store | `app/routes/(crm)/users/store.ts` |
| Users columns | `app/routes/(crm)/users/configs/columns.tsx` |
| Users filters | `app/routes/(crm)/users/configs/filters.ts` |
| Users modals | `app/components/modals/CreateUserModal.tsx`, `EditUserModal.tsx` |
| Sidebar | `app/components/layout/Sidebar.tsx` |
| Header | `app/components/layout/Header.tsx` |
| Navigation config | `app/config/navigation.ts` |
| Permissions config | `app/config/permissions.ts` |
| Actions config | `app/config/actions.ts` |
| Enum config | `app/config/enumOptions.ts` |
| API client | `app/lib/client.ts` |
| Auth utils | `app/lib/auth-utils.ts` |
| Query client | `app/lib/query-client.ts` |
| Zustand factories | `app/store/useTableStore.ts`, `createModalStore.ts` |
| Hooks | `app/hooks/` (useDataTable, useForm, useDebounce, useCan, useFilterParams, useFlatpickr, use-mobile) |
| Types | `app/types/` (common, auth, users, markets, products, sellers, debtors, transactions, dashboard, profile, filters) |
| Validations | `app/validations/` (auth, category, date, debtor, market, product, profile, seller, transactions, user) |
| API modules | `app/api/` (auth, users, markets, products, categories, sellers, debtors, transactions, dashboard, profile) |
| Dashboard widgets | `app/components/dashboard/` |
| Panel wrapper | `app/components/layout/Panel.tsx` |
| Navigation holder | `app/lib/navigation.ts` |
| Period config | `app/config/period.ts` |
| Transaction badges | `app/config/transactionBadges.ts` |
| NProgress styles | `app/styles/nprogress.css` |
| Form components | `app/components/ui/form/` (FormInput, FormCustomSelect, FormDateInput, FormFileInput, FormTextarea) |
| Shared components | `app/components/shared/` (DataTable, FilterSheet, Modal, ConfirmDialog, CommandPalette, etc.) |
| UI primitives | `app/components/ui/` (button, badge, card, dialog, sidebar, sheet, table, etc.) |
| i18n config | `app/lib/i18n.ts` |
| Locale files | `public/locales/{ru,en,tg}/*.json` |
| i18n init | `app/entry.client.tsx` |
| Theme provider | `app/components/theme-provider.tsx` |
