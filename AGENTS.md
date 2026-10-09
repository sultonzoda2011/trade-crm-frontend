# TradeCRM Frontend — AGENTS.md

Этот файл описывает **фактическую архитектуру и правила текущего frontend-кода TradeCRM**.

Все новые изменения должны соответствовать существующим паттернам проекта.

---

# 1. Stack

| Layer           | Technology                      | Notes                                |
| --------------- | ------------------------------- | ------------------------------------ |
| Framework       | **React Router 7**              | SPA, `ssr: false`                    |
| View            | **React 19 + TypeScript 5.9**   | Vite HMR                             |
| Build           | **Vite 7**                      | Production build через React Router  |
| Styling         | **TailwindCSS 4**               | `tw-animate-css`                     |
| Theme           | **next-themes**                 | Light / Dark / System                |
| UI              | **shadcn/ui + @base-ui/react**  | НЕ Radix                             |
| State           | **Zustand 5**                   | Table + modal factories              |
| Server state    | **TanStack React Query 5**      | `staleTime: 60s`, `keepPreviousData` |
| HTTP            | **Axios**                       | Единственный HTTP client             |
| Forms           | **React Hook Form**             | Через project wrapper                |
| Validation      | **Zod 4**                       | i18n-aware schema factories          |
| Auth            | **Bearer token + localStorage** | `accessToken` + `user`               |
| i18n            | **react-i18next**               | `ru / en / tg`                       |
| Tables          | **TanStack Table**              | Data tables                          |
| Virtualization  | **TanStack Virtual**            | Для больших таблиц                   |
| Charts          | **Recharts**                    | Dashboard                            |
| Dates           | **Day.js**                      | Через project helpers                |
| Icons           | **lucide-react**                | Иконки                               |
| Toasts          | **Sonner**                      | Global toaster                       |
| Date picker     | **Flatpickr**                   | Themed                               |
| Command palette | **cmdk**                        | Navigation/search                    |
| Mobile          | **Capacitor 8**                 | Android                              |
| E2E             | **Playwright**                  | `npm run test:e2e`                   |
| Formatting      | **Prettier**                    | Tailwind plugin                      |

---

# 2. Important dependency rules

UI использует:

```text
@base-ui/react
```

а не Radix UI.

`radix-ui` присутствует в `package.json`, но текущий `app/` не использует его как UI layer.

Также не следует вводить новые зависимости без необходимости.

Перед добавлением библиотеки сначала проверить, существует ли уже project utility/component для этой задачи.

---

# 3. Path alias

Все application imports используют:

```text
~/*
```

Alias указывает на:

```text
./app/*
```

Пример:

```ts
import { cn } from '~/lib/utils';
```

Не использовать длинные relative imports:

```ts
../../../../components
```

---

# 4. Commands

| Command                  | Purpose                           |
| ------------------------ | --------------------------------- |
| `npm run dev`            | Development server                |
| `npm run dev:fresh`      | Очистка Vite cache + dev          |
| `npm run build`          | Production build                  |
| `npm run typecheck`      | React Router typegen + TypeScript |
| `npm run start`          | Production preview на `3000`      |
| `npm run test:e2e`       | Playwright                        |
| `npx prettier --write .` | Formatting                        |

Главные quality gates:

```bash
npm run typecheck
npm run build
```

Перед завершением существенной feature рекомендуется запускать оба.

---

# 5. Routing

Все routes определяются вручную в:

```text
app/routes.ts
```

File-system routing не используется.

---

## Route tree

```text
/auth
└── /login

/crm
├── /
├── /dashboard
│   ├── /
│   ├── /inventory
│   ├── /products
│   └── /sellers
│
├── /profile
│
├── /users
│   ├── /create
│   ├── /:id
│   └── /:id/edit
│
├── /markets
│   ├── /create
│   ├── /:id
│   └── /:id/edit
│
├── /sellers
│   ├── /create
│   ├── /:id
│   └── /:id/edit
│
├── /products
│   ├── /create
│   ├── /:id
│   └── /:id/edit
│
├── /categories
│   ├── /create
│   ├── /:id
│   └── /:id/edit
│
├── /debtors
│   ├── /create
│   ├── /:id
│   └── /:id/edit
│
├── /transactions
│   ├── /create
│   └── /:id
│
├── /guide
├── /403
└── *
```

