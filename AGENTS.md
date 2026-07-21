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
| Auth | JWT in `token` cookie, decoded via `jwt-decode` | RBAC via `useCan` + `Action` enum |
| Font | Manrope (Google Fonts) | `200..800` weight range |
| Navigation | NProgress (top bar) | Triggered by `useNavigation().state` |
| Overlays | flatpickr (date pickers), cmdk (command palette) | Themed via CSS variables |
| Linting | **None** | No eslint, no biome, no prettier script in npm scripts |

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
| `npm run dev:fresh` | `Remove-Item -Recurse -Force .vite -ErrorAction SilentlyContinue` then `dev` (fixes HMR issues) |
| `npm run build` | `react-router build` — production build to `build/` |
| `npm run typecheck` | `react-router typegen && tsc` — **must run both** (typegen generates route types from `routes.ts`) |
| `npm run start` | `react-router-serve build/server/index.js` — serves production build |
| `npx prettier --write .` | Format all files (Tailwind class sorting via `prettier-plugin-tailwindcss`) |
| `docker build -t trade-crm . && docker run -p 3000:3000 trade-crm` | Containerised production |

---

## Architecture

### Route structure

Routes are defined **manually** in `app/routes.ts` (no file-system routing despite `@react-router/fs-routes` being installed):

```
app/routes.ts
├── layout: (auth)/layout.tsx          ← AuthLayout (two-column login)
│   └── /login                         ← (auth)/login/route.tsx
└── layout: (crm)/layout.tsx           ← CrmLayout (sidebar + header, protected)
    ├── / (index)                      ← (crm)/dashboard/route.tsx
    └── /users                         ← (crm)/users/route.tsx
        └── /users/:id                 ← (crm)/users/id/route.tsx
```

- **AuthLayout** (`app/routes/(auth)/layout.tsx`): `min-h-screen grid lg:grid-cols-2`, left panel has branding + quote, right panel has `<Outlet />`. Includes `LanguageSwitcher` + `ModeToggle`.
- **CrmLayout** (`app/routes/(crm)/layout.tsx`): Calls `requireAuth()` in `clientLoader`. Wraps everything in `<SidebarProvider>` → `<AppSidebar>` + `<Header>` + `<main>` + `<Outlet />`. Main area is `scrollbar-hide`, overflow-y-auto.

**When adding a new route**, register it in **both** `app/routes.ts` AND `app/config/permissions.ts`.

### Auth & RBAC

| Concept | Implementation | Location |
|---------|---------------|----------|
| Token storage | `token` cookie, 7-day expiry (set by backend) | `js-cookie` |
| Decode | `jwtDecode<DecodedToken>()` | `~/lib/auth-utils.ts` |
| Route guard | `requireAuth(request)` in `clientLoader` | `~/lib/auth-utils.ts` |
| Permission map | `ROUTE_PERMISSIONS` — route pattern → `Role[]` | `~/config/permissions.ts` |
| Action map | `ACTION_PERMISSIONS` — `Action` enum → `Role[]` | `~/config/actions.ts` |
| UI gate | `useCan()` → `can(Action.X)` or `can(Role.X)` | `~/hooks/useCan.ts` |
| Role enum | `Admin`, `Owner`, `Seller` | `~/types/common.ts` |
| Action enum | `DASHBOARDS_VIEW`, `USERS_*`, `MARKETS_*`, `PRODUCTS_*`, `TRANSACTIONS_*` | `~/config/actions.ts` |

**How `requireAuth` works** (`app/lib/auth-utils.ts:34-49`):

1. Reads `token` cookie via `js-cookie`
2. If missing or expired (`isTokenExpired` → `jwtDecode` + check `exp`), redirects to `/login?redirectTo=<pathname>`
3. Decodes user, checks `canAccess(user.role, pathname)` against `ROUTE_PERMISSIONS`
4. If route not in `ROUTE_PERMISSIONS`, access is **granted** to all roles
5. If denied, redirects to `/` (dashboard)

