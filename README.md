# TradeCRM Frontend

**TradeCRM** — SPA-система управления торговлей для рынков и магазинов.

Frontend работает как веб-приложение и как **Android-приложение через Capacitor**.

Backend: **NestJS + Prisma + PostgreSQL**.

---

## Возможности

- Управление сущностями `Users`, `Markets`, `Sellers`, `Products`, `Debtors`, `Transactions`
- RBAC с ролями `Admin`, `Owner`, `Seller` (`ROUTE_PERMISSIONS`, `ACTION_PERMISSIONS`, `API_ROUTE_ACTIONS`, `useCan()`)
- Многовкладочный Dashboard (`/dashboard`, `/dashboard/inventory`, `/dashboard/products`, `/dashboard/sellers`) с аналитикой продаж, долгов, склада и продавцов
- Продажи, продажи в долг, скидки и наценки по позициям, частичные и полные оплаты, полные и частичные возвраты
- Управление должниками, кредитным профилем, просрочками и уровнями риска (`LOW / MEDIUM / HIGH / CRITICAL`)
- Каталог товаров с аналитикой скорости продаж, запаса в днях, здоровья остатков и быстрым пополнением склада (`RestockProductModal` → `POST /products/:id/restock`)
- Поиск с debounce, сортировка, пагинация, `FilterSheet`, быстрые фильтр-чипы и декларативные правила разрешения конфликтующих фильтров (`FilterRule`)
- Группировка транзакций по дням с дневными итогами и сводной полосой (`TransactionsSummary`)
- Виртуализированные десктопные таблицы (`DataTable`) и мобильные карточки со свайп-действиями (`SwipeableCard`)
- Тёмная, светлая и системная тема (`next-themes`)
- Трёхъязычный интерфейс: русский (`ru`), английский (`en`) и таджикский (`tg`)
- Загрузка изображений для товаров, рынков, продавцов, пользователей и профиля
- Встроенное интерактивное руководство `/guide` по 9 разделам системы с мгновенным поиском и подсветкой совпадений
- **Офлайн-режим и синхронизация (`/sync`)**: данные кэшируются на устройство (SQLite на Android, IndexedDB в браузере), а создание должников, продаж/долгов, оплат и возвратов работает без сети с мгновенным отображением в списках (`offline-overlay`) и фоновой идемпотентной отправкой при восстановлении связи
- Автоматическая сборка Android APK через GitHub Actions

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
| State           | Zustand 5                              |
| Server state    | TanStack React Query 5                 |
| HTTP            | Axios                                  |
| Forms           | React Hook Form (`useForm` wrapper)    |
| Validation      | Zod 4                                  |
| Auth            | Bearer token + `localStorage`          |
| i18n            | react-i18next + i18next-http-backend   |
| Tables          | TanStack Table                         |
| Virtualization  | TanStack Virtual                       |
| Charts          | Recharts                               |
| Dates           | Day.js (`date.ts` + `format.ts`)       |
| Icons           | lucide-react                           |
| Toasts          | Sonner                                 |
| Date picker     | Flatpickr                              |
| Command palette | cmdk                                   |
| Theme           | next-themes                            |
| Mobile          | Capacitor 8 (Android)                  |
| Offline storage | `@capacitor-community/sqlite`          |
| E2E             | Playwright                             |
| Formatting      | Prettier + prettier-plugin-tailwindcss |

---

## Архитектура

Проект разделён на чёткие слои:

```text
app/
├── api/             # API-модули и общие CRUD-хелперы (crud.ts)
├── components/      # UI-примитивы, формы, карточки, модалки и общие лейауты
├── config/          # permissions, actions, navigation и enum-конфиги
├── hooks/           # useEntityList, useEntityMutation, offline/network и UI-хуки
├── lib/             # HTTP-клиент, query-client, фильтрация, форматирование, офлайн-ядро
├── routes/          # страницы и маршруты
├── store/           # фабрики Zustand (useTableStore, createModalStore, useSyncStore)
├── types/           # доменные TypeScript-типы
├── validations/     # i18n-фабрики Zod-схем
└── styles/          # глобальные стили и дизайн-токены
```