---

## Root redirect

`/` не является dashboard page.

Он делает redirect:

```text
Admin / Owner → /dashboard
Seller        → /transactions
```

---

## Dashboard

Dashboard использует nested layout:

```text
/dashboard
```

который владеет общими фильтрами:

```text
period
seller
dateFrom
dateTo
```

Children получают dashboard context через React Router outlet context.

---

# 6. Route permissions

Route access контролируется:

```text
app/config/permissions.ts
```

через:

```ts
ROUTE_PERMISSIONS;
```

Guard находится в:

```text
app/routes/(crm)/layout.tsx
```

Логика:

```text
getClientUser()
      ↓
нет пользователя → /login
      ↓
canAccess(role, pathname)
      ↓
нет доступа → /403
```

---

## IMPORTANT: fail-open behavior

`canAccess()` возвращает `true`, если для pathname нет записи в `ROUTE_PERMISSIONS`.

Поэтому:

> **Каждый новый защищённый route обязан быть добавлен в `ROUTE_PERMISSIONS`.**

Не рассчитывать на то, что маршрут автоматически будет закрыт.

Особенно важно добавлять create/edit routes:

```text
/users/create
/users/:id/edit

/markets/create
/markets/:id/edit

/sellers/create
/sellers/:id/edit

/categories/create
/categories/:id/edit

/debtors/create
/debtors/:id/edit
```

---

# 7. Authentication

Текущая auth architecture:

```text
localStorage
├── accessToken
└── user
```

Backend:

```text
POST /auth/login
```

возвращает:

```json
{
  "accessToken": "...",
  "user": {}
}
```

Frontend сохраняет оба значения.

---

## Auth utilities

Файл:

```text
app/lib/auth-utils.ts
```

Основные функции:

```text
setAccessToken()
getAccessToken()
removeAccessToken()

setUserInfo()
getUserInfo()
removeUserInfo()

clearSession()
getClientUser()
```

---

## Authorization header

Каждый authenticated API request получает:

```http
Authorization: Bearer <accessToken>
```

Через request interceptor в:

```text
app/lib/client.ts
```

---

## 401 behavior

При:

```text
401 Unauthorized
```

frontend:

```text
clearSession()
      ↓
redirectToLogin()
```

Navigation выполняется через project navigation holder, а не через page reload.

---

## Important

Не добавлять обратно старую архитектуру:

```text
httpOnly accessToken cookie
withCredentials
requireAuth(request)
request.headers Cookie parsing
JWT expiry checks
```

SPA runtime использует клиентское `localStorage` состояние.

`auth-utils.ts` содержит только legacy migration для старых cookie-сессий. Это compatibility path, а не текущая auth architecture.

---

# 8. RBAC

Роли:

```text
Admin
Owner
Seller
```

Основные permission layers:

```text
Route
  ↓
ROUTE_PERMISSIONS

Action
  ↓
ACTION_PERMISSIONS

UI
  ↓
useCan()

API
  ↓
API_ROUTE_ACTIONS
```

---

## Actions

Файл:

```text
app/config/actions.ts
```

Содержит granular permissions:

```text
USERS_VIEW
USERS_CREATE
USERS_EDIT
USERS_DELETE

MARKETS_VIEW
MARKETS_VIEW_BY_ID
MY_MARKET
MARKETS_CREATE
MARKETS_EDIT
MARKETS_DELETE

PRODUCTS_VIEW
PRODUCTS_CREATE
PRODUCTS_EDIT
PRODUCTS_DELETE

CATEGORIES_VIEW
CATEGORIES_MANAGE

TRANSACTIONS_VIEW
TRANSACTIONS_CREATE
TRANSACTIONS_CREATE_SALE
TRANSACTIONS_EDIT
TRANSACTIONS_DELETE
TRANSACTIONS_REFUND

SELLERS_VIEW
SELLERS_CREATE
SELLERS_EDIT
SELLERS_DELETE

DEBTORS_VIEW
DEBTORS_CREATE
DEBTORS_EDIT
DEBTORS_DELETE
```

---

## UI gating

