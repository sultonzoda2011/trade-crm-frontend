# TradeCRM Frontend

SPA-система управления торговлей (CRM) на React Router 7.
Работает и как веб-приложение, и как **Android-приложение** (обёртка Capacitor, сборка APK через GitHub Actions).
Backend: NestJS + Prisma + PostgreSQL (отдельный репозиторий).

---

## Возможности

- **CRUD** для сущностей: Users, Markets, Sellers, Products, Categories, Debtors, Transactions
- **RBAC**: 3 роли (Admin / Owner / Seller) — UI-гейтинг через `Action` enum и хук `useCan()`, гейт маршрутов и API-вызовов
- **Дашборд** с фильтрами (период + продавец), 4 вкладками (Обзор / Склад / Товары / Продавцы), метриками, графиками (Recharts) и отчётом по продавцам
- **Продажи и долги**: продажа, продажа в долг, возвраты; частичные/полные оплаты; статусы транзакций
- **Управление должниками**: карточки, метрики долга, уровень риска
- **Каталог товаров**: единицы измерения, остатки, пороги дозаказа, категории
- **Рынки**: список всех рынков (Admin) и детальная страница рынка с сотрудниками и товарами
- **Встроенное руководство** `/guide` — полный трилингвальный мануал по всем экранам с мощным поиском, работает офлайн (markdown вшит в бандл)
- **Мультиязычность**: русский, английский, таджикский (react-i18next, 14 неймспейсов, `ru` — fallback)
- **Тёмная/светлая тема** с семантическими токенами (next-themes + TailwindCSS 4)
- **Загрузка изображений** для рынков, продуктов и профиля (multipart/form-data, Cloudinary-URL)
- **Inline-фильтры** с debounce-поиском, `FilterSheet` для расширенных фильтров, виртуализированные таблицы
- **Мобильная интеграция**: аппаратная кнопка «Назад» (`useCapacitorBackButton`), статус-бар, синхронизированный с темой (`useCapacitorStatusBar`)

---

## Технический стек

| Категория     | Технологии                                                                                                            |
| ------------- | --------------------------------------------------------------------------------------------------------------------- |
| Framework     | React Router 7 (SPA, `ssr: false`)                                                                                    |
| View          | React 19 + TypeScript 5.9 + Vite 7                                                                                    |
| Мобильное     | Capacitor 8 (Android): плагины StatusBar + Keyboard, Back Button                                                      |
| Styling       | TailwindCSS 4 + tw-animate-css; шрифт Geist Variable                                                                  |
| UI primitives | shadcn/ui на **@base-ui/react** (не Radix; паттерн `render`-prop, не `asChild`)                                       |
| Таблицы       | @tanstack/react-table + @tanstack/react-virtual (виртуализация)                                                       |
| State         | Zustand (фабрики `createModalStore`, табличный стор `useTableStore`)                                                  |
| Server state  | @tanstack/react-query v5 (staleTime 60s, `keepPreviousData`)                                                          |
| HTTP          | Axios (единый инстанс, `withCredentials`; интерцепторы: RBAC-предпроверка по `API_ROUTE_ACTIONS`, 401 → `/login`)     |
| Forms         | react-hook-form + обёртка `useForm` (ревалидация при смене языка)                                                     |
| Validation    | Zod (схемы-фабрики `createXxxSchema(t)` с i18n-сообщениями)                                                           |
| Auth          | httpOnly cookie `accessToken` + читаемый `user` cookie (`withCredentials`); личность — `getClientUser()`, без Bearer   |
| i18n          | react-i18next + i18next-http-backend + remix-i18next                                                                  |
| Charts        | Recharts                                                                                                              |
| Dates         | dayjs + customParseFormat (всё через `toDayjs()` / `toDate()`)                                                        |
| Toasts        | sonner                                                                                                                |
| Icons         | lucide-react                                                                                                          |
| Overlays      | flatpickr (date pickers), cmdk (command palette)                                                                      |
| Navigation    | NProgress (top bar), React Router                                                                                     |
| Docs          | Встроенный `/guide` — no-dep markdown-рендерер, контент вшит через `import.meta.glob` (офлайн)                        |

---

## Маршруты

