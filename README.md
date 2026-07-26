# TradeCRM Frontend

SPA-система управления торговлей (CRM) на React Router 7.  
Backend: NestJS + Prisma + PostgreSQL.

---

## Возможности

- **CRUD** для сущностей: Users, Markets, Sellers, Products, Categories, Debtors, Transactions
- **RBAC**: 3 роли (Admin / Owner / Seller) — UI-гейтинг через Action enum и хук `useCan()`
- **Мультиязычность**: русский, английский, таджикский (react-i18next, 10 неймспейсов)
- **Тёмная/светлая тема** с семантическими токенами (next-themes, TailwindCSS)
- **Дашборд** со статистикой, графиками (Recharts) и отчётом по продавцам
- **Управление долгами**: создание транзакций в долг, частичные/полные оплаты, возвраты
- **Загрузка изображений** для рынков и продуктов (multipart/form-data)
- **Inline-фильтры** с debounce-поиском, FilterSheet для расширенных фильтров

---

## Технический стек

| Категория | Технологии |
|-----------|------------|
| Framework | React Router 7 (SPA, `ssr: false`) |
| View | React 19 + TypeScript 5.9 + Vite 7 |
| Styling | TailwindCSS 4 + tw-animate-css |
| UI primitives | shadcn/ui на **@base-ui/react** (не Radix) |
| State | Zustand (createTableStore / createModalStore фабрики) |
| Server state | @tanstack/react-query v5 (staleTime: 60s, keepPreviousData) |
| HTTP | Axios (интерцепторы: JWT, refresh, тосты ошибок) |
| Forms | react-hook-form + @hookform/resolvers/zod |
| Validation | Zod (схемы-фабрики с i18n сообщениями) |
| Auth | JWT в cookie, jwt-decode, requireAuth() в clientLoader |
| i18n | react-i18next + i18next-http-backend |
| Charts | Recharts |
| Dates | dayjs + customParseFormat |
| Icons | lucide-react |
| Overlays | flatpickr (date pickers), cmdk (command palette) |
| Navigation | NProgress (top bar), React Router |

---

## Маршруты

```
/auth layout (двухколоночный логин, LanguageSwitcher + ModeToggle)
  /login

/crm layout (сайдбар + хедер, защищён requireAuth)
  /                              — Dashboard
  /users                         — Users list
  /users/:id                     — User detail
  /markets                       — Markets list
  /markets/:id                   — Market detail
  /sellers                       — Sellers list
  /sellers/:id                   — Seller detail
  /products                      — Products list
  /products/:id                  — Product detail
  /categories                    — Categories
  /dashboard/sellers-report      — Отчёт по продавцам
  /debtors                       — Debtors list
  /debtors/:id                   — Debtor detail
  /transactions                  — Transactions list
  /transactions/:id              — Transaction detail
```

---

## Команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Vite dev server с HMR (http://localhost:5173) |
| `npm run dev:fresh` | Очистка `.vite` кэша + dev |
| `npm run build` | Production сборка (react-router build) |
| `npm run typecheck` | `react-router typegen && tsc` |
| `npm run start` | Запуск production сборки |

---

## Начало работы

```bash
git clone <repo>
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:4000
npm install
npm run dev
```

---

## Структура проекта

```
app/
  routes/               # Маршруты + их компоненты
    (auth)/             # Auth layout + login
    (crm)/              # CRM layout + все страницы
  api/                  # API модули (axios)
  components/
    ui/                 # Примитивы (28 шт. на @base-ui/react)
    ui/form/            # Form-обёртки для react-hook-form
    shared/             # Переиспользуемые компоненты (20 шт.)
    modals/             # Модальные окна (12 шт.)
    layout/             # Header, Sidebar, NavMain, UserNav и т.д.
  config/               # permissions, navigation, actions, enumOptions
  hooks/                # useCan, useDataTable, useDebounce, useForm, useIsMobile
  lib/                  # client, auth-utils, date, format, i18n, query-client, utils
  store/                # Zustand фабрики (createTableStore, createModalStore)
  types/                # TypeScript типы сущностей
  validations/          # Zod схемы
  styles/
    global.css          # Глобальные стили, тема, анимации
public/
  locales/              # Переводы (ru/en/tg, по 10 неймспейсов)
```

---

## RBAC

Роли: `Admin`, `Owner`, `Seller`.

- **Action enum** — дискретные права (USERS_CREATE, TRANSACTIONS_REFUND и т.д.)
- **ACTION_PERMISSIONS** — маппинг Action → Role[]
- **ROUTE_PERMISSIONS** — маппинг route pattern → Role[]
- **`useCan()`** — хук для UI-гейтинга: `can(Action.USERS_EDIT)` или `can(Role.Admin)`
- **`requireAuth()`** — guard в `clientLoader`, редирект на `/login` при отсутствии/просрочке токена

---

## Окружение

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `VITE_API_URL` | `http://localhost:4000` | URL backend API (без слеша) |

---

## Docker

```bash
docker build -t trade-crm .
docker run -p 3000:3000 trade-crm
```

Multi-stage сборка на node:20-alpine.
