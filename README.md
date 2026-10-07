# TradeCRM Frontend

**TradeCRM** — SPA-система управления торговлей для рынков и магазинов.

Frontend работает как веб-приложение и как **Android-приложение через Capacitor**.

Backend: **NestJS + Prisma + PostgreSQL**.

---

## Возможности

- CRUD для `Users`, `Markets`, `Sellers`, `Products`, `Categories`, `Debtors`, `Transactions`
- RBAC с ролями `Admin`, `Owner`, `Seller`
- Dashboard с аналитикой продаж, долгов, склада и продавцов
- Продажи, продажи в долг, оплаты, частичные оплаты и возвраты
- Управление должниками и уровнями риска
- Каталог товаров, категории, единицы измерения и остатки
- Управление рынками и продавцами
- Поиск, сортировка, pagination и фильтры
- Виртуализированные таблицы
- Inline-фильтры и `FilterSheet`
- Тёмная и светлая тема
- Русский, английский и таджикский языки
- Загрузка изображений для товаров, рынков и профиля
- Встроенное offline-руководство `/guide`
- Адаптация интерфейса под Android WebView
- Сохранение авторизованной сессии в `localStorage`
- Интеграция с Capacitor для Android
- Автоматическая сборка APK через GitHub Actions

---

## Технический стек

| Категория       | Технологии                             |
| --------------- | -------------------------------------- |
| Framework       | React Router 7, SPA (`ssr: false`)     |
| UI              | React 19 + TypeScript 5.9              |
| Build           | Vite 7                                 |
| Styling         | TailwindCSS 4 + `tw-animate-css`       |
| Font            | Inter Variable                         |
| UI primitives   | shadcn/ui + `@base-ui/react`           |
| State           | Zustand                                |
| Server state    | TanStack React Query 5                 |
| HTTP            | Axios                                  |
| Forms           | React Hook Form                        |
| Validation      | Zod                                    |
| Auth            | Bearer token + `localStorage`          |
| i18n            | react-i18next + i18next-http-backend   |
| Tables          | TanStack Table                         |
| Virtualization  | TanStack Virtual                       |
| Charts          | Recharts                               |
| Dates           | Day.js                                 |
| Icons           | lucide-react                           |
| Toasts          | Sonner                                 |
| Date picker     | Flatpickr                              |
| Command palette | cmdk                                   |
| Theme           | next-themes                            |
| Mobile          | Capacitor 8                            |
| Android         | Capacitor Android                      |
| E2E             | Playwright                             |
| Formatting      | Prettier + prettier-plugin-tailwindcss |

---

## Архитектура

Проект разделён на несколько основных слоёв:

```text
app/
├── api/             # API-модули
├── components/      # UI и переиспользуемые компоненты
├── config/          # permissions, actions, navigation и конфиги
├── hooks/           # React hooks
├── lib/             # инфраструктурные utilities
├── routes/          # страницы и routing
├── store/           # Zustand factories
├── types/           # TypeScript types
├── validations/     # Zod schemas
└── styles/          # глобальные стили
```

### Основной поток данных

```text
Route
  ↓
React Query
  ↓
API module
  ↓
apiClient
  ↓
Axios interceptor
  ↓
Backend API
```

---

## Routing

Маршруты регистрируются вручную в:

```text
app/routes.ts
```

Файловый routing не используется.

### Auth

```text
/login
```

---

### CRM

```text
/
```

Главный маршрут делает redirect:

```text
Admin / Owner → /dashboard
Seller        → /transactions
```

### Dashboard

```text
/dashboard
/dashboard/inventory
/dashboard/products
/dashboard/sellers
```

#### `/dashboard`

Обзор:

- общие метрики
- продажи
- доход
- долги
- состояние склада
- последние транзакции

#### `/dashboard/inventory`

Аналитика склада:

- товары, которые нужно заказать
- состояние остатков
- возвраты

#### `/dashboard/products`