```
/auth layout (двухколоночный логин, LanguageSwitcher + ModeToggle)
  /login

/crm layout (сайдбар + хедер, защищён clientLoader-гейтом)
  /                              — Редирект по роли (Admin/Owner → /dashboard, Seller → /transactions)
  /dashboard                     — Дашборд (layout с фильтрами период + продавец)
    /dashboard        (index)    — Обзор: метрики, тренд доходов, долги, склад
    /dashboard/inventory         — Склад: что заказать, состояние склада, возвраты
    /dashboard/products          — Товары: лидеры по выручке/количеству, категории
    /dashboard/sellers           — Отчёт по продавцам
  /profile                       — Профиль текущего пользователя
  /users                         — Users list      (только Admin)
  /users/:id                     — User detail
  /markets                       — Markets list    (только Admin)
  /markets/:id                   — Market detail
  /sellers                       — Sellers list
  /sellers/:id                   — Seller detail
  /products                      — Products list
  /products/create               — Создание товара
  /products/:id                  — Product detail
  /products/:id/edit             — Редактирование товара
  /categories                    — Categories
  /categories/:id                — Category detail
  /debtors                       — Debtors list
  /debtors/:id                   — Debtor detail
  /transactions                  — Transactions list
  /transactions/create           — Создание транзакции
  /transactions/:id              — Transaction detail
  /guide                         — Встроенное руководство пользователя (все роли)
  /403                           — Доступ запрещён
  *                              — 404
```

---

## Команды

