const { contextBridge, ipcRenderer } = require('electron');

// window.electronStorage — читает ElectronStorageAdapter (packages/storage-electron).
// contextIsolation: true означает, что renderer НЕ имеет прямого доступа к
// Node/better-sqlite3 — только к этим explicit-проброшенным методам.
contextBridge.exposeInMainWorld('electronStorage', {
  exec: (sql, params) => ipcRenderer.invoke('storage:exec', sql, params),
  query: (sql, params) => ipcRenderer.invoke('storage:query', sql, params),
  begin: () => ipcRenderer.invoke('storage:begin'),
  commit: () => ipcRenderer.invoke('storage:commit'),
  rollback: () => ipcRenderer.invoke('storage:rollback'),
});