Аналитика товаров:

- лидеры по выручке
- лидеры по количеству
- категории

#### `/dashboard/sellers`

Отчёт по продавцам.

Dashboard поддерживает фильтры периода и продавца.

---

### Profile

```text
/profile
```

Профиль текущего пользователя:

- личные данные
- изображение
- изменение пароля

---

### Users

```text
/users
/users/create
/users/:id
/users/:id/edit
```

---

### Markets

```text
/markets
/markets/create
/markets/:id
/markets/:id/edit
```

Для `Owner` и `Seller` пункт **My Market** ведёт непосредственно на рынок пользователя:

```text
/markets/:marketId
```

---

### Sellers

```text
/sellers
/sellers/create
/sellers/:id
/sellers/:id/edit
```

---

### Products

```text
/products
/products/create
/products/:id
/products/:id/edit
```

---

### Categories

```text
/categories
/categories/create
/categories/:id
/categories/:id/edit
```

---

### Debtors

```text
/debtors
/debtors/create
/debtors/:id
/debtors/:id/edit
```

---

### Transactions

```text
/transactions
/transactions/create
/transactions/:id
```

Дополнительные операции:

```text
PATCH /transactions/:id/pay
POST  /transactions/:id/refund
```

---

### Service routes

```text
/guide
/403
*
```

`/guide` доступен всем авторизованным ролям.

---

# Authentication

TradeCRM использует **Bearer authentication**.

Backend после:

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

Frontend сохраняет:

```text
localStorage
├── accessToken
└── user
```

Доступ к session API находится в:

```text
app/lib/auth-utils.ts
```

### Запросы

Каждый API-запрос получает:

```http
Authorization: Bearer <accessToken>
```

через Axios interceptor.

### Logout / 401

При ответе:

```text
401 Unauthorized
```

frontend:

1. очищает session;
2. удаляет `accessToken`;
3. удаляет `user`;
4. переводит пользователя на `/login`.

---

# RBAC

В системе три роли:

```text
Admin
Owner
Seller
```

RBAC разделён на несколько уровней.

```text
Route
  ↓
ROUTE_PERMISSIONS
  ↓
Action
  ↓
ACTION_PERMISSIONS
  ↓
useCan()
  ↓
API_ROUTE_ACTIONS
```

### Route permissions

Файл:

```text
app/config/permissions.ts
```

Определяет доступ ролей к страницам.

### Action permissions

Файл:

```text
app/config/actions.ts
```

Содержит действия:

```text
USERS_CREATE
USERS_EDIT
USERS_DELETE

PRODUCTS_CREATE
PRODUCTS_EDIT
PRODUCTS_DELETE

TRANSACTIONS_CREATE
TRANSACTIONS_EDIT
TRANSACTIONS_REFUND

SELLERS_CREATE
SELLERS_EDIT
SELLERS_DELETE

DEBTORS_CREATE
DEBTORS_EDIT
DEBTORS_DELETE
```

и другие.

### UI gating

Для проверки прав в React используется:

```ts
const { can } = useCan();

if (can(Action.PRODUCTS_EDIT)) {
  // ...
}
```

Сравнивать роли напрямую в компонентах не следует.

---

## API RBAC

Axios interceptor дополнительно сопоставляет:

```text
HTTP method + API path
        ↓
Action
        ↓
ACTION_PERMISSIONS
```

Например:

```text
PATCH /products/:id
        ↓
PRODUCTS_EDIT
```

Если у пользователя нет соответствующего права, запрос блокируется ещё на клиенте.

> Backend всё равно остаётся главным источником истины для безопасности. Client-side RBAC предназначен также для UX и предотвращения заведомо запрещённых запросов.

---

# API layer

Все HTTP-запросы выполняются через:

```text
app/lib/client.ts
```

Axios instance:

```text
VITE_API_URL + /api
```

с timeout:

```text
15000 ms
```

API-модули:

```text
app/api/
├── auth.ts
├── users.ts
├── markets.ts
├── products.ts
├── categories.ts
├── sellers.ts
├── debtors.ts
├── transactions.ts
├── dashboard.ts
├── profile.ts
└── crud.ts
```

Общие CRUD-операции вынесены в:

```text
app/api/crud.ts
```

Это позволяет entity API-модулям не дублировать стандартную реализацию списка, detail, delete и write operations.

---

# Data fetching

Используется:

```text
@tanstack/react-query
```

Конфигурация находится в:

```text
app/lib/query-client.ts
```

Основные настройки:

```text
staleTime: 60 seconds
placeholderData: keepPreviousData
query retries: 2
mutation retries: false
```

`keepPreviousData` используется для того, чтобы pagination и изменение фильтров не приводили к резкому исчезновению текущей таблицы во время загрузки.

---

# Query keys

Query keys централизованы в:

```text
app/lib/query-keys.ts
```

Новые query keys не следует создавать вручную в страницах.

Принцип:

```text
entity
 ├── list
 ├── options
 ├── detail
 ├── full
 └── ...
```

Для invalidation следует использовать prefix:

```ts
queryClient.invalidateQueries({
  queryKey: ['products'],
});
```

---

# State management

Для UI-state используется:

```text
Zustand
```

Factories:

```text
app/store/useTableStore.ts
app/store/createModalStore.ts
```

### Table store

Каждая entity list page имеет собственный scoped store:

```text
app/routes/(crm)/users/store.ts
app/routes/(crm)/markets/store.ts
app/routes/(crm)/sellers/store.ts
...
```

Store содержит:

```text
page
limit
search
filters
```

и операции:

```text
setPage
setLimit
setSearch
setFilter
removeFilter
setFilters
resetFilters
```

Изменение search/filter/page-size сбрасывает pagination на первую страницу.

---

### Modal store

Модальные окна используют typed Zustand stores:

```text
createModalStore()
```

Пример:

```ts
const deleteModal = useUsersModals((state) => state.delete);
```

Не следует подписываться на весь store:

```ts
// плохо
const modals = useUsersModals();
```

Лучше подписываться только на нужный slice.

---

# Tables

Используются:

```text
@tanstack/react-table
@tanstack/react-virtual
```

Общие table-компоненты находятся в:

```text
app/components/shared/
```

Основной reusable компонент:

```text
DataTable
```

Колонки entity должны определяться через factory:

```text
configs/columns.tsx
```

Например:

```ts
getColumns({ t, onAction });
```

Это позволяет корректно работать с i18n и callback dependencies.

---

# Filters

Фильтры описываются через:

```text
FilterConfig
```

и находятся в:

```text
configs/filters.ts
```

Поддерживаются:

```text
select
number-range
date-range
boolean
```

Для преобразования frontend filters в API query params используется:

```text
app/lib/filtersToParams.ts
```

Search перед запросом проходит через debounce.

---

# Forms & Validation

Формы используют:

```text
react-hook-form
Zod
@hookform/resolvers/zod
```

В проекте используется собственная i18n-aware обёртка:

```text
app/hooks/useForm.ts
```

Validation schemas находятся в:

```text
app/validations/
```

Фабрика schema имеет вид:

```ts
createProductSchema(t);
```

Это позволяет переводить validation messages при смене языка.

Для multipart-запросов используется:

```text
app/lib/form-data.ts
```

---

# Date handling

Для дат используется:

```text
dayjs
```

Все даты должны проходить через:

```text
toDayjs()
toDate()
```

из:

```text
app/lib/date.ts
```

Для вывода дат используется:

```text
formatDate()
```

из:

```text
app/lib/format.ts
```

---

# Internationalization

Поддерживаются:

```text
ru
en
tg
```

Основной язык:

```text
ru
```

Locale files:

```text
public/locales/
├── ru/
├── en/
└── tg/
```

Используется:

```text
react-i18next
i18next-http-backend
```

Все пользовательские строки должны находиться в locale-файлах, а не быть захардкожены в JSX.

---

# Theme & UI

Theme:

```text
next-themes
```

Поддерживаются:

```text
light
dark
system
```

Основные дизайн-токены находятся в:

```text
app/styles/global.css
```

Текущая визуальная система ориентирована на:

- чистый mobile-first UI;
- системную типографику;
- крупные touch targets;
- адаптацию под Android WebView;
- semantic color tokens;
- аккуратные карточки и панели;
- отсутствие sticky hover на touch-устройствах.

Primary:

```text
Light: #007aff
Dark:  #0a84ff
```

Шрифт:

```text
Inter Variable
```

---

# Mobile / Android

TradeCRM может собираться как Android APK через:

```text
Capacitor 8
```

Конфигурация:

```text
capacitor.config.ts
```

Основные параметры:

```text
appId: com.tradecrm.app
appName: TradeCRM
webDir: build/client
```

Используемые плагины:

```text
@capacitor/app
@capacitor/network
@capacitor/keyboard
@capacitor/status-bar
@capacitor-community/sqlite
```

UI адаптирован под Android WebView.

Авторизация хранится в `localStorage`, чтобы session переживала перезапуск Android-приложения.

---

# Android build

### Локально

```bash
npm install
npm run build

npx cap add android
npx cap sync android

cd android
./gradlew assembleDebug
```

APK:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

---

# GitHub Actions

Workflow:

```text
.github/workflows/android.yml
```

Запускается:

```text
push → main
workflow_dispatch
```

Pipeline:

```text
Checkout
   ↓
Node 22
   ↓
Java 21
   ↓
npm ci
   ↓
npm run typecheck
   ↓
npm run build
   ↓
cap add android
   ↓
generate Android assets
   ↓
cap sync
   ↓
gradlew assembleDebug
   ↓
upload artifact
```

Backend URL передаётся через GitHub Secret:

```text
API_URL
```

---

# Built-in Guide

В приложение встроено руководство:

```text
/guide
```

Оно работает без сетевого запроса, потому что markdown-контент включается непосредственно в frontend bundle.

Структура:

```text
app/routes/(crm)/guide/
├── route.tsx
├── sections.ts
├── content-loader.ts
└── content/
    ├── ru/
    ├── en/
    └── tg/
```

Используется собственный markdown renderer:

```text
app/components/shared/Markdown.tsx
```

Поддерживаются:

- заголовки;
- списки;
- таблицы;
- code blocks;
- links;
- callouts;
- поиск и подсветка совпадений.

---

# Project structure

```text
app/
├── api/
│   ├── auth.ts
│   ├── users.ts
│   ├── markets.ts
│   ├── products.ts
│   ├── categories.ts
│   ├── sellers.ts
│   ├── debtors.ts
│   ├── transactions.ts
│   ├── dashboard.ts
│   ├── profile.ts
│   └── crud.ts
│
├── components/
│   ├── ui/
│   ├── ui/form/
│   ├── shared/
│   ├── modals/
│   ├── dashboard/
│   ├── layout/
│   ├── products/
│   ├── transactions/
│   ├── debtors/
│   └── markets/
│
├── config/
│   ├── actions.ts
│   ├── permissions.ts
│   ├── navigation.ts
│   ├── enumOptions.ts
│   ├── period.ts
│   └── transactionBadges.ts
│
├── hooks/
│
├── lib/
│   ├── client.ts
│   ├── auth-utils.ts
│   ├── query-client.ts
│   ├── query-keys.ts
│   ├── date.ts
│   ├── format.ts
│   ├── navigation.ts
│   ├── filtersToParams.ts
│   ├── form-data.ts
│   └── utils.ts
│
├── routes/
│   ├── (auth)/
│   └── (crm)/
│       ├── dashboard/
│       ├── users/
│       ├── markets/
│       ├── sellers/
│       ├── products/
│       ├── categories/
│       ├── debtors/
│       ├── transactions/
│       ├── profile/
│       ├── guide/
│       ├── forbidden/
│       └── notfound/
│
├── store/
│
├── types/
│
├── validations/
│
└── styles/
    └── global.css

public/
└── locales/
    ├── ru/
    ├── en/
    └── tg/

capacitor.config.ts
android/
.github/
├── workflows/
│   └── android.yml
Dockerfile
package.json
```