| Команда            | Описание                                                      |
| ------------------ | ------------------------------------------------------------- |
| `npm run dev`      | Vite dev server с HMR (http://localhost:5173)                 |
| `npm run dev:fresh`| Очистка `.vite` кэша + dev (лечит «залипший» HMR)             |
| `npm run build`    | Production сборка (`react-router build` → `build/client`)     |
| `npm run typecheck`| `react-router typegen && tsc` — основной автоматический гейт  |
| `npm run start`    | Запуск production-сборки (`vite preview`, порт 3000)          |
| `npm run test:e2e` | Playwright e2e (`playwright test`)                            |

> Линтера нет; `typecheck` и `build` — основные автоматические гейты.
> Форматирование: `npx prettier --write .` (сортировка Tailwind-классов через плагин).

---

## Начало работы

```bash
git clone <repo>
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:4000
npm install
npm run dev
```

Требуется запущенный backend TradeCRM API (NestJS) по адресу из `VITE_API_URL`.

---

## Мобильное приложение (Android / Capacitor)

Веб-бандл упаковывается в нативную Android-обёртку через Capacitor.

- **Конфиг**: `capacitor.config.ts` — `appId: com.tradecrm.app`, `appName: TradeCRM`, `webDir: build/client`, `androidScheme: https`.
- **Плагины**: StatusBar (`overlaysWebView: false`, цвет/стиль синхронизируются с темой в `app/hooks/useCapacitorStatusBar.ts`), Keyboard (`resize: body`) и обработка аппаратной кнопки «Назад» (`app/hooks/useCapacitorBackButton.ts`).
- **Ассеты**: иконки и splash-экраны в `assets/` (генерация через `@capacitor/assets`).
- **Локальная сборка**:

  ```bash
  npm run build            # статический SPA-бандл в build/client
  npx cap add android      # один раз — создаёт папку android/ (в .gitignore)
  npx cap sync android     # копирует бандл + плагины в нативный проект
  cd android && ./gradlew assembleDebug
  ```

- **CI**: `.github/workflows/android.yml` («Build APK») запускается на push в `main` и вручную (`workflow_dispatch`). Шаги: typecheck → build (`VITE_API_URL` из секрета `API_URL`) → `cap add android` → генерация иконок (`@capacitor/assets`) → `cap sync` → `gradlew assembleDebug` → загрузка артефакта `trade-crm-apk` (`app-debug.apk`).

---

## Встроенная документация (`/guide`)

Полное руководство пользователя прямо внутри приложения — открывается из пункта сайдбара и кнопки «?» в хедере.

- Разделы: Основы, Дашборд, Продажи, Должники, Товары, Рынки, Продавцы/Пользователи, Профиль.
- Три языка (ru/en/tg), мощный поиск с подсветкой и счётчиком совпадений.
- Контент — markdown-файлы `app/routes/(crm)/guide/content/{lng}/{id}.md`, вшитые в бандл через `import.meta.glob` (никаких сетевых запросов → работает офлайн в APK).
- Реестр разделов — `sections.ts`; заголовки/описания — неймспейс `guide` в `public/locales/*/guide.json`.
- Рендерер — собственный no-dep компонент `app/components/shared/Markdown.tsx` (заголовки, таблицы, списки, callout-блоки `> [!TIP]`, код, ссылки).

Как добавить раздел: положить три md-файла (ru/en/tg), добавить элемент в `GUIDE_SECTIONS` (`sections.ts`) с иконкой lucide и добавить ключи `sections.<id>.title` / `.summary` в три `guide.json`.

---

## Структура проекта

```
app/
  routes.ts             # Роутинг (декларативная конфигурация)
  routes/
    (auth)/             # Auth layout + login
    (crm)/              # CRM layout + все страницы
      dashboard/        # layout + overview/inventory/products/sellers-report
      guide/            # route.tsx + content/{ru,en,tg}/*.md + sections.ts + content-loader.ts
      <entity>/         # route.tsx, store.ts, id/route.tsx, create|edit
  api/                  # API-модули по сущностям (единый axios-инстанс)
  components/
    ui/                 # Примитивы (~30 шт. на @base-ui/react)
    ui/form/            # Form-обёртки для react-hook-form (5 шт.)
    shared/             # Переиспользуемые компоненты (~39 шт., в т.ч. Markdown, DataTable)
    modals/             # Модальные окна (~15 шт.)
    dashboard/          # Виджеты дашборда (~11 шт.)
    layout/             # Header, Sidebar, NavMain, UserNav, ModeToggle, LanguageSwitcher
  config/               # permissions, navigation, actions, period, enumOptions, *_badges
  hooks/                # useCan, useDataTable, useDebounce, useForm, use-mobile, useCapacitor*
  lib/                  # client, auth-utils, date, format, i18n, query-client, cloudinary, utils
  store/                # Zustand-фабрики (createModalStore) + useTableStore
  types/                # TypeScript-типы сущностей
  validations/          # Zod-схемы
  styles/global.css     # Глобальные стили, тема, анимации
public/
  locales/{ru,en,tg}/   # Переводы (14 неймспейсов на язык)
  locales/icons/        # Флаги для переключателя языка
assets/                 # Иконки и splash для Capacitor (@capacitor/assets)
capacitor.config.ts     # Конфиг мобильной обёртки
android/                # Нативный Android-проект (генерируется cap add android, в .gitignore)
.github/workflows/      # android.yml — сборка APK
Dockerfile              # Multi-stage сборка веб-версии
vercel.json             # Конфиг деплоя на Vercel
```

---

## RBAC

Роли: `Admin`, `Owner`, `Seller`. Гейтинг фичи затрагивает **четыре** поверхности:

- **`routes.ts`** — регистрация маршрута.
- **`ROUTE_PERMISSIONS`** (`app/config/permissions.ts`) — маппинг маршрут → `Role[]`. Незарегистрированный маршрут по умолчанию доступен всем.
- **`Action` enum + `ACTION_PERMISSIONS`** (`app/config/actions.ts`) — дискретные права; UI гейтится через `useCan().can(Action.X)`, а не сравнением ролей строками.
- **`API_ROUTE_ACTIONS`** (`app/lib/client.ts`) — предпроверка прав на уровне axios-интерцептора: неверная запись блокирует вызов ещё в браузере.

Guard-логика:

- **`(crm)/layout.tsx`** — `clientLoader`-гейт всех защищённых страниц: нет пользователя → `/login`, роль не подходит → `/403`.
- **`(crm)/index.tsx`** — редирект по роли с `/`.
- Личность на клиенте — `getClientUser()` (читает `user` cookie), а не декодирование JWT.

---

## Окружение

| Переменная     | По умолчанию            | Описание                    |
| -------------- | ----------------------- | --------------------------- |
| `VITE_API_URL` | `http://localhost:4000` | URL backend API (без слеша) |

В CI-сборке APK значение берётся из секрета репозитория `API_URL`.

---

## Docker (веб-версия)

```bash
docker build -t trade-crm .
docker run -p 3000:3000 trade-crm
```

Multi-stage сборка на `node:20-alpine`; контейнер запускает `npm run start` (`vite preview` на порту 3000).
