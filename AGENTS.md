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
| Forms           | **React Hook Form**             | Через project wrapper (`useForm`)    |
| Validation      | **Zod 4**                       | i18n-aware schema factories          |
| Auth            | **Bearer token + localStorage** | `accessToken` + `user`               |
| i18n            | **react-i18next**               | `ru / en / tg`                       |
| Tables          | **TanStack Table**              | Data tables (`DataTable`)            |
| Virtualization  | **TanStack Virtual**            | Для больших таблиц                   |
| Charts          | **Recharts**                    | Dashboard + mini-charts              |
| Dates           | **Day.js**                      | Через project helpers (`date.ts`)    |
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
├── /debtors
│   ├── /create
│   ├── /:id
│   └── /:id/edit
│
├── /transactions
│   ├── /create
│   └── /:id
│
├── /sync
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

/products/create
/products/:id/edit

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
PRODUCTS_RESTOCK
PRODUCTS_DELETE

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

- Для детальных страниц `users`, `markets`, `sellers`, `debtors` используется `nestedDetailRequest` (`GET /<entity>/:id/full`), который загружает карточку сущности вместе с превью связанных списков и аналитикой одним запросом.
- Новые entity modules должны переиспользовать эти abstractions, когда endpoint соответствует стандартному CRUD behavior.
- Не копировать одинаковый pagination/filter logic в каждом API module.

---

# 12. Query & Mutation hooks

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

## Standardized Entity List Hook (`useEntityList`)

Все списочные страницы (`users`, `markets`, `sellers`, `products`, `debtors`, `transactions`) используют:

```text
app/hooks/useEntityList.ts
```

`useEntityList` автоматически:
1. подписывается на нужные поля table store (`page`, `limit`, `search`, `filters`, `sorting` и setters);
2. применяет `useDebounce(search, 300)`;
3. преобразует `ActiveFilter[]` и `sorting` в API query params через `filtersToParams`;
4. выполняет `useQuery` по ключу `[...queryKeyPrefix, 'list', queryParams]`;
5. возвращает `{ rows, total, totalPages, isLoading, isFetching, queryResult, ...storeSlice }`.

Не дублировать ручное чтение table store + `useDebounce` + `filtersToParams` + `useQuery` в каждом `route.tsx`.

---

## Standardized Entity Mutation Hook (`useEntityMutation`)

Для стандартных online CRUD-мутаций (create/update/delete на страницах `users`, `markets`, `sellers`, `products`, `debtors/edit`, delete modals) использовать:

```text
app/hooks/useEntityMutation.ts
```

`useEntityMutation` инкапсулирует:
- `useMutation`
- инвалидацию `invalidateKeys` по префиксам (`queryClient.invalidateQueries({ queryKey: [key] })`)
- показ `toast.success(t(successToastKey))`
- вызов `onSuccess(result, input)` (закрытие модалки / `navigate(...)`)