Использовать:

```ts
const { can } = useCan();

can(Action.PRODUCTS_EDIT);
```

Не использовать:

```ts
user.role === 'Admin';
```

для UI authorization.

Role comparisons допустимы только внутри permission infrastructure.

---

## API pre-flight

Axios определяет required action по:

```text
HTTP method + API path
```

через:

```text
API_ROUTE_ACTIONS
```

Затем проверяет:

```text
ACTION_PERMISSIONS
```

Если access denied:

```text
request не отправляется
```

Это UX/security pre-flight.

Backend остаётся главным authority для реальной безопасности.

---

# 9. Navigation

Navigation config:

```text
app/config/navigation.ts
```

Используется:

```text
getSidebarConfig()
getVisibleNavigation()
```

Каждый navigation item должен:

1. иметь реально существующий route;
2. использовать правильный Action;
3. соответствовать `ROUTE_PERMISSIONS`.

Не добавлять navigation URL, которого нет в `routes.ts`.

---

# 10. HTTP / API architecture

Все application HTTP requests проходят через:

```text
app/lib/client.ts
```

Использовать:

```ts
apiClient;
```

Не использовать:

```ts
axios.get(...)
axios.post(...)
fetch(...)
```

в route/component коде.

---

## API base URL

```text
VITE_API_URL + /api
```

Default:

```text
http://localhost:4000/api
```

Timeout:

```text
15 seconds
```

---

# 11. API modules

API modules находятся в:

```text
app/api/
```

```text
auth.ts
users.ts
markets.ts
products.ts
categories.ts
sellers.ts
debtors.ts
transactions.ts
dashboard.ts
profile.ts
crud.ts
```

---

## CRUD abstraction

Общие REST operations находятся в:

```text
app/api/crud.ts
```

Основные helpers:

```text
listRequest()
detailRequest()
nestedDetailRequest()
deleteRequest()
jsonWrites()
multipartWrites()
```

Новые entity modules должны переиспользовать эти abstractions, когда endpoint соответствует стандартному CRUD behavior.

Не копировать одинаковый pagination/filter logic в каждом API module.

---

# 12. Query architecture

Server state использует:

```text
@tanstack/react-query
```

Configuration:

```text
app/lib/query-client.ts
```

Current defaults:

```ts
staleTime: 60_000
placeholderData: keepPreviousData
retry: 2
mutation retry: false
```

`keepPreviousData` позволяет сохранять предыдущие таблицы на экране во время pagination/filter refetch.

---

# 13. Query keys

Все project query keys должны находиться в:

```text
app/lib/query-keys.ts
```

Не создавать произвольные keys в route components.

Структура построена вокруг entity prefix:

```text
users
products
transactions
...
```

Поэтому invalidation выполняется по prefix:

```ts
queryClient.invalidateQueries({
  queryKey: ['products'],
});
```

Не использовать полный compound query key для invalidation.

---

# 14. Zustand

Local UI state использует:

```text
Zustand
```

Factories:

```text
app/store/useTableStore.ts
app/store/createModalStore.ts
```

---

## Table store

Каждая entity list page должна иметь scoped store:

```text
app/routes/(crm)/users/store.ts
app/routes/(crm)/markets/store.ts
app/routes/(crm)/products/store.ts
...
```

Store управляет:

```text
page
limit
search
filters
```

и:

```text
setPage()
setLimit()
setSearch()
setFilter()
removeFilter()
setFilters()
resetFilters()
```

---

## Important

`setLimit`, `setSearch`, `setFilter`, `setFilters`, `resetFilters` должны сбрасывать page на `1`.

`removeFilter()` не обязан сбрасывать page.

Использовать project:

```text
DEFAULT_PAGE_LIMIT
```

вместо повторного hardcode page size в компонентах.

---

# 15. Modal stores

Modal state использует:

```text
createModalStore()
```

Store должен быть typed.

Пример:

```ts
type ProductModals = {
  delete: string;
};

export const useProductsModals = createModalStore<ProductModals>(['delete']);
```

---

## Zustand subscriptions

Подписываться на отдельный slice:

```ts
const deleteModal = useProductsModals((state) => state.delete);
```

Не:

```ts
const modals = useProductsModals();
```