**How `useCan` works** (`app/hooks/useCan.ts`):

- Decodes token client-side (no API call)
- `can(Action.USERS_CREATE)` → looks up `ACTION_PERMISSIONS[Action.USERS_CREATE]` → checks if user's role is in the allowed list
- `can(Role.Admin)` → direct role comparison
- `can([Action.USERS_VIEW, Action.USERS_EDIT])` → checks if ANY match
- Returns `{ can, canAny, role, user }`

### Data fetching

**Every** HTTP call goes through `app/lib/client.ts` — an Axios instance:

```
apiClient = axios.create({ baseURL: VITE_API_URL + '/api' })
```

- **Request interceptor**: reads `token` cookie, attaches `Authorization: Bearer <token>` header
- **Response interceptor**:
  - **401** → `Cookies.remove('token')` + `window.location.replace('/login')` (full page reload, clears React Query cache)
  - **Network error** → toast `errors.noConnection`
  - **4xx/5xx** → toast mapped i18n key (`errors.badRequest`, `errors.forbidden`, etc.) or server message
  - **Silent URLs** (`/auth/login`) → no toast, error is just passed through

API modules live in `app/api/`:

| File | Export | Endpoints |
|------|--------|-----------|
| `api/auth.ts` | `authApi` | `login(payload)` → POST `/auth/login` |
| `api/users.ts` | `usersApi` | `getAll(page, limit, filters)`, `getById(id)`, `create(request)`, `update({request, id})`, `delete(id)` |
| `api/markets.ts` | `marketsApi` | CRUD + multipart image upload |
| `api/products.ts` | `productsApi` | CRUD + multipart image upload |

List endpoints use `filtersToParams(filters)` to convert `ActiveFilter[]` → query params.

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

**Behavior**: Every mutation that changes filters, search, or limit resets `page` to 1.

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

#### Detail page store

If a route has both list (`entity/`) and detail (`entity/:id`), the detail page MUST have its own `id/store.ts` — do NOT share the list's store.

### i18n

- **Languages**: `ru` (default/fallback), `en`, `tg`
- **Namespaces**: `common`, `auth`, `validation` (+ entity names from `app/lib/i18n.ts`)
- **Storage**: language saved in `lng` cookie (365 days), detected in `root.tsx` `clientLoader`
- **Usage**: `useTranslation(['users', 'common'])` inside entity routes; `useTranslation('common')` for shared UI
- **Error messages**: schema factories take `t: TFunction` and embed `t('errorKey', { ns: 'validation' })`

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
| `.animate-page-enter` | Route content fade-in + translateY(6px) | 220ms ease-out |
| `.animate-card-enter` | Card grid stagger — set `--stagger-index` per item | 300ms ease-out, delay `min(index, 11) * 45ms` |
| `.animate-shimmer` | Skeleton loading shimmer | 1.6s linear infinite |

`prefers-reduced-motion` is handled globally in `global.css` — do NOT add per-component overrides.

### UI primitives

**Critical**: shadcn components in `app/components/ui/` are built on **`@base-ui/react`**, not `@radix-ui/react-*`. The two packages have completely different APIs:

| Concept | Radix | Base UI |
|---------|-------|---------|
| Portal | `<Portal>` | `<Portal>` (same, but import paths differ) |
| Trigger | `<DropdownMenuTrigger asChild>` | `<DropdownMenuTrigger render={<button/>}>` |
| Content | direct children | `render` prop pattern |
| Combobox | separate package | built into base-ui |

**Button + `render` prop**: When using `render={<Link>}` on a Button, `nativeButton` is handled automatically by `button.tsx` — no manual override needed.

**Available UI components**: avatar, badge, bread-crumb, button, card, chart, collapsible, combobox, command, dialog, dropdown-menu, input-group, input, label, pagination, popover, progress, scroll-area, select, separator, sheet, sidebar, skeleton, switch, table, textarea, tooltip.

---

