import { LocalStorageAdapter } from './localAdapter';
import type { StorageAdapter } from './adapter';

export const guestStorage = new LocalStorageAdapter();

let activeStorage: StorageAdapter = guestStorage;

export function setStorageAdapter(adapter: StorageAdapter): void {
  activeStorage = adapter;
}

// Single source of truth for storage. It delegates to the current adapter so
// existing UI imports do not need to change when auth switches storage backend.
export const storage: StorageAdapter = {
  loadSettings: () => activeStorage.loadSettings(),
  saveSettings: (settings) => activeStorage.saveSettings(settings),
  appendSet: (set) => activeStorage.appendSet(set),
  listSets: (opts) => activeStorage.listSets(opts),
  clearSets: () => activeStorage.clearSets(),
  clearAll: () => activeStorage.clearAll(),
};

export type { StorageAdapter, DailyRollup } from './adapter';