Последний вариант вызывает лишние re-renders.

---

# 16. Tables

Использовать:

```text
@tanstack/react-table
@tanstack/react-virtual
```

Reusable table:

```text
app/components/shared/DataTable.tsx
```

---

## Columns

Entity columns должны находиться в:

```text
configs/columns.tsx
```

и создаваться factory:

```ts
getColumns({
  t,
  onAction,
});
```

Использовать:

```ts
createColumnHelper<T>();
```

Не определять большие `ColumnDef[]` непосредственно внутри route component.

---

## Background fetching

При использовании DataTable передавать:

```ts
isFetching;
```

Чтобы текущие rows оставались видимыми во время background refetch.

Не показывать полный skeleton на каждый page/filter change.

---

# 17. Filters

Filter definitions находятся в:

```text
configs/filters.ts
```

Использовать:

```text
FilterConfig
```

Поддерживаемые variants:

```text
select
number-range
date-range
boolean
```

---

## Search

Search должен использовать debounce:

```text
search
 ↓
useDebounce
 ↓
query
```

Не отправлять API request на каждый keystroke.

---

## Filter params

Преобразование:

```text
ActiveFilter[]
```

в API query params должно выполняться через:

```text
app/lib/filtersToParams.ts
```

Не собирать эти query params вручную внутри каждой страницы.

---

# 18. Forms

Основной form stack:

```text
react-hook-form
+
Zod
+
@hookform/resolvers/zod
```

Использовать wrapper:

```text
app/hooks/useForm.ts
```

а не напрямую:

```ts
useForm();
```

из `react-hook-form`, если wrapper покрывает нужный flow.

---

# 19. Validation

Schemas находятся в:

```text
app/validations/
```

Pattern:

```ts
createProductSchema(t);
updateProductSchema(t);
```

Schemas должны быть factories, если содержат user-facing translated messages.

---

## Schema memoization

В component:

```ts
const schema = useMemo(() => createProductSchema(t), [t]);
```

Не создавать translation-dependent schema заново без необходимости.

---

# 20. FormData

Для multipart entities использовать:

```text
app/lib/form-data.ts
```

Helpers:

```text
appendToFormData()
buildMultipart()
```

Не дублировать ручные `FormData.append()` операции без необходимости.

---

# 21. Date handling

Все date values проходят через:

```text
app/lib/date.ts
```

Использовать:

```text
toDayjs()
toDate()
```

Для отображения:

```text
formatDate()
```

из:

```text
app/lib/format.ts
```

Не использовать разбросанные:

```ts
dayjs(date).format(...)
```

по всему application code.

Это особенно важно для day-first input formats.

---

# 22. i18n

Languages:

```text
ru
en
tg
```

Default/fallback:

```text
ru
```

Locales:

```text
public/locales/
├── ru/
├── en/
└── tg/
```

---

## User-facing strings

Не писать:

```tsx
<Button>Create</Button>
```

в feature code.

Использовать translations:

```tsx
<Button>{t('actions.create')}</Button>
```

---

## Namespace

Entity pages должны использовать explicit namespaces:

```ts
useTranslation(['products', 'common']);
```

Config factories получают `t`:

```ts
getColumns({ t });
getProductFilters(t);
```

Не вызывать React hooks внутри обычных config factories.

---

# 23. UI architecture

Основные layers:

```text
components/ui/
components/ui/form/
components/shared/
components/modals/
components/dashboard/
components/layout/
```

---

## UI primitives

Использовать существующие components из:

```text
app/components/ui/
```

Не создавать новый primitive, если существующий уже покрывает задачу.

---

## Shared components

Переиспользуемый application-level UI:

```text
app/components/shared/
```

Примеры:

```text
DataTable
FilterSheet
ConfirmDialog
Modal
EmptyState
InfoItem
BreadCrumbs
...
```

---

## Modals

Modal components находятся в:

```text
app/components/modals/
```

Visibility должна контролироваться store.

Не делать unnecessary conditional mounting:

```tsx
{
  isOpen && <Modal />;
}
```

если компонент использует exit animation.

Для delete/confirmation flows использовать:

```text
ConfirmDialog
```

---

# 24. Page structure

Entity page обычно разделяется:

```text
route.tsx
store.ts
configs/
├── columns.tsx
└── filters.ts
id/
├── route.tsx
create/
└── route.tsx
id/edit/
└── route.tsx
```

Не создавать route-local `components/` directory без реальной необходимости.

Reusable UI должен находиться в `app/components/`.

---

# 25. CUD architecture

В текущей версии frontend create/edit flows существуют как page routes для entities:

```text
users
markets
sellers
products
categories
debtors
```

Transactions:

```text
create page
pay modal
refund flow
delete confirmation
```

При изменении существующего flow сначала проверить текущий route и store, а не создавать альтернативный architecture pattern.

---

# 26. Detail pages

Detail pages должны переиспользовать established application components.

Предпочитать:

```text
ByIdSkeleton
BreadCrumbs
InfoItem
Panel
```

Breadcrumb state должен передаваться из списка, если list navigation already provides:

```text
fromPath
fromName
```

Не хардкодить одинаковые breadcrumb paths в каждой detail page.

---

# 27. Navigation & layout

Основные layout components:

```text
app/components/layout/
├── Header
├── Sidebar
├── NavMain
├── BottomNav
├── UserNav
├── ModeToggle
├── LanguageSwitcher
└── Panel
```

CRM layout отвечает за:

```text
sidebar
header
main scroll area
auth guard
route-level access
```

Mobile navigation используется отдельно через `BottomNav`.

---

# 28. Theme

Theme provider:

```text
app/components/theme-provider.tsx
```

используется с:

```text
next-themes
```

Design tokens находятся в:

```text
app/styles/global.css
```

---

## Current font

Основной шрифт:

```text
Inter Variable
```

Не вводить Geist/Manrope или другой font без изменения design-system решения.

---

## Current primary

Light:

```text
#007aff
```

Dark:

```text
#0a84ff
```

Всегда предпочитать semantic classes:

```text
text-primary
bg-primary
text-success
bg-warning/15
text-destructive
```

а не прямые hex values в components.

---

# 29. Mobile / Capacitor

Mobile shell использует:

```text
Capacitor 8
```

Config:

```text
capacitor.config.ts
```

Current:

```text
appId: com.tradecrm.app
appName: TradeCRM
webDir: build/client
```

Android plugins include:

```text
StatusBar
Keyboard
App
Network
SQLite
```

---

## Android-specific rules

UI должен учитывать Android WebView:

- не полагаться на session cookies;
- не использовать sticky hover behavior;
- поддерживать touch targets;
- учитывать keyboard resize;
- учитывать status bar;
- избегать browser-only APIs без guard, если код может выполняться native.

---

# 30. Session persistence

Session специально хранится в:

```text
localStorage
```

а не в session cookie.

Причина:

Android WebView может удалить обычную session cookie после завершения процесса приложения.

`localStorage` используется как persistent client storage.

---

# 31. Error handling

Axios response interceptor:

```text
network error
    ↓
errors.noConnection

401
    ↓
clearSession()
    ↓
/login

4xx / 5xx
    ↓
server message OR translated error
    ↓
toast
```

Не добавлять собственные глобальные error handlers в каждой page без необходимости.

---

# 32. Query invalidation after mutations

Typical mutation flow:

```text
mutation
   ↓
invalidateQueries()
   ↓
toast.success()
   ↓
close modal / navigate
   ↓
reset form
```

После create/update/delete не забывать invalidation соответствующей entity.

Использовать prefix:

```ts
queryClient.invalidateQueries({
  queryKey: ['products'],
});
```

---

# 33. Loading states

Для first load использовать appropriate skeleton.

Для background refetch:

```text
isFetching
```

и сохранять текущие data.

Не превращать каждую pagination operation в full-page loading state.

---

# 34. Empty states

Использовать:

```text
EmptyState
```

вместо самодельного:

```tsx
<p>No data</p>
```

---

# 35. Utility `cn`

Все conditional Tailwind classes должны объединяться через:

```text
~/lib/utils.ts
```

```ts
cn(...)
```

Не использовать ad-hoc string concatenation.

---

# 36. Installed but currently unused

Не начинать использовать библиотеку только потому, что она есть в `package.json`.