## Hooks Reference

| Hook | Location | Signature | Purpose |
|------|----------|-----------|---------|
| `useDataTable` | `~/hooks/useDataTable` | `({ columns, data, storageKey, initialVisibility, ... })` → `{ table }` | Wraps `useReactTable` with column visibility persisted to `localStorage` via `storageKey` |
| `useForm` | `~/hooks/useForm` | `(options: UseFormProps<T>)` → RHF return | i18n-aware wrapper — re-triggers validation on language change if form was already submitted |
| `useDebounce` | `~/hooks/useDebounce` | `(value: T, delay = 300)` → `debouncedValue` | Standard debounce, used for search inputs before sending to API |
| `useCan` | `~/hooks/useCan` | `()` → `{ can, canAny, role, user }` | Decodes JWT, checks `Action`/`Role` against `ACTION_PERMISSIONS` |
| `useUser` | `~/hooks/useUser` | `()` → query result | TanStack Query wrapper for `/me` endpoint, cached 5 min (if file exists) |
| `useIsMobile` | `~/hooks/use-mobile` | `(breakpoint = 767)` → `boolean` | `matchMedia` listener, used for responsive toaster position + layout |

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

### Pattern: Inline filters (persisted across navigation)

When a route has filter dropdowns directly in the toolbar (not in `FilterSheet`) that should persist, create a separate Zustand store with `persist` middleware in the same `store.ts`:

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface InlineFilters {
  role: string;
  setRole: (v: string) => void;
}