### Основной поток данных

```text
Route (ListPageLayout / EntityFormPage / DetailLayout)
  ↓
useEntityList / useEntityMutation / useDetachedMutation
  ↓
TanStack React Query + Offline Overlay
  ↓
API module (crud.ts)
  ↓
apiClient (Axios + RBAC pre-flight + Auth / Error interceptors)
  ↓
Backend API (/api)
```

---

## Маршруты (`app/routes.ts`)

- **Auth:** `/login`
- **Root redirect (`/`):** `Admin / Owner → /dashboard`, `Seller → /transactions`
- **Dashboard (`Admin`, `Owner`):**
  - `/dashboard` — обзор ключевых метрик, тренда выручки, пульса продаж, денежного потока, прибыли/скидок, тепловых карт по дням недели и часам
  - `/dashboard/inventory` — здоровье склада, срочность закупок, возвраты
  - `/dashboard/products` — ABC-лидеры по выручке и количеству
  - `/dashboard/sellers` — рейтинг и детальный отчёт по продавцам
- **Profile:** `/profile` (личные данные, аватар, смена пароля)
- **Users (`Admin`):** `/users`, `/users/create`, `/users/:id`, `/users/:id/edit`
- **Markets (`Admin`, `Owner`, `Seller` для своего маркета):** `/markets`, `/markets/create`, `/markets/:id`, `/markets/:id/edit`
- **Sellers (`Admin`, `Owner`):** `/sellers`, `/sellers/create`, `/sellers/:id`, `/sellers/:id/edit`
- **Products:** `/products`, `/products/create`, `/products/:id`, `/products/:id/edit` (+ модальное пополнение остатка `RestockProductModal`)
- **Debtors:** `/debtors`, `/debtors/create`, `/debtors/:id`, `/debtors/:id/edit`
- **Transactions:** `/transactions`, `/transactions/create`, `/transactions/:id` (+ модалки оплаты `PayTransactionModal` и возврата `RefundTransactionModal`)
- **Sync:** `/sync` — управление офлайн-режимом, очередью операций, покрытием кэша и памятью устройства
- **Service routes:** `/guide` (справочник), `/403` (доступ запрещён), `*` (404)

---

## Унифицированные паттерны страниц

### Списочные страницы (`useEntityList` + `ListPageLayout`)

Все 6 списочных разделов (`users`, `markets`, `sellers`, `products`, `debtors`, `transactions`) используют:
- **`useEntityList`** (`app/hooks/useEntityList.ts`) — связывает Zustand table store (`page`, `limit`, `search`, `filters`, `sorting`), `useDebounce`, `filtersToParams` и `useQuery`.
- **`ListPageLayout`** (`app/components/shared/ListPageLayout.tsx`) — рендерит шапку со счётчиком и кнопкой создания, `summarySlot`, поиск, `FilterSheet`, плашки активных фильтров (`pillFilters`), чипы быстрых фильтров (`quickFilters`), десктопную таблицу (`DataTable`) и мобильные карточки (включая группировку по дням `getMobileGroups`), пагинацию и модальные окна.
- **`FilterRule`** (`app/lib/filter-rules.ts`) — декларативно сбрасывает конфликтующие фильтры при переключении чипов и в шторке фильтров.

### Страницы создания и редактирования (`EntityFormPage` + `*FormFields`)

Все формы создания и редактирования (`users`, `markets`, `sellers`, `products`, `debtors`) используют:
- **`EntityFormPage`** (`app/components/shared/EntityFormPage.tsx`) — единая обёртка со скелетоном загрузки, `EmptyState`, `BreadCrumbs`, карточкой формы и кнопками отправки/отмены.
- **`*FormFields`** (`app/components/forms/`) — общие поля сущности (`UserFormFields`, `MarketFormFields`, `SellerFormFields`, `ProductFormFields`, `DebtorFormFields`), переиспользуемые между `/create` и `/:id/edit`.
- **`useEntityMutation`** (`app/hooks/useEntityMutation.ts`) — стандартная мутация с авто-инвалидацией кэша и показом `toast.success`.