Перед использованием проверить actual imports.

В проекте есть dependencies, которые могут быть legacy/unused, например:

```text
radix-ui
@fontsource-variable/geist
@react-router/fs-routes
@react-router/node
@react-router/serve
isbot
i18next-fs-backend
@tanstack/devtools-vite
```

Не считать наличие dependency признаком принятого architecture pattern.

---

# 37. Type organization

Entity types находятся в:

```text
app/types/
```

Основные модули:

```text
common
auth
users
markets
products
sellers
debtors
transactions
dashboard
profile
filters
```

Не inline-определять большие domain types внутри route components.

---

# 38. Important domain conventions

### Roles

```text
ADMIN
OWNER
SELLER
```

Frontend enum:

```text
Role.Admin
Role.Owner
Role.Seller
```

---

### Product units

```text
PCS
KG
L
M
BOX
```

---

### Transaction types

```text
DEBT
SALE
REFUND
```

---

### Payment types

```text
CASH
CARD
CREDIT
```

---

### Transaction statuses

```text
ACTIVE
PARTIAL
PAID
REFUNDED
PARTIALLY_REFUNDED
```

---

# 39. Backend contract

Backend:

```text
NestJS
Prisma
PostgreSQL
```

API:

```text
/api
```

Default development backend:

```text
http://localhost:4000
```

Swagger:

```text
/api/docs
```

---

# 40. Market scoping

Domain access is market-aware.

Backend security remains authoritative.

Frontend should not assume that hiding a button or route is sufficient authorization.

Important backend behavior:

```text
OWNER
→ own market scope

SELLER
→ assigned market scope
```

Cross-market authorization decisions are enforced server-side.

---

# 41. New feature checklist

При добавлении новой feature проверить:

```text
[ ] routes.ts
[ ] ROUTE_PERMISSIONS
[ ] Action enum
[ ] ACTION_PERMISSIONS
[ ] API_ROUTE_ACTIONS
[ ] navigation.ts
[ ] API module
[ ] types
[ ] validations
[ ] translations
[ ] query key
[ ] query invalidation
[ ] table store (если list)
[ ] modal store (если modal flow)
[ ] responsive/mobile behavior
[ ] typecheck
[ ] build
```

---

# 42. New endpoint checklist

Новый API endpoint должен быть проверен в:

```text
app/api/<entity>.ts
```

и:

```text
app/lib/client.ts
```

Если endpoint требует permission, соответствующая запись должна появиться в:

```text
API_ROUTE_ACTIONS
```

Не оставлять endpoint без intention-specific RBAC mapping.

---

# 43. New route checklist

Новый protected route требует:

```text
app/routes.ts
+
app/config/permissions.ts
```

Если route содержит gated UI:

```text
+
app/config/actions.ts
```

Если feature делает API requests:

```text
+
app/lib/client.ts
```

Если route должен появиться в navigation:

```text
+
app/config/navigation.ts
```

---

# 44. Don't

Не:

```text
❌ использовать raw fetch
❌ импортировать axios напрямую в feature code
❌ использовать Radix как UI foundation
❌ создавать новые роли через inline strings
❌ делать role-based UI через raw string comparison
❌ добавлять route без ROUTE_PERMISSIONS
❌ добавлять endpoint без проверки API_ROUTE_ACTIONS
❌ дублировать CRUD helpers
❌ дублировать filter-to-query-param logic
❌ создавать query keys вручную
❌ хардкодить translated strings
❌ использовать arbitrary tiny text sizes
❌ создавать новый QueryClient внутри component
❌ подписываться на весь Zustand store
❌ показывать full skeleton при каждом background refetch
❌ возвращать auth на cookie-based architecture
```

---

# 45. Final engineering principle

TradeCRM — не набор независимых страниц.

Основной принцип проекта:

```text
shared infrastructure
        ↓
entity conventions
        ↓
consistent UX
        ↓
centralized permissions
        ↓
centralized API client
        ↓
typed domain models
```

Перед написанием нового кода сначала искать существующий pattern в соседних entity.

Предпочтение всегда отдаётся:

```text
reuse > duplication
existing pattern > new pattern
centralized config > local hardcode
typed abstraction > ad-hoc implementation
```
