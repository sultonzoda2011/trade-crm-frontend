const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

// В деве (npm run electron:dev) грузим Vite dev-server, чтобы работал HMR.
// В собранном .exe грузим статику из build/client — тот же билд, что уходит
// на веб и в Capacitor, никакого отдельного UI под Electron нет и не нужно.
const isDev = !app.isPackaged;

// Дубликат SCHEMA_SQL из packages/offline-core/src/schema.ts. Держать в
// офлайн-пакетов без лишней build-инфраструктуры: main.cjs — обычный
// CJS-файл вне Vite/TS графа, а offline-core — ESM TS-пакет без
// compile-шага под Electron main. При правке схемы правь оба места.
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS categories (
  local_id TEXT PRIMARY KEY,
  server_id TEXT,
  name TEXT NOT NULL,
  market_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  dirty INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  local_id TEXT PRIMARY KEY,
  server_id TEXT,
  name TEXT NOT NULL,
  market_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  dirty INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS debtors (
  local_id TEXT PRIMARY KEY,
  server_id TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  market_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  dirty INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS transactions (
  local_id TEXT PRIMARY KEY,
  server_id TEXT,
  payload TEXT NOT NULL,
  status TEXT NOT NULL,
  market_id TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  dirty INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS markets (
  local_id TEXT PRIMARY KEY,
  server_id TEXT,
  name TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  local_id TEXT PRIMARY KEY,
  server_id TEXT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  market_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY,
  entity TEXT NOT NULL,
  method TEXT NOT NULL,
  url TEXT NOT NULL,
  local_id TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

/** @type {import('better-sqlite3').Database | null} */
let db = null;

function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'trade_crm.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA_SQL);

  // Один общий connection на всё приложение — better-sqlite3 синхронный,
  // так что begin/exec.../commit, приходящие последовательными IPC-вызовами
  // из renderer, физически ложатся в одну и ту же транзакцию SQLite.
  ipcMain.handle('storage:exec', (_event, sql, params = []) => {
    db.prepare(sql).run(...params);
  });

  ipcMain.handle('storage:query', (_event, sql, params = []) => {
    return db.prepare(sql).all(...params);
  });

  ipcMain.handle('storage:begin', () => db.exec('BEGIN'));
  ipcMain.handle('storage:commit', () => db.exec('COMMIT'));
  ipcMain.handle('storage:rollback', () => {
    // Может не быть активной транзакции, если сбой случился до BEGIN —
    // не даём этому уронить остальной flow.
    try {
      db.exec('ROLLBACK');
    } catch {
      /* no-op */
    }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '..', 'build', 'client', 'index.html'));
  }
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