### Детальные страницы (`GET /:id/full`)

Детальные страницы `users`, `markets`, `sellers` и `debtors` загружают карточку сущности вместе с аналитикой и превью связанных списков одним запросом (`nestedDetailRequest` → `GET /<entity>/:id/full`) и используют общие компоненты `DetailLayout`, `KpiGrid`, `MiniCharts`, `SignalBlock`.

---

## Офлайн-режим и синхронизация (`Offline & Sync`)

Приложение спроектировано для стабильной работы на рынках со слабой связью:
1. **Источник истины о сети:** `useCapacitorNetworkStatus()` → `network-status.ts` → `onlineManager` TanStack Query (вместо ненадёжного `navigator.onLine`).
2. **Персистентный кэш:** `query-persister.ts` построчно сохраняет запросы чтения и paused-мутации в SQLite (`@capacitor-community/sqlite` на Android) или IndexedDB (в браузере).
3. **4 офлайн-мутации (`OFFLINE_MUTATION_KEYS`):** `createDebtor`, `createTransaction`, `payTransaction`, `refundTransaction`. Все 4 защищены заголовком `Idempotency-Key` на бэкенде.
4. **Мгновенный оверлей (`offline-overlay.ts`, `useOfflineOverlay.ts`):** операции из очереди сразу видны в списках должников и транзакций с бейджем «В очереди» (`PendingBadge`), пересчитывают долг и вычитают остаток товара на складе.
5. **Связка временных ID (`client-ids.ts`):** можно создать нового должника без сети (`local-<uuid>`) и тут же оформить на него продажу в долг — перед отправкой транзакции на сервер временный ID автоматически заменится реальным UUID.
6. **Отправка без ожидания (`useDetachedMutation`):** формы закрываются сразу офлайн или через `1.5 с` при медленной сети, продолжая отправку в фоне.

---

## Встроенный справочник (`/guide`)

Маршрут `/guide` работает полностью офлайн:
- Контент хранится в `public/locales/{ru,en,tg}/guide.json` и охватывает **9 разделов**:
  1. Начало работы (`gettingStarted`)
  2. Дашборд и аналитика (`dashboard`)
  3. Товары и склад (`products`)
  4. Транзакции, оплаты и возвраты (`transactions`)
  5. Должники и кредитный риск (`debtors`)
  6. Рынки (`markets`)
  7. Продавцы (`sellers`)
  8. Пользователи и роли (`users`)
  9. Офлайн-режим и синхронизация (`sync`)
- Интерфейс справочника декомпозирован в `app/components/guide/` (`GuideSidebar.tsx`, `GuideArticleView.tsx`, `GuideSearchModal.tsx`, `guide-highlight.tsx`).

---

## Команды

| Command                  | Description                                     |
| ------------------------ | ----------------------------------------------- |
| `npm run dev`            | Запуск development server (`:5173`)             |
| `npm run dev:fresh`      | Очистка Vite cache и запуск                     |
| `npm run build`          | Production build                                |
| `npm run typecheck`      | React Router type generation + TypeScript check |
| `npm run start`          | Production preview на порту `3000`              |
| `npm run test:e2e`       | Playwright E2E tests                            |
| `npx prettier --write .` | Форматирование и сортировка Tailwind classes    |

---

## Быстрый старт

```bash
cp .env.example .env       # VITE_API_URL=http://localhost:4000
npm install
npm run dev                # http://localhost:5173
```

---

## Сборка Android APK (Capacitor 8)

```bash
npm install
npm run build
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
```

Готовый APK: `android/app/build/outputs/apk/debug/app-debug.apk`. Также сборка автоматизирована в `.github/workflows/android.yml`.

---

## Документация для разработчиков

Подробные архитектурные правила, конвенции кода и чеклисты для добавления новых фич описаны в [AGENTS.md](./AGENTS.md).
