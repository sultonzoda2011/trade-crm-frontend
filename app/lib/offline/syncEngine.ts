// Compatibility exports for callers that still import the legacy sync-engine path.
// The active implementation lives in useSyncEngine.ts and uses the current
// SyncState API (runPush, runPull, and refreshPendingCount).
export { initSyncState, runSync } from '~/hooks/useSyncEngine';
