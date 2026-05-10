import { LocalStorageAdapter } from './localAdapter';
import type { StorageAdapter } from './adapter';

// Single source of truth for which backend the app uses. Swap to
// SupabaseAdapter (with a client) when accounts ship.
export const storage: StorageAdapter = new LocalStorageAdapter();

export type { StorageAdapter, DailyRollup } from './adapter';