export const useInlineFilters = create<InlineFilters>()(
  persist(
    (set) => ({ role: 'all', setRole: (role) => set({ role }) }),
    { name: 'users-inline-filters' },
  ),
);
```

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
| `DateRangePicker` | `~/components/shared/DateRangePicker` | Flatpickr range picker; emits `(start, end)` as `YYYY-MM-DD` |
| `EmptyState` | `~/components/shared/EmptyState` | Centered "no data" display with Inbox icon + message (falls back to `t('table.noData')`) |
| `FileInputField` | `~/components/shared/FileInputField` | File/image upload; variants: `dropzone` (drag & drop + preview) and `simple` (button + filename); `compact` size for modals |
| `FilterField` | `~/components/shared/FilterField` | Renders a single filter input based on `FilterConfig` type discriminator |
| `FilterSheet` | `~/components/shared/FilterSheet` | Slide-over sheet with filter form; handles flatpickr portal interaction; reset + apply buttons |
| `FormSection` | `~/components/shared/FormSection` | Section wrapper with icon + title + divider for form pages |
| `InfoItem` | `~/components/shared/InfoItem` | Label-value display pair (uppercase label, bold value) for detail pages |
| `Modal` | `~/components/shared/Modal` | Base modal using shadcn `Dialog` with `modal={false}` (fixes base-ui ComboBox portal inside dialog) |
| `MonthPicker` | `~/components/shared/MonthPicker` | Flatpickr month/year-only picker (uses monthSelectPlugin); returns `(year, month)` |
| `UniversalImage` | `~/components/shared/UniversalImage` | Image component with loading/error/empty states; custom fallback render function; fades in on load |
| `UserAvatar` | `~/components/shared/UserAvatar` | Avatar with fallback initials + optional subtitle |

**Form components** (`~/components/ui/form/`): `FormInput`, `FormCustomSelect`, `FormDateInput`, `FormFileInput`, `FormTextarea` — all `<Controller>` wrappers that accept `control` from react-hook-form and render label + input + error message.

---

## Config Reference

### `~/config/actions.ts`

```ts
enum Action {
  DASHBOARDS_VIEW, USERS_VIEW, USERS_CREATE, USERS_EDIT, USERS_DELETE,
  MARKETS_VIEW, MARKETS_CREATE, MARKETS_EDIT, MARKETS_DELETE,
  PRODUCTS_VIEW, PRODUCTS_CREATE, PRODUCTS_EDIT, PRODUCTS_DELETE,
  TRANSACTIONS_VIEW, TRANSACTIONS_CREATE, TRANSACTIONS_EDIT, TRANSACTIONS_DELETE,
}
```

`ACTION_PERMISSIONS` maps each Action → `Role[]`. VIEW actions are accessible by Admin+Owner+Seller; CUD actions by Admin+Owner only.

### `~/config/permissions.ts`

```ts
ROUTE_PERMISSIONS = {
  '/dashboard': [Role.Admin, Role.Owner, Role.Seller],
};
canAccess(role, pathname): boolean  // uses matchPath; unmatched routes return true
```

### `~/config/navigation.ts`

```ts
getSidebarConfig(t): NavItem[]       // defines sidebar menu items with icons and action bindings
getVisibleNavigation(items, can): NavItem[]  // filters items recursively by RBAC
```

Currently has: Dashboard (index, `LayoutDashboard`, `DASHBOARDS_VIEW`) and Users (`/users`, `Users`, `USERS_VIEW`). Finances section is commented out.

`NavItem` supports: `title`, `url`, `icon`, `action`, `roles`, `items` (nested), `comingSoon` (renders disabled with badge).

### `~/config/enumOptions.ts`

| Export | Type | Purpose |
|--------|------|---------|
| `STATUS_CONFIG` | `Record<Status, {label, className}>` | Badge styling for Active/Inactive/Completed |
| `getStatusOptions(t)` | `{value, label}[]` | Select options for Status filter |
| `getDayLabels(t)` | `string[]` | Mon-Sun day labels |
| `getDayOptions(t)` | `{value, label}[]` | Day-of-week select options (1=Mon..7=Sun) |
| `getRoleOptions(t)` | `{value, label}[]` | Role select options (+ "all" filter option) |

---

## Lib Utilities

| File | Exports | Purpose |
|------|---------|---------|
| `~/lib/auth-utils` | `DecodedToken`, `getAuthToken`, `getUserFromToken`, `isTokenExpired`, `requireAuth` | JWT cookie ops + route guard |
| `~/lib/client` | `apiClient` | Axios instance with interceptors |
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
| `~/types/auth` | `Login`, `LoginResponse` |
| `~/types/users` | `User`, `MarketInfo`, `UserRequest`, `CreateUserRequest`, `UsersResponse`, `UserDetailResponse` |
| `~/types/filters` | `ActiveFilter`, `FilterConfig` (discriminated union: input/select/number-range/date/date-range) |
| `~/types/markets` | `Market`, `MarketsResponse`, `MarketDetailResponse` |
| `~/types/products` | `Product`, `ProductsResponse`, `ProductDetailResponse` |

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
| Docs | `/api/docs` (Swagger) |
| Auth | Login returns JWT; stored in `token` cookie (7-day expiry) |
| Roles | `ADMIN`, `OWNER`, `SELLER` |
| 401 behavior | Backend returns 401 → FE clears cookie → redirects to `/login` |
| Multipart | Image upload endpoints accept `multipart/form-data` |

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
| Hooks | `app/hooks/` (useDataTable, useForm, useDebounce, useCan, use-mobile) |
| Types | `app/types/` (common, auth, users, markets, products, filters) |
| Validations | `app/validations/` (auth, user, date) |
| API modules | `app/api/` (auth, users, markets, products) |
| Form components | `app/components/ui/form/` (FormInput, FormCustomSelect, FormDateInput, FormFileInput, FormTextarea) |
| Shared components | `app/components/shared/` (DataTable, FilterSheet, Modal, ConfirmDialog, CommandPalette, etc.) |
| UI primitives | `app/components/ui/` (button, badge, card, dialog, sidebar, sheet, table, etc.) |
| i18n config | `app/lib/i18n.ts` |
| Locale files | `public/locales/{ru,en,tg}/*.json` |
| i18n init | `app/entry.client.tsx` |
| Theme provider | `app/components/theme-provider.tsx` |