---

# Commands

| Command                  | Description                                     |
| ------------------------ | ----------------------------------------------- |
| `npm run dev`            | Запуск development server                       |
| `npm run dev:fresh`      | Очистка Vite cache и запуск                     |
| `npm run build`          | Production build                                |
| `npm run typecheck`      | React Router type generation + TypeScript check |
| `npm run start`          | Production preview на порту `3000`              |
| `npm run test:e2e`       | Playwright tests                                |
| `npx prettier --write .` | Форматирование и сортировка Tailwind classes    |

---

# Development

```bash
git clone <repository>
cd trade-crm-frontend

cp .env.example .env

npm install
npm run dev
```

По умолчанию:

```text
http://localhost:5173
```

---

# Environment

`.env`:

```env
VITE_API_URL=http://localhost:4000
```

API будет доступен как:

```text
http://localhost:4000/api
```

`VITE_API_URL` не должен заканчиваться `/`.

---

# Docker

Build:

```bash
docker build -t trade-crm .
```

Run:

```bash
docker run -p 3000:3000 trade-crm
```

Production preview:

```text
http://localhost:3000
```

---

# Backend

Frontend рассчитан на backend:

```text
NestJS
Prisma
PostgreSQL
```

API base:

```text
/api
```

Authentication:

```text
Bearer access token
```

Основные роли backend:

```text
ADMIN
OWNER
SELLER
```

Frontend должен рассматриваться как клиент backend API; бизнес-критичные проверки должны выполняться и на backend.

---

# Development rules

При добавлении новой feature обычно необходимо проверить:

```text
1. routes.ts
2. ROUTE_PERMISSIONS
3. Action / ACTION_PERMISSIONS
4. API_ROUTE_ACTIONS
5. navigation.ts
6. API module
7. types
8. validation
9. translations
```

Для новой entity следует придерживаться существующей структуры:

```text
app/routes/(crm)/<entity>/
├── route.tsx
├── store.ts
├── configs/
│   ├── columns.tsx
│   └── filters.ts
├── id/
│   └── route.tsx
├── create/
│   └── route.tsx
└── id/
    └── edit/
        └── route.tsx
```

Reusable components размещаются в:

```text
app/components/shared/
```

Modal components:

```text
app/components/modals/
```

Dashboard widgets:

```text
app/components/dashboard/
```

---

# Important conventions

### Imports

Используется alias:

```text
~/*
```

например:

```ts
import { cn } from '~/lib/utils';
```

Предпочтительно не использовать длинные relative imports вроде:

```ts
../../../../components
```

---

### UI

Используйте существующие primitives из:

```text
app/components/ui/
```

и reusable components из:

```text
app/components/shared/
```

Для class merging:

```ts
cn(...)
```

из:

```text
~/lib/utils
```

---

### Permissions

Не использовать:

```ts
user.role === 'Admin';
```

в UI-компонентах.

Использовать:

```ts
can(Action.USERS_EDIT);
```

через:

```text
useCan()
```

---

### API

Не использовать прямой:

```ts
axios.get(...)
fetch(...)
```

Для запросов приложения использовать:

```text
apiClient
```

из:

```text
~/lib/client
```

---

# Quality gates

Основные автоматические проверки:

```bash
npm run typecheck
npm run build
```

Для E2E:

```bash
npm run test:e2e
```

Lint-система в проекте не настроена.

---

## License

Private project — использование и распространение регулируется владельцем проекта.