> **Важно:** Для офлайн-совместимых мутаций (`createDebtor`, `createTransaction`, `payTransaction`, `refundTransaction`) вместо `useEntityMutation` используется `useDetachedMutation` (см. раздел 30 «Offline & Sync»).

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
markets
sellers
products
debtors
transactions
dashboard
profile
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
sorting
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
setSorting()
```

---

## Important

`setLimit`, `setSearch`, `setFilter`, `setFilters`, `resetFilters`, `setSorting` должны сбрасывать page на `1`.

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
  restock: Product;
};

export const useProductsModals = createModalStore<ProductModals>(['delete', 'restock']);
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

# 16. Tables & `ListPageLayout`

Использовать:

```text
@tanstack/react-table
@tanstack/react-virtual
```

Reusable table и единый layout списочных страниц:

```text
app/components/shared/DataTable.tsx
app/components/shared/ListPageLayout.tsx
app/components/shared/ActionButtons.tsx
```

---

## `ListPageLayout`

Все 6 списочных страниц (`users`, `markets`, `sellers`, `products`, `debtors`, `transactions`) строятся через `ListPageLayout<TData, TServerData>`.

Он берет на себя:
- заголовок страницы со счётчиком `total` и кнопкой создания (с проверкой `createAction` через `useCan()`);
- `summarySlot` (например, `TransactionsSummary`);
- строку поиска + кнопку `FilterSheet` (`filterConfig`, `filterRules`);
- плашки активных фильтров (`pillFilters` с авто-исключением ключей быстрых чипов `quickFilterKeys` и применением `filterRules` при удалении);
- быстрые фильтр-чипы (`quickFilters`: `ProductQuickFilters`, `DebtorQuickFilters`, `TransactionQuickFilters`);
- переключение между десктопной таблицей (`DataTable` или кастомный `renderTable`) и мобильным списком карточек (`renderMobileCard`, опционально с группировкой `getMobileGroups`);
- скелетон загрузки, `EmptyState`, пагинацию (`PaginationBar` / `MobilePagination`) и слот `children` для модалок.

---

## Columns & `ActionButtons`

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

Использовать `createColumnHelper<T>()` и общий компонент `ActionButtons` (`app/components/shared/ActionButtons.tsx`) для кнопок действий (`onView`, `onEdit`, `onDelete`, `onPay`, `onRefund`, `onRestock`) как в колонках таблиц, так и в мобильных карточках (`app/components/cards/*`).

Не определять большие `ColumnDef[]` непосредственно внутри route component.

---

## Background fetching

При использовании `DataTable` / `ListPageLayout` передавать `isFetching` (через `list`), чтобы текущие rows оставались видимыми во время background refetch. Не показывать полный skeleton на каждый page/filter change.

---

# 17. Filters & Conflict Rules

Filter definitions находятся в:

```text
configs/filters.ts
```

Использовать `FilterConfig` (`select`, `number-range`, `date-range`, `boolean`).

---

## Filter Conflict Rules (`FilterRule`)

Для взаимоисключающих фильтров (например, `health` vs `reorderPriority` у товаров, `risk` vs `overdue`/`includePaid` у должников, быстрые пресеты у транзакций) используются декларативные правила:

```text
app/types/filters.ts      # тип FilterRule
app/lib/filter-rules.ts   # applyFilterWithRules(), clearFilterGroup(), isGroupActive()
```

Правила объявляются в `configs/filters.ts` соответствующей сущности (`PRODUCT_FILTER_RULES`, `DEBTOR_FILTER_RULES`, `TRANSACTION_FILTER_RULES`) и передаются в `ListPageLayout` (`filterRules`), `FilterSheet` и компоненты быстрых фильтров.

---

## Search & Filter params

- Search использует debounce (`useDebounce`, встроен в `useEntityList`).
- Преобразование `ActiveFilter[]` в API query params выполняется через `app/lib/filtersToParams.ts`. Не собирать query params вручную внутри страниц.

---

# 18. Forms & `EntityFormPage`

Основной form stack:

```text
react-hook-form
+
Zod
+
@hookform/resolvers/zod
```

Использовать:
- хук `app/hooks/useForm.ts`
- обёртку страницы формы `app/components/shared/EntityFormPage.tsx`
- переиспользуемые поля сущности `app/components/forms/*FormFields.tsx` (`UserFormFields`, `MarketFormFields`, `SellerFormFields`, `ProductFormFields`, `DebtorFormFields`)

`EntityFormPage` унифицирует для всех create/edit страниц:
- skeleton при загрузке (`isLoading`)
- `EmptyState` если запись не найдена (`notFound`)
- `BreadCrumbs` и заголовок
- карточку формы, `FormWrapper` и кнопки `Submit` / `Cancel`

Create и Edit страницы одной сущности не должны дублировать JSX разметку полей — поля выносятся в `*FormFields.tsx`.

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

Schemas должны быть factories, если содержат user-facing translated messages, и мемоизироваться через `useMemo(() => createProductSchema(t), [t])`.

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

Использовать `toDayjs()`, `toDate()`, а для отображения — `formatDate()` из `app/lib/format.ts`.

Не использовать разбросанные `dayjs(date).format(...)` по всему application code.

---

# 22. i18n

Languages: `ru`, `en`, `tg` (default/fallback: `ru`).

Locales:

```text
public/locales/
├── ru/
├── en/
└── tg/
```

- Все user-facing строки проходят через `t(...)`.
- Entity pages используют explicit namespaces: `useTranslation(['products', 'common'])`.
- Заголовок и breadcrumb на `/<entity>/create` используют entity-scoped ключ `t('create')` с явным названием сущности (например, `"Создать должника"`), а не generic `t('actions.create')`.
- Справочник `/guide` (`public/locales/{ru,en,tg}/guide.json`) разбит на 9 разделов (`gettingStarted`, `dashboard`, `products`, `transactions`, `debtors`, `markets`, `sellers`, `users`, `sync`) и синхронизирован на всех 3 языках.

---

# 23. UI architecture

Основные layers:

```text
components/ui/          # базовые примитивы (@base-ui/react + shadcn)
components/ui/form/     # FormInput, FormTextarea, FormCustomSelect, FormPasswordInput, FormImageUpload, PickerField
components/forms/       # переиспользуемые наборы полей сущностей (*FormFields.tsx)
components/cards/       # мобильные карточки сущностей (*Card.tsx)
components/shared/      # ListPageLayout, EntityFormPage, DataTable, FilterSheet, ActionButtons, DetailLayout, KpiGrid, MiniCharts, SignalBlock, MobileCard и др.
components/modals/      # PayTransactionModal, RefundTransactionModal, RestockProductModal, ConfirmDialog
components/dashboard/   # виджеты дашборда и аналитических вкладок
components/guide/       # модульные компоненты справочника (GuideSidebar, GuideArticleView, GuideSearchModal, guide-highlight)
components/sync/        # секции страницы /sync
components/layout/      # Header, Sidebar, NavMain, BottomNav, UserNav, ModeToggle, LanguageSwitcher, Panel
```

---

## Modals

Modal components находятся в `app/components/modals/`. Visibility контролируется через `createModalStore()`.
- Для подтверждения удаления использовать `ConfirmDialog`.
- Для пополнения остатка товара (`POST /products/:id/restock`) использовать `RestockProductModal`.
- Для оплаты долга и возврата продажи — `PayTransactionModal` и `RefundTransactionModal`.

---

# 24. Page structure

Entity page разделяется на:

```text
route.tsx               # список через useEntityList + ListPageLayout
store.ts                # createTableStore + createModalStore
configs/
├── columns.tsx         # колонки таблицы (getColumns)
└── filters.ts          # FilterConfig[] + FilterRule[]
id/
└── route.tsx           # детальная страница (DetailLayout, KpiGrid, SignalBlock и т.д.)
create/
└── route.tsx           # создание через EntityFormPage + *FormFields
id/edit/
└── route.tsx           # редактирование через EntityFormPage + *FormFields
```

Сложные интерактивные страницы (например, `app/routes/(crm)/transactions/create/`) декомпозируются на локальные подкомпоненты и хуки (`ProductPickerSection`, `CartSummaryPanel`, `CartItemCard`, `TransactionConfirmSheet`, `useTransactionCart`).

---

# 25. CUD architecture

Create/edit flows существуют как page routes (`EntityFormPage`) для entities:

```text
users
markets
sellers
products
debtors
```

Products дополнительно поддерживают модальное пополнение склада (`RestockProductModal` → `POST /products/:id/restock`).

Transactions:

```text
create page (/transactions/create — корзина со скидками/наценками по позициям и шторкой подтверждения)
pay modal (PayTransactionModal)
refund modal (RefundTransactionModal — полный или частичный возврат по позициям)
delete confirmation (ConfirmDialog)
```

---

# 26. Detail pages

Detail pages используют общие строительные блоки из `app/components/shared/`:

```text
ByIdSkeleton
BreadCrumbs
DetailLayout (DetailHero, DetailSection, DetailStatRow и др.)
KpiGrid
MiniCharts
SignalBlock
InfoItem
Panel
```

Для `users`, `markets`, `sellers`, `debtors` данные загружаются одним запросом через `GET /<entity>/:id/full` (`nestedDetailRequest`).

---

# 27. Navigation & layout

Основные layout components находятся в `app/components/layout/`.
CRM layout (`app/routes/(crm)/layout.tsx`) отвечает за sidebar, header, main scroll area, auth guard и route-level access. На мобильных экранах используется `BottomNav`.

---

# 28. Theme

Theme provider (`app/components/theme-provider.tsx`) использует `next-themes`. Design tokens находятся в `app/styles/global.css`.
- Основной шрифт: `Inter Variable`.
- Предпочитать semantic classes (`text-primary`, `bg-primary`, `text-success`, `bg-warning/15`, `text-destructive`), а не прямые hex values в компонентах.

---

# 29. Mobile / Capacitor

Mobile shell использует **Capacitor 8** (`capacitor.config.ts`, `appId: com.tradecrm.app`, `webDir: build/client`).
UI учитывает Android WebView:
- не полагается на session cookies;
- не использует sticky hover behavior;
- поддерживает свайп-действия на мобильных карточках (`SwipeableCard` / `MobileCard`) и крупные touch targets.

---

# 30. Offline & Sync

Offline-поддержка построена поверх встроенных механизмов TanStack Query и персистентного хранилища (SQLite на Android / IndexedDB в браузере):

```text
app/lib/
├── network-status.ts            # единственный источник истины о сети, подключён к onlineManager React Query
├── offline-storage.ts           # SQLite (native/@capacitor-community/sqlite) или IndexedDB (браузер)
├── query-persister.ts           # построчный персист query-кеша; версия через CACHE_BUSTER
├── offline-mutations.ts         # offline-определения createDebtor/createTransaction/payTransaction/refundTransaction
├── offline-queue.ts             # витрина очереди для UI (/sync)
├── offline-overlay.ts           # подмешивает очередь к спискам: строки «в очереди», пересчёт долгов/остатков/склада
├── offline-sent.ts              # удержание принятых сервером операций в оверлее до рефетча списка
├── client-ids.ts                # временные id `local-…` и их маппинг на серверные UUID
├── detached-submit.ts           # «отпустить» форму через 1.5 с или сразу офлайн
├── load-transaction-for-pay.ts  # транзакция для окна оплаты: сеть ≤4 с, иначе копия с устройства
├── offline-errors.ts            # PlainError — ошибка без Authorization-заголовка, безопасна для персиста
├── offline-sync.ts              # логика «Синхронизировать всё»
└── offline-session.ts           # владелец кеша/очереди при логине/логауте
```

Key rules:
1. **Источник истины о сети:** только `useNetworkStatus()` / `network-status.ts` (через Capacitor Network), никогда `navigator.onLine`.
2. **Офлайн-мутации:** только `createDebtor`, `createTransaction`, `payTransaction`, `refundTransaction` (`OFFLINE_MUTATION_KEYS`). Все 4 защищены `@Idempotent()` (`Idempotency-Key`) на бэкенде.
3. **Оверлей очереди:** списки должников и транзакций обязаны пропускать данные через `useDebtorRows` / `useTransactionRows` (`useOfflineOverlay.ts`), а остатки товаров в корзине — через `usePendingStock`.
4. **Отправка без ожидания (`useDetachedMutation`):** формы офлайн-мутаций передают в `useMutation` **только `mutationKey`** (чтобы не перетереть `setMutationDefaults`) и закрываются/переходят по `release`.

---

# 31. Error handling & Loading / Empty states

- Глобальный Axios interceptor в `app/lib/client.ts` обрабатывает сетевые ошибки, `401` (сброс сессии и переход на `/login`) и `4xx/5xx` (показ toast).
- Первая загрузка страницы использует соответствующий skeleton (`TableSkeleton`, `ByIdSkeleton`, `FormPageSkeleton`, `DashboardSkeleton`).
- Фоновый refetch использует `isFetching` с сохранением текущих данных (`keepPreviousData`).
- Для пустых списков и ненайденных записей используется `EmptyState`.

---

# 32. Important domain conventions

- **Roles:** Backend `ADMIN | OWNER | SELLER` ↔ Frontend `Role.Admin | Role.Owner | Role.Seller` (`normalizeRole` в `auth-utils.ts`).
- **Transaction types:** `DEBT | SALE | REFUND`.
- **Payment types:** `CASH | CARD | CREDIT`.
- **Transaction statuses:** `ACTIVE | PARTIAL | PAID | REFUNDED | PARTIALLY_REFUNDED`.

---

# 33. New feature checklist

При добавлении новой feature проверить:

```text
[ ] routes.ts
[ ] ROUTE_PERMISSIONS
[ ] Action enum + ACTION_PERMISSIONS + API_ROUTE_ACTIONS
[ ] navigation.ts (если пункт меню)
[ ] API module (через crud.ts helpers)
[ ] types + validations + translations (ru / en / tg)
[ ] query key в query-keys.ts
[ ] useEntityList + ListPageLayout (если списочная страница)
[ ] EntityFormPage + *FormFields (если create/edit страница)
[ ] useEntityMutation (или useDetachedMutation + Idempotency-Key для offline)
[ ] FilterRule[] (если есть взаимоисключающие фильтры)
[ ] responsive/mobile behavior (карточки + свайп/ActionButtons)
[ ] npm run typecheck && npm run build
```

---

# 34. Don't

Не:

```text
❌ использовать raw fetch или импортировать axios напрямую в feature code
❌ использовать Radix как UI foundation (используется @base-ui/react)
❌ делать role-based UI через raw string comparison вместо useCan()
❌ добавлять route без ROUTE_PERMISSIONS
❌ добавлять endpoint без проверки API_ROUTE_ACTIONS
❌ дублировать шаблон списочной страницы вместо useEntityList + ListPageLayout
❌ дублировать шаблон create/edit страницы вместо EntityFormPage + *FormFields
❌ дублировать CRUD helpers или filter-to-query-param logic
❌ создавать query keys вручную вне query-keys.ts
❌ хардкодить переводимые строки
❌ подписываться на весь Zustand store целиком
❌ показывать full skeleton при каждом background refetch
❌ возвращать auth на cookie-based architecture
❌ добавлять мутацию в OFFLINE_MUTATION_KEYS без Idempotency-Key на бэкенде
❌ проверять связь через navigator.onLine вместо useNetworkStatus()
```
